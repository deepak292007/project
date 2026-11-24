import React, { useEffect, useState } from 'react';
import { PageShell, EmptyState, SkeletonRow } from '../../components/layout/PageShell';
import { TriageNoteCard } from '../../components/shared/TriageNoteCard';
import { ReferralSummaryCard } from '../../components/shared/ReferralPipeline';
import { useSession } from '../../store';
import { speakScript } from '../../lib/voice';
import * as api from '../../lib/api';
import type { Patient, Encounter, Referral, StockItem, TriageResult, ReferralStage } from '../../types';

type View = 'queue' | 'triage' | 'stock' | 'teleconsult';

// ─── OPD Queue ─────────────────────────────────────────────────────
const OPDQueue: React.FC = () => {
  const { facilityId, facilityName, name, lang } = useSession();
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [opBookings, setOpBookings] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [triaging, setTriaging] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [triagePatient, setTriagePatient] = useState<Patient | null>(null);
  const [callingToken, setCallingToken] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [encs, ops, pts] = await Promise.all([
        api.getEncounters().then(r => Array.isArray(r) ? r : (Array.isArray((r as any)?.data) ? (r as any).data : [])).catch(() => [] as Encounter[]),
        api.get<any>('/api/opd/bookings').then(r => Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
        api.getPatients({ risk: 'high' }).then(r => Array.isArray(r) ? r : (Array.isArray((r as any)?.data) ? (r as any).data : [])).catch(() => [] as Patient[])
      ]);

      // Filter or show encounters & bookings for facility or active queue
      const activeEncs = encs.filter((e: Encounter) => (!facilityId || e.facilityId === facilityId || !e.facilityId || e.status === 'waiting'));
      const activeOps = ops.filter((o: any) => (!facilityId || o.facilityId === facilityId || o.status === 'confirmed'));

      setEncounters(activeEncs);
      setOpBookings(activeOps);
      setPatients(pts.slice(0, 8));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [facilityId]);

  async function handleCallNext(token: string, patientName: string, dept: string) {
    setCallingToken(token);
    const msg = lang === 'te'
      ? `టోకెన్ ${token}, ${patientName}, దయచేసి ${dept} కౌంటర్‌కు రండి.`
      : lang === 'kn'
      ? `ಟೋಕನ್ ${token}, ${patientName}, ದಯವಿಟ್ಟು ${dept} ಕೌಂಟರ್‌ಗೆ ಬನ್ನಿ.`
      : lang === 'hi'
      ? `टोकन ${token}, ${patientName}, कृपया ${dept} कक्ष में आएं।`
      : lang === 'mr'
      ? `टोकन ${token}, ${patientName}, कृपया ${dept} कक्षात या.`
      : `Token ${token}, ${patientName}, please proceed to ${dept} consultation room.`;
    speakScript('queue_token_called', lang);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setCallingToken(null), 3000);
  }

  async function runTriage(p: Patient) {
    setTriaging(p._id);
    setTriagePatient(p);
    try {
      const symptoms = p.conditions || [];
      const v = p.latestVitals ? (p.latestVitals as unknown as Record<string, unknown>) : {};
      const result = await api.runTriage({ symptoms, vitals: v, context: `${p.age}y ${p.gender}, ${p.conditions?.join(', ')}`, lang });
      setTriageResult(result);
      const key = result.urgency === 'emergency' ? 'triage_emergency' : result.urgency === 'urgent' ? 'triage_urgent' : 'triage_routine';
      speakScript(key, lang);
    } finally { setTriaging(null); }
  }

  const deptConfigs = [
    { key: 'General OPD', title: 'General OPD & Medicine', match: (d?: string) => !d || d.toLowerCase().includes('general') || d.toLowerCase().includes('medicine') },
    { key: 'ANC', title: 'ANC & Maternal Health', match: (d?: string) => (d || '').toLowerCase().includes('anc') || (d || '').toLowerCase().includes('matern') || (d || '').toLowerCase().includes('gyn') },
    { key: 'Paediatrics', title: 'Paediatrics & Child Care', match: (d?: string) => (d || '').toLowerCase().includes('paed') || (d || '').toLowerCase().includes('child') },
    { key: 'NCD Clinic', title: 'NCD & Chronic Care', match: (d?: string) => (d || '').toLowerCase().includes('ncd') || (d || '').toLowerCase().includes('cardio') || (d || '').toLowerCase().includes('diab') }
  ];

  return (
    <div>
      {/* Queue boards by dept */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {deptConfigs.map(dept => {
          // Combine encounters and OP bookings matching this department
          const deptEncs = encounters.filter(e => dept.match(e.department));
          const deptOps = opBookings.filter(o => dept.match(o.department));
          const totalWaiting = deptEncs.length + deptOps.length;

          return (
            <div key={dept.key} className="card" style={{ borderTop: '4px solid var(--col-teal)' }}>
              <div className="card-header" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>{dept.title}</h3>
                <span className="badge badge-info">{totalWaiting} waiting</span>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {totalWaiting === 0 ? (
                  <p className="text-sm text-muted">No patients waiting in queue</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Live OP Bookings */}
                    {deptOps.slice(0, 3).map((op: any) => (
                      <div key={op.bookingId || op._id} className="token-card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                        <div className="token-number" style={{ background: 'var(--col-teal-dark)', color: '#ffffff' }}>
                          {op.tokenNumber || 'OPD-01'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{op.patientName}</div>
                          <div className="text-xs text-muted">
                            {Array.isArray(op.symptoms) ? op.symptoms.join(', ') : (op.symptoms || 'OP Consultation')} · Est. Wait: {op.estimatedWaitMinutes || 10}m
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCallNext(op.tokenNumber, op.patientName, dept.key)}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          {callingToken === op.tokenNumber ? 'Calling…' : 'Call Next'}
                        </button>
                      </div>
                    ))}

                    {/* Standard Encounters */}
                    {deptEncs.slice(0, 3).map(enc => {
                      const pName = typeof enc.patientId === 'object' ? (enc.patientId as any)?.name : 'Patient';
                      const tok = enc.token || `OPD-${String(enc._id).slice(-3).toUpperCase()}`;
                      return (
                        <div key={enc._id} className="token-card">
                          <div className="token-number">{tok}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{pName}</div>
                            <div className="text-xs text-muted">{enc.chiefComplaint || 'Consultation'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCallNext(tok, pName, dept.key)}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          >
                            {callingToken === tok ? 'Calling…' : 'Call Next'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* High-risk patients from catchment */}
      <div className="section-title">High-Risk Patients — Clinical Analyse Required ({patients.length})</div>
      {loading ? (
        <table className="data-table"><tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} cols={5} />)}</tbody></table>
      ) : patients.length === 0 ? (
        <EmptyState message="No high-risk patients pending clinical analyse" />
      ) : (
        <table className="data-table">
          <thead><tr><th>Patient</th><th>Age/Sex</th><th>Conditions</th><th>Last BP</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody>
            {patients.map(p => (
              <tr key={p._id}>
                <td><div style={{ fontWeight: 600 }}>{p.name}</div><div className="text-xs text-muted">{p.village}</div></td>
                <td>{p.age}y / {p.gender}</td>
                <td>{p.conditions?.slice(0, 2).join(', ')}</td>
                <td className="font-mono text-sm">{p.latestVitals?.bp || '—'}</td>
                <td><span className={`badge badge-${p.riskCategory}`}>{p.riskCategory}</span></td>
                <td>
                  <button onClick={() => runTriage(p)} disabled={triaging === p._id} className="btn btn-sm btn-primary">
                    {triaging === p._id ? 'Analyzing...' : 'Clinical Analyse'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {triageResult && triagePatient && (
        <div style={{ marginTop: 24 }}>
          <TriageNoteCard result={triageResult} patientName={triagePatient.name} />
          {triageResult.urgency !== 'routine' && (
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button className="btn btn-primary">Initiate Referral</button>
              <button onClick={() => speakScript('triage_urgent', lang)} className="voice-btn">Repeat Voice</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Stock Alerts ─────────────────────────────────────────────────
const StockAlerts: React.FC = () => {
  const { facilityId } = useSession();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStock({ facilityId: facilityId || 'PHC-KELWA-01' }).then(s => { setStock(s); setLoading(false); }).catch(() => setLoading(false));
  }, [facilityId]);

  const STATUS_CLASS: Record<string, string> = { stockout: 'badge-emergency', critical: 'badge-urgent', low: 'badge-moderate', adequate: 'badge-routine' };

  const criticals = stock.filter(s => s.status === 'stockout' || s.status === 'critical');
  const rest = stock.filter(s => s.status !== 'stockout' && s.status !== 'critical');

  return (
    <div>
      {criticals.length > 0 && (
        <div className="offline-banner" style={{ background: 'var(--col-red-bg)', borderColor: 'var(--col-red-border)', color: 'var(--col-red)', marginBottom: 20 }}>
          ⚠ {criticals.length} critical/stockout item{criticals.length > 1 ? 's' : ''} requiring immediate action
        </div>
      )}

      {loading ? (
        <table className="data-table"><tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} cols={6} />)}</tbody></table>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead><tr><th>Medicine</th><th>Category</th><th>Qty in Hand</th><th>Reorder Level</th><th>Unit</th><th>Status</th></tr></thead>
            <tbody>
              {[...criticals, ...rest].map(s => (
                <tr key={s._id}>
                  <td><div style={{ fontWeight: 600 }}>{s.medicineName}</div>{s.genericName && <div className="text-xs text-muted">{s.genericName}</div>}</td>
                  <td><span className="badge badge-neutral">{s.category}</span></td>
                  <td style={{ fontWeight: 700, color: s.status === 'stockout' ? 'var(--col-red)' : 'var(--col-ink)' }}>{s.quantityInHand} {s.unit}</td>
                  <td className="text-muted">{s.reorderLevel} {s.unit}</td>
                  <td>{s.unit}</td>
                  <td><span className={`badge ${STATUS_CLASS[s.status] || 'badge-neutral'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Main PHC View ─────────────────────────────────────────────────
export const PHCView: React.FC<{ view: View }> = ({ view }) => {
  const titles: Record<View, string> = {
    queue:       'OPD Queue & Clinical Analyse',
    triage:      'Clinical Analyse & Refer',
    stock:       'Medicine Stock',
    teleconsult: 'Teleconsult Request',
  };

  return (
    <PageShell title={titles[view]} breadcrumb="PHC / Sub-Centre Workspace">
      {view === 'queue' && <OPDQueue />}
      {view === 'triage' && <OPDQueue />}
      {view === 'stock' && <StockAlerts />}
      {view === 'teleconsult' && <EmptyState message="Teleconsult" sub="Request a specialist teleconsult. Feature requires video connection." />}
    </PageShell>
  );
};
