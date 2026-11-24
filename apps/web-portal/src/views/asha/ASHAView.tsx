import React, { useEffect, useState, useCallback } from 'react';
import { PageShell, OfflineBanner, EmptyState, SkeletonRow } from '../../components/layout/PageShell';
import { ReferralSummaryCard } from '../../components/shared/ReferralPipeline';
import { TeleconsultPanel } from '../../components/shared/TeleconsultPanel';
import { DistanceFinder } from '../../components/shared/DistanceFinder';
import { useSession, useSyncStore } from '../../store';
import { speak, speakScript, speakTriage } from '../../lib/voice';
import * as api from '../../lib/api';
import type { Patient, Followup, Referral, Vitals, ReferralStage } from '../../types';

type View = 'home' | 'intake' | 'register' | 'followups' | 'sync' | 'teleconsult' | 'distance' | 'referrals';

interface ASHAHomeProps { view: View; }

// ─── High-Risk List ───────────────────────────────────────────────
const HighRiskList: React.FC = () => {
  const { name, lang, online } = useSession();
  const { pending, addPending } = useSyncStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals>({ bp: '', pulse: undefined, temp: undefined, spo2: undefined, weight: undefined });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pts, fups] = await Promise.all([
          api.getPatients({ asha: name, risk: 'high' }).catch(() => [] as Patient[]),
          api.getFollowups({ ashaWorker: name, completed: 'false' }).catch(() => [] as Followup[])
        ]);
        setPatients(pts);
        setFollowups(fups);
        if (pts.length > 0) speakScript('followup_reminder', lang);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [name, lang]);

  async function saveVitals() {
    if (!selected) return;
    setSaving(true);
    const encounter = {
      patientId: selected._id,
      facilityId: 'SC-KELWA-01',
      facilityName: 'Sub-Centre Kelwa',
      type: 'OPD' as const,
      department: 'MCH',
      status: 'completed' as const,
      vitals,
      notes,
      conductedBy: name,
      conductedAt: new Date().toISOString(),
      role: 'asha'
    };
    if (online) {
      try {
        await api.createEncounter(encounter);
        setSaved(true);
        speak(`${selected.name} यांच्या नोंदी जतन झाल्या.`, lang);
      } catch {
        addPending({ type: 'encounter', data: encounter });
      }
    } else {
      addPending({ type: 'encounter', data: encounter });
      speak('ऑफलाइन नोंद जतन झाली. कनेक्शन मिळाल्यावर समक्रमित होईल.', lang);
    }
    setSaving(false);
    setSelected(null);
    setNotes('');
    setVitals({ bp: '', pulse: undefined, temp: undefined, spo2: undefined, weight: undefined });
  }

  const RISK_COLOR: Record<string, string> = { high: 'var(--col-red)', moderate: 'var(--col-amber)', low: 'var(--col-green)' };

  return (
    <div>
      {pending.length > 0 && (
        <OfflineBanner pendingCount={pending.length} onSync={() => {}} />
      )}

      {saved && (
        <div className="offline-banner" style={{ background: 'var(--col-green-bg)', borderColor: 'var(--col-green-border)', color: 'var(--col-green)' }}>
          ✓ Vitals saved successfully
        </div>
      )}

      {/* Today's follow-ups */}
      {followups.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Today's Follow-up Tasks ({followups.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {followups.slice(0, 5).map(f => {
              const p = typeof f.patientId === 'object' ? f.patientId : null;
              return (
                <div key={f._id} className="card" style={{ borderLeft: `3px solid ${RISK_COLOR[f.priority]}` }}>
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px' }}>
                    <span className={`badge badge-${f.priority}`}>{f.priority}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{p ? p.name : '—'}</div>
                      <div className="text-sm text-muted">{f.type} · Due {new Date(f.dueDate).toLocaleDateString('en-IN')}</div>
                      {f.notes && <div className="text-sm" style={{ marginTop: 4 }}>{f.notes}</div>}
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={() => p && setSelected(p as Patient)}>
                      Record Vitals
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* High-risk patients */}
      <div className="section-title">High-Risk Patients — {name}</div>
      {loading ? (
        <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
      ) : patients.length === 0 ? (
        <EmptyState message="No high-risk patients assigned" sub="Your assigned high-risk patients will appear here." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient</th><th>Village</th><th>Age/Sex</th><th>Conditions</th><th>Last Seen</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p._id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  {p.nameMarathi && <div className="text-xs text-muted">{p.nameMarathi}</div>}
                  {p.abhaId && <div className="text-xs" style={{ fontFamily: 'monospace', color: 'var(--col-ink-muted)' }}>{p.abhaId}</div>}
                </td>
                <td className="text-sm">{p.village}</td>
                <td className="text-sm">{p.age}y / {p.gender}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.conditions.map(c => <span key={c} className="badge badge-neutral text-xs">{c}</span>)}
                  </div>
                </td>
                <td className="text-sm">{p.lastSeen ? new Date(p.lastSeen).toLocaleDateString('en-IN') : '—'}</td>
                <td>
                  <button className="btn btn-sm btn-primary" onClick={() => setSelected(p)}>
                    Record Vitals
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Vitals modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-modal)' }}>
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Record Vitals — {selected.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="card-body">
              {!online && <div className="offline-banner" style={{ marginBottom: 16 }}>Offline — will sync when connected</div>}
              <div className="vitals-grid" style={{ marginBottom: 16 }}>
                {[
                  { label: 'BP (mmHg)', key: 'bp', type: 'text', placeholder: '120/80' },
                  { label: 'Pulse (bpm)', key: 'pulse', type: 'number', placeholder: '72' },
                  { label: 'Temp (°C)', key: 'temp', type: 'number', placeholder: '37.0' },
                  { label: 'SpO2 (%)', key: 'spo2', type: 'number', placeholder: '98' },
                  { label: 'Weight (kg)', key: 'weight', type: 'number', placeholder: '60' },
                ].map(f => (
                  <div key={f.key} className="vital-cell" style={{ background: 'white' }}>
                    <span className="vital-label">{f.label}</span>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={(vitals as Record<string, unknown>)[f.key] as string || ''}
                      onChange={e => setVitals(v => ({ ...v, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="form-control"
                      style={{ marginTop: 4, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                    />
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Observations</label>
                <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any symptoms, complaints, observations..." />
              </div>
            </div>
            <div className="card-footer">
              <button onClick={saveVitals} disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : online ? 'Save to Server' : 'Save Offline'}
              </button>
              <button onClick={() => setSelected(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Register New Patient ─────────────────────────────────────────
const RegisterPatient: React.FC = () => {
  const { name: ashaName, lang, online } = useSession();
  const { addPending } = useSyncStore();
  const [form, setForm] = useState({ name: '', nameMarathi: '', age: '', gender: 'F', village: '', phone: '', rationCardCategory: 'BPL', conditions: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    const patient = { ...form, age: Number(form.age), gender: form.gender as import('../../types').Gender, rationCardCategory: form.rationCardCategory as import('../../types').RationCard, conditions: form.conditions.split(',').map(s => s.trim()).filter(Boolean), asha: ashaName, riskCategory: 'low' as import('../../types').RiskCategory, district: 'Palghar', state: 'Maharashtra' };
    if (online) {
      try { await api.createPatient(patient); setDone(true); speak(`${form.name} यांची नोंदणी झाली.`, lang); }
      catch { addPending({ type: 'patient', data: patient }); setDone(true); }
    } else {
      addPending({ type: 'patient', data: patient });
      setDone(true);
      speak('ऑफलाइन नोंदणी जतन झाली.', lang);
    }
    setSaving(false);
  }

  if (done) return (
    <div className="card" style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ color: 'var(--col-green)', fontSize: '2rem', marginBottom: 16 }}>✓</div>
      <h3>Patient Registered</h3>
      <p className="text-muted" style={{ marginTop: 8 }}>{form.name} has been registered successfully.</p>
      <button onClick={() => { setDone(false); setForm({ name: '', nameMarathi: '', age: '', gender: 'F', village: '', phone: '', rationCardCategory: 'BPL', conditions: '' }); }} className="btn btn-secondary" style={{ marginTop: 20 }}>Register Another</button>
    </div>
  );

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <div className="card-header"><h3 style={{ margin: 0 }}>Register New Patient</h3></div>
      <div className="card-body">
        {!online && <div className="offline-banner" style={{ marginBottom: 16 }}>Offline — will sync when connected</div>}
        <div className="grid-2">
          <div className="form-group"><label className="form-label">Full Name <span className="required">*</span></label><input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Name in Marathi</label><input className="form-control" value={form.nameMarathi} onChange={e => set('nameMarathi', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Age (years) <span className="required">*</span></label><input type="number" className="form-control" value={form.age} onChange={e => set('age', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Gender</label><select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}><option value="F">Female</option><option value="M">Male</option><option value="O">Other</option></select></div>
          <div className="form-group"><label className="form-label">Village <span className="required">*</span></label><input className="form-control" value={form.village} onChange={e => set('village', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Ration Card</label><select className="form-control" value={form.rationCardCategory} onChange={e => set('rationCardCategory', e.target.value)}><option>BPL</option><option>AAY</option><option>APL</option><option>None</option></select></div>
          <div className="form-group"><label className="form-label">Conditions (comma-separated)</label><input className="form-control" value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="ANC-28w, HTN" /></div>
        </div>
      </div>
      <div className="card-footer">
        <button onClick={submit} disabled={!form.name || !form.age || !form.village || saving} className="btn btn-primary">
          {saving ? 'Saving...' : online ? 'Register Patient' : 'Save Offline'}
        </button>
      </div>
    </div>
  );
};

// ─── Sync Panel ───────────────────────────────────────────────────
const SyncPanel: React.FC = () => {
  const { online, lang } = useSession();
  const { pending, removePending } = useSyncStore();
  const [syncing, setSyncing] = useState(false);
  const [done, setDone] = useState(0);

  async function syncAll() {
    setSyncing(true);
    let count = 0;
    for (const rec of pending) {
      try {
        if (rec.type === 'encounter') await api.createEncounter(rec.data as never);
        if (rec.type === 'patient') await api.createPatient(rec.data as never);
        removePending(rec.id);
        count++;
      } catch {}
    }
    setDone(count);
    speak(count > 0 ? 'समक्रमण पूर्ण झाले.' : 'काही नोंदी समक्रमित होऊ शकल्या नाहीत.', lang);
    setSyncing(false);
  }

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="kpi-card"><div className="kpi-label">Pending Records</div><div className="kpi-value" style={{ color: pending.length > 0 ? 'var(--col-amber)' : 'var(--col-green)' }}>{pending.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Connection</div><div className="kpi-value" style={{ fontSize: '1.25rem', color: online ? 'var(--col-green)' : 'var(--col-red)' }}>{online ? 'Online' : 'Offline'}</div></div>
        <div className="kpi-card"><div className="kpi-label">Synced This Session</div><div className="kpi-value" style={{ color: 'var(--col-teal-dark)' }}>{done}</div></div>
      </div>

      {pending.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ color: 'var(--col-green)', fontSize: '2rem', marginBottom: 12 }}>✓</div>
          <h3>All records synced</h3>
          <p className="text-muted">No pending offline records.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Pending Offline Records ({pending.length})</h3>
            <button onClick={syncAll} disabled={!online || syncing} className="btn btn-primary btn-sm">
              {syncing ? 'Syncing...' : 'Sync All Now'}
            </button>
          </div>
          <div className="card-body">
            <table className="data-table">
              <thead><tr><th>Type</th><th>Created At</th><th>Status</th></tr></thead>
              <tbody>
                {pending.map(r => (
                  <tr key={r.id}>
                    <td><span className="badge badge-info">{r.type}</span></td>
                    <td className="text-sm">{new Date(r.createdAt).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-urgent">Pending sync</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ASHA View ───────────────────────────────────────────────
export const ASHAView: React.FC<ASHAHomeProps> = ({ view }) => {
  const { lang } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as keyof typeof titles.home;

  const titles: Record<View, { en: string; mr: string; hi: string; te: string; kn: string }> = {
    home:        { en: 'High-Risk Patient List', mr: 'उच्च जोखीम रुग्ण यादी', hi: 'उच्च जोखिम मरीज सूची', te: 'అధిక ప్రమాద రోగుల జాబితా (High-Risk)', kn: 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ರೋಗಿಗಳ ಪಟ್ಟಿ' },
    intake:      { en: 'Record Vitals', mr: 'महत्त्वाच्या नोंदी', hi: 'वाइटल संकेत दर्ज करें', te: 'వైటల్ సంకేతాల నమోదు', kn: 'ವೈಟಲ್ಸ್ ದಾಖಲಿಸಿ' },
    register:    { en: 'Register Patient', mr: 'रुग्ण नोंदणी', hi: 'मरीज पंजीकरण', te: 'కొత్త రోగి నమోదు', kn: 'ಹೊಸ ರೋಗಿ ನೋಂದಣಿ' },
    followups:   { en: 'Follow-up Tasks', mr: 'पाठपुरावा कार्ये', hi: 'फॉलो-अप कार्य', te: 'ఫాలో-అప్ విధులు', kn: 'ಫಾಲೋ-ಅಪ್ ಕಾರ್ಯಗಳು' },
    sync:        { en: 'Sync Status', mr: 'समक्रमण स्थिती', hi: 'डेटा सिंक स्थिति', te: 'ఆఫ్‌లైన్ డేటా సింక్', kn: 'ಆಫ್‌ಲೈನ್ ಡೇಟಾ ಸಿಂಕ್' },
    teleconsult: { en: 'Assisted Specialist Teleconsultation', mr: 'तज्ञ डॉक्टरांचा दूरसल्ला', hi: 'विशेषज्ञ टेलीपरामर्श', te: 'స్పెషలిస్ట్ టెలీకన్సల్టేషన్ (Teleconsult)', kn: 'ತಜ್ಞರ ಟೆಲಿಕನ್ಸಲ್ಟೇಶನ್' },
    distance:    { en: 'Find Health Facilities', mr: 'आरोग्य केंद्र शोधा', hi: 'स्वास्थ्य केंद्र खोजें', te: 'సమీప ఆరోగ్య సదుపాయాలు', kn: 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು' },
    referrals:   { en: 'Referral Tracking Pipeline', mr: 'संदर्भ सेवा ट्रॅकिंग', hi: 'रेफरल ट्रैकिंग', te: 'రిఫరల్ ట్రాకింగ్', kn: 'ರೆಫರಲ್ ಟ್ರ್ಯಾಕಿಂಗ್' }
  };

  const currentTitle = titles[view]?.[currentLang] || titles[view]?.en || 'ASHA / CHW Workspace';

  return (
    <PageShell
      title={currentTitle}
      titleMr={titles[view]?.mr || currentTitle}
      breadcrumb="ASHA / CHW Workspace"
    >
      {view === 'home'        && <HighRiskList />}
      {view === 'intake'      && <HighRiskList />}
      {view === 'register'    && <RegisterPatient />}
      {view === 'sync'        && <SyncPanel />}
      {view === 'followups'   && <HighRiskList />}
      {view === 'teleconsult' && (
        <div style={{ maxWidth: 840 }}>
          <TeleconsultPanel />
        </div>
      )}
      {view === 'distance'    && (
        <div style={{ maxWidth: 840 }}>
          <DistanceFinder />
        </div>
      )}
      {view === 'referrals'   && <HighRiskList />}
    </PageShell>
  );
};

