import React, { useEffect, useState } from 'react';
import { LoginGateway } from './LoginGateway';
import { GovHeader } from './components/layout/GovHeader';
import { SideNav } from './components/layout/SideNav';
import { Footer } from './components/layout/PageShell';
import { PatientView } from './views/patient/PatientView';
import { ASHAView } from './views/asha/ASHAView';
import { PHCView } from './views/phc/PHCView';
import { HospitalView } from './views/hospital/HospitalView';
import { DoctorView } from './views/doctor/DoctorView';
import { AdminView } from './views/admin/AdminView';
import { useSession, useUI, useSyncStore } from './store';
import { onVoiceChange } from './lib/voice';
import * as api from './lib/api';
import type { Role } from './types';

// WebSocket connection for real-time updates
let ws: WebSocket | null = null;

function connectWS(onMessage: (type: string, data: unknown) => void) {
  try {
    const wsProto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
    ws = new WebSocket(`${wsProto}//${wsHost}:4000`);
    ws.onmessage = (e) => {
      try { const msg = JSON.parse(e.data); onMessage(msg.type, msg.data); } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = () => { setTimeout(() => connectWS(onMessage), 5000); };
  } catch {}
}

// ─── Role view router ─────────────────────────────────────────────
function RoleView({ role, view, onNavigate }: { role: Role; view: string; onNavigate: (id: string) => void }) {
  switch (role) {
    case 'patient':
      return <PatientView view={view as any} onNavigate={onNavigate} />;
    case 'asha':
      return <ASHAView view={view as any} />;
    case 'phc_doctor':
      return <PHCView view={view as any} />;
    case 'hospital_admin':
      return <HospitalView view={view as any} />;
    case 'hospital_doctor':
      return <DoctorView view={view as any} />;
    case 'district_admin':
      return <AdminView view={view as any} />;
    default:
      return <div style={{ padding: 40 }}>Role not implemented</div>;
  }
}

// ─── Default views per role ───────────────────────────────────────
const DEFAULT_VIEW: Record<Role, string> = {
  patient:         'symptom',
  asha:            'home',
  phc_doctor:      'queue',
  hospital_admin:  'beds',
  hospital_doctor: 'chart',
  district_admin:  'kpis',
};

// ─── Voice transcript bar ─────────────────────────────────────────
const VoiceBar: React.FC = () => {
  const { voiceTranscript, voiceSpeaking } = useUI();
  if (!voiceSpeaking && !voiceTranscript) return null;
  return (
    <div className="voice-transcript-strip">
      <div className="vt-icon" />
      <span style={{ fontWeight: 600, marginRight: 6 }}>
        {voiceSpeaking ? '▶' : '💬'}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{voiceTranscript}</span>
    </div>
  );
};

// ─── Seed prompt for jury demo ─────────────────────────────────────
const SeedPrompt: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'seeding' | 'done' | 'error'>('idle');
  const [show, setShow] = useState(false);

  async function seed() {
    setStatus('seeding');
    try {
      const res = await api.seed();
      if (res.ok) setStatus('done');
      else setStatus('error');
    } catch { setStatus('error'); }
  }

  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 1000 }}>
      {!show ? (
        <button onClick={() => setShow(true)} className="btn btn-ghost btn-sm" style={{ opacity: 0.6, fontSize: '0.75rem' }}>
          Demo Setup
        </button>
      ) : (
        <div className="card" style={{ width: 300, boxShadow: 'var(--shadow-modal)' }}>
          <div className="card-body">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Demo Database Setup</div>
            <p className="text-sm text-muted" style={{ marginBottom: 12 }}>Seed MongoDB with Palghar district demo data (5 facilities, 7 patients, Savita Patil's complete case).</p>
            {status === 'done' && <div style={{ color: 'var(--col-green)', marginBottom: 8, fontWeight: 600 }}>✓ Database seeded successfully</div>}
            {status === 'error' && <div style={{ color: 'var(--col-red)', marginBottom: 8 }}>Error — check if API server is running on port 4000</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={seed} disabled={status === 'seeding' || status === 'done'} className="btn btn-primary btn-sm">
                {status === 'seeding' ? 'Seeding...' : 'Seed Database'}
              </button>
              <button onClick={() => setShow(false)} className="btn btn-ghost btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────
const App: React.FC = () => {
  const { isLoggedIn, role, online, setOnline } = useSession();
  const { activeNav, setActiveNav, setVoiceState } = useUI();
  const { pending } = useSyncStore();

  // Set default view on role change
  const [view, setView] = useState<string>(DEFAULT_VIEW[role] || 'home');

  useEffect(() => {
    setView(DEFAULT_VIEW[role] || 'home');
  }, [role]);

  // Hash-based navigation listener (supports #opd, #facility, #book, etc.)
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.replace('#', '');
      if (h) {
        navigate(h);
      }
    };
    if (window.location.hash) {
      handleHash();
    }
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Voice state sync
  useEffect(() => {
    const unsub = onVoiceChange((t, s) => setVoiceState(t, s));
    return () => unsub();
  }, [setVoiceState]);

  // Online/offline detection
  useEffect(() => {
    const online = () => setOnline(true);
    const offline = () => setOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, [setOnline]);

  // WebSocket connection
  useEffect(() => {
    if (!isLoggedIn) return;
    connectWS((type, data) => {
      // Real-time handlers (would update relevant Zustand stores in production)
      if (type === 'sos-alert') console.log('SOS Alert:', data);
      if (type === 'referral-stage') console.log('Referral updated:', data);
    });
    return () => { ws?.close(); ws = null; };
  }, [isLoggedIn]);

  function navigate(navId: string) {
    setView(navId);
    setActiveNav(navId);
  }

  if (!isLoggedIn) return (
    <>
      <LoginGateway />
      <SeedPrompt />
    </>
  );

  return (
    <div id="root">
      <GovHeader />
      <div className="app-shell">
        <SideNav onNavigate={navigate} />
        <RoleView role={role} view={view} onNavigate={navigate} />
      </div>
      <Footer />
      <VoiceBar />
      <SeedPrompt />
    </div>
  );
};

export default App;
