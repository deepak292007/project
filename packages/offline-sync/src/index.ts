import { FHIRPatient, FHIREncounter, FHIRServiceRequest, HighRiskTask } from '@srhacp/fhir-models';

export interface QueuedSyncItem {
  id: string;
  resourceType: 'Patient' | 'Encounter' | 'ServiceRequest' | 'Task' | 'EmergencySOS';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: string;
  retryCount: number;
  status: 'PENDING' | 'SYNCING' | 'SUCCESS' | 'FAILED';
  errorMessage?: string;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  syncErrors: string[];
}

const DB_NAME = 'srhacp_offline_db';
const DB_VERSION = 1;
const STORE_QUEUE = 'sync_queue';
const STORE_PATIENTS = 'patients';
const STORE_ENCOUNTERS = 'encounters';
const STORE_REFERRALS = 'referrals';
const STORE_TASKS = 'tasks';

class OfflineSyncManager {
  private db: IDBDatabase | null = null;
  private syncListeners: ((state: SyncState) => void)[] = [];
  private state: SyncState = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
    syncErrors: []
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }
      if (typeof indexedDB === 'undefined') {
        // Fallback for SSR or non-browser environments
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_PATIENTS)) {
          db.createObjectStore(STORE_PATIENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_ENCOUNTERS)) {
          db.createObjectStore(STORE_ENCOUNTERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_REFERRALS)) {
          db.createObjectStore(STORE_REFERRALS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_TASKS)) {
          db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.refreshPendingCount();
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private handleNetworkChange(isOnline: boolean) {
    this.state.isOnline = isOnline;
    this.notify();
    if (isOnline) {
      this.triggerBackgroundSync();
    }
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.state);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.syncListeners.forEach(listener => listener({ ...this.state }));
  }

  public async saveLocallyAndQueue(
    resourceType: 'Patient' | 'Encounter' | 'ServiceRequest' | 'Task' | 'EmergencySOS',
    action: 'CREATE' | 'UPDATE',
    payload: any
  ): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    const storeName = this.getStoreNameForResource(resourceType);

    // Save to local read cache
    if (storeName) {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(payload);
    }

    // Add to sync queue
    const queueTx = this.db.transaction([STORE_QUEUE], 'readwrite');
    const queueStore = queueTx.objectStore(STORE_QUEUE);
    const queueItem: QueuedSyncItem = {
      id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      resourceType,
      action,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'PENDING'
    };
    queueStore.put(queueItem);

    await this.refreshPendingCount();

    if (this.state.isOnline) {
      this.triggerBackgroundSync();
    }
  }

  private getStoreNameForResource(resourceType: string): string | null {
    switch (resourceType) {
      case 'Patient': return STORE_PATIENTS;
      case 'Encounter': return STORE_ENCOUNTERS;
      case 'ServiceRequest': return STORE_REFERRALS;
      case 'Task': return STORE_TASKS;
      default: return null;
    }
  }

  public async getLocalPatients(): Promise<FHIRPatient[]> {
    return this.getAllFromStore<FHIRPatient>(STORE_PATIENTS);
  }

  public async getLocalEncounters(): Promise<FHIREncounter[]> {
    return this.getAllFromStore<FHIREncounter>(STORE_ENCOUNTERS);
  }

  public async getLocalReferrals(): Promise<FHIRServiceRequest[]> {
    return this.getAllFromStore<FHIRServiceRequest>(STORE_REFERRALS);
  }

  public async getLocalTasks(): Promise<HighRiskTask[]> {
    return this.getAllFromStore<HighRiskTask>(STORE_TASKS);
  }

  private async getAllFromStore<T>(storeName: string): Promise<T[]> {
    await this.initDB();
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  public async refreshPendingCount(): Promise<number> {
    await this.initDB();
    if (!this.db) return 0;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction([STORE_QUEUE], 'readonly');
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.count();
        req.onsuccess = () => {
          this.state.pendingCount = req.result;
          this.notify();
          resolve(req.result);
        };
        req.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  public async triggerBackgroundSync(apiBaseUrl: string = '/api'): Promise<void> {
    if (this.state.isSyncing || !this.state.isOnline) return;

    await this.initDB();
    if (!this.db) return;

    this.state.isSyncing = true;
    this.notify();

    try {
      const items = await this.getAllFromStore<QueuedSyncItem>(STORE_QUEUE);
      for (const item of items) {
        try {
          const endpoint = `${apiBaseUrl}/sync`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });

          if (response.ok) {
            // Remove from queue
            const delTx = this.db.transaction([STORE_QUEUE], 'readwrite');
            delTx.objectStore(STORE_QUEUE).delete(item.id);
          }
        } catch (err: any) {
          console.warn('Sync item failed temporarily:', err);
        }
      }

      this.state.lastSyncedAt = new Date().toISOString();
    } catch (e: any) {
      this.state.syncErrors.push(e.message || 'Sync failed');
    } finally {
      this.state.isSyncing = false;
      await this.refreshPendingCount();
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager();
