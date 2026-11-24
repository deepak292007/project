// Typed API client for ArogyaLink backend
export const getBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    // In production or cloud host (e.g. Vercel), default to relative /api path
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
    const host = window.location.hostname || 'localhost';
    return `http://${host}:4000`;
  }
  return 'http://localhost:4000';
};

export const BASE = getBaseUrl();

export type ApiResponse<T> = { data: T } | { error: string };

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  try {
    const base = getBaseUrl();
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('al_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json.data ?? json;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    throw new Error(msg);
  }
}

// ─── Health ───────────────────────────────────────────────────────
export const health = () => req<{ status: string; db: string }>('GET', '/api/health');
export const seed   = () => req<{ ok: boolean; patients: number }>('POST', '/api/seed');

// ─── Patients ─────────────────────────────────────────────────────
export const getPatients  = (params?: Record<string, string>) =>
  req<Patient[]>('GET', `/api/patients?${new URLSearchParams(params)}`);
export const getPatient   = (id: string) => req<Patient>('GET', `/api/patients/${id}`);
export const createPatient = (body: Partial<Patient>) => req<Patient>('POST', '/api/patients', body);
export const patchPatient  = (id: string, body: Partial<Patient>) => req<Patient>('PATCH', `/api/patients/${id}`, body);

// ─── Encounters ───────────────────────────────────────────────────
export const getEncounters  = (params?: Record<string, string>) =>
  req<Encounter[]>('GET', `/api/encounters?${new URLSearchParams(params)}`);
export const createEncounter = (body: Partial<Encounter>) => req<Encounter>('POST', '/api/encounters', body);
export const patchEncounter  = (id: string, body: Partial<Encounter>) => req<Encounter>('PATCH', `/api/encounters/${id}`, body);

// ─── Referrals ────────────────────────────────────────────────────
export const getReferrals  = (params?: Record<string, string>) =>
  req<Referral[]>('GET', `/api/referrals?${new URLSearchParams(params)}`);
export const createReferral = (body: Partial<Referral>) => req<Referral>('POST', '/api/referrals', body);
export const advanceReferral = (id: string, stage: string, by: string, role: string, notes?: string) =>
  req<Referral>('PATCH', `/api/referrals/${id}/stage`, { stage, updatedBy: by, role, notes });

// ─── Facilities ───────────────────────────────────────────────────
export const getFacilities  = () => req<Facility[]>('GET', '/api/facilities');
export const getFacility    = (fid: string) => req<Facility>('GET', `/api/facilities/${fid}`);
export const patchFacility  = (fid: string, body: Partial<Facility>) => req<Facility>('PATCH', `/api/facilities/${fid}`, body);

// ─── Stock ────────────────────────────────────────────────────────
export const getStock   = (params?: Record<string, string>) =>
  req<StockItem[]>('GET', `/api/stock?${new URLSearchParams(params)}`);
export const patchStock = (id: string, body: Partial<StockItem>) => req<StockItem>('PATCH', `/api/stock/${id}`, body);

// ─── Follow-ups ───────────────────────────────────────────────────
export const getFollowups  = (params?: Record<string, string>) =>
  req<Followup[]>('GET', `/api/followups?${new URLSearchParams(params)}`);
export const patchFollowup = (id: string, body: Partial<Followup>) => req<Followup>('PATCH', `/api/followups/${id}`, body);

// ─── Feedback ─────────────────────────────────────────────────────
export const getFeedback    = () => req<FeedbackItem[]>('GET', '/api/feedback');
export const createFeedback = (body: Partial<FeedbackItem>) => req<FeedbackItem>('POST', '/api/feedback', body);

// ─── Audit ────────────────────────────────────────────────────────
export const getAuditLog = () => req<AuditEntry[]>('GET', '/api/audit');

// ─── Triage ───────────────────────────────────────────────────────
export const runTriage = (body: { symptoms: string[]; vitals: Record<string, unknown>; context?: string; lang?: string }) =>
  req<TriageResult>('POST', '/api/triage', body);

// ─── Analytics ──────────────────────────────────────────────────────────
export const getKPIs = () => req<KPIs>('GET', '/api/analytics/kpis');

// ─── Distance finder ──────────────────────────────────────────────────
export const getNearbyFacilities = (lat: number, lng: number, level?: string) =>
  req<unknown[]>('GET', `/api/distance?lat=${lat}&lng=${lng}${level ? `&level=${level}` : ''}`);

// ─── Generic post ─────────────────────────────────────────────────────────
export const post = <T = unknown>(path: string, body: unknown) => req<T>('POST', path, body);
export const get  = <T = unknown>(path: string) => req<T>('GET', path);

// ─── Local types used only for API calls ──────────────────────────
// (Full types live in types.ts — these are structural aliases)
import type {
  Patient, Encounter, Referral, Facility,
  StockItem, Followup, FeedbackItem, AuditEntry, TriageResult, KPIs
} from '../types';
