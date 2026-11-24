import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSession, Lang, Role, PendingRecord } from '../types';

// ─── Session Store ────────────────────────────────────────────────
interface SessionState extends UserSession {
  isLoggedIn: boolean;
  login: (role: Role, name: string, lang: Lang, facilityId?: string, facilityName?: string) => void;
  logout: () => void;
  setLang: (lang: Lang) => void;
  setOnline: (v: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      role: 'patient',
      name: '',
      lang: (typeof window !== 'undefined' && localStorage.getItem('al_lang') as Lang) || 'te',
      online: true,
      facilityId: undefined,
      facilityName: undefined,

      login: (role, name, lang, facilityId, facilityName) => {
        if (typeof window !== 'undefined') localStorage.setItem('al_lang', lang);
        set({ isLoggedIn: true, role, name, lang, facilityId, facilityName });
      },

      logout: () =>
        set({ isLoggedIn: false, role: 'patient', name: '', facilityId: undefined, facilityName: undefined }),

      setLang: (lang) => {
        if (typeof window !== 'undefined') localStorage.setItem('al_lang', lang);
        set({ lang });
      },
      setOnline: (online) => set({ online }),
    }),
    { name: 'al-session' }
  )
);

// ─── Offline Sync Store ───────────────────────────────────────────
interface SyncState {
  pending: PendingRecord[];
  addPending: (rec: Omit<PendingRecord, 'id' | 'createdAt'>) => void;
  removePending: (id: string) => void;
  clearAll: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      pending: [],
      addPending: (rec) =>
        set(s => ({
          pending: [...s.pending, {
            ...rec,
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            createdAt: new Date().toISOString()
          }]
        })),
      removePending: (id) => set(s => ({ pending: s.pending.filter(p => p.id !== id) })),
      clearAll: () => set({ pending: [] })
    }),
    { name: 'al-sync' }
  )
);

// ─── UI State Store ───────────────────────────────────────────────
interface UIState {
  activeNav: string;
  setActiveNav: (v: string) => void;
  voiceTranscript: string;
  voiceSpeaking: boolean;
  setVoiceState: (transcript: string, speaking: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  activeNav: 'home',
  setActiveNav: (activeNav) => set({ activeNav }),
  voiceTranscript: '',
  voiceSpeaking: false,
  setVoiceState: (voiceTranscript, voiceSpeaking) => set({ voiceTranscript, voiceSpeaking }),
}));
