import React, { useEffect, useState } from 'react';
import { PageShell, EmptyState, SkeletonRow } from '../../components/layout/PageShell';
import { ReferralSummaryCard } from '../../components/shared/ReferralPipeline';
import { useSession } from '../../store';
import { speakScript } from '../../lib/voice';
import * as api from '../../lib/api';
import type { Facility, Referral, StockItem, ReferralStage, Encounter } from '../../types';
import { BedAllocationView } from './BedAllocationView';

type View = 'capacity' | 'referrals' | 'opqueue' | 'emergency' | 'diagnostics' | 'stock' | 'beds';

// ─── Bed & Resource Editor ────────────────────────────────────────
const ResourceEditor: React.FC = () => {
  const { facilityId, name, lang } = useSession();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getFacility(facilityId || 'RH-KHED-01').then(f => { setFacility(f); setLoading(false); }).catch(() => setLoading(false));
  }, [facilityId]);

  async function save() {
    if (!facility) return;
    setSaving(true);
    try {
      await api.patchFacility(facility.facilityId, { resources: facility.resources, lastUpdated: new Date().toISOString() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  function updateRes(key: string, val: number) {
    setFacility(f => f ? { ...f, resources: { ...f.resources!, [key]: val } } : f);
  }

  if (loading) return <div className="text-muted">Loading facility data...</div>;
  if (!facility) return <EmptyState message="Facility not found" />;

  const r = facility.resources!;
  const ROWS: { label: string; totalKey: string; occupiedKey: string }[] = [
    { label: 'General Beds', totalKey: 'bedsTotal', occupiedKey: 'bedsOccupied' },
    { label: 'ICU Beds', totalKey: 'icuTotal', occupiedKey: 'icuOccupied' },
    { label: 'Oxygen Beds', totalKey: 'oxygenBeds', occupiedKey: 'oxygenOccupied' },
    { label: 'Ventilators', totalKey: 'ventilators', occupiedKey: 'ventilatorsInUse' },
    { label: 'Ambulances', totalKey: 'ambulances', occupiedKey: 'ambulancesAvailable' },
    { label: 'Operating Theatres', totalKey: 'operatingTheatres', occupiedKey: 'otAvailable' },
  ];

  return (
    <div>
      {saved && <div className="offline-banner" style={{ background: 'var(--col-green-bg)', borderColor: 'var(--col-green-border)', color: 'var(--col-green)', marginBottom: 16 }}>✓ Resource data updated and broadcast to network</div>}

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Beds Available</div>
          <div className="kpi-value" style={{ color: (r.bedsTotal - r.bedsOccupied) < 5 ? 'var(--col-red)' : 'var(--col-teal-dark)' }}>{r.bedsTotal - r.bedsOccupied}</div>
          <div className="kpi-sub">of {r.bedsTotal} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">ICU Available</div>
          <div className="kpi-value" style={{ color: (r.icuTotal - r.icuOccupied) < 2 ? 'var(--col-red)' : 'var(--col-teal-dark)' }}>{r.icuTotal - r.icuOccupied}</div>
          <div className="kpi-sub">of {r.icuTotal} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ambulances Available</div>
          <div className="kpi-value">{r.ambulancesAvailable}</div>
          <div className="kpi-sub">of {r.ambulances} total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">OT Available</div>
          <div className="kpi-value">{r.otAvailable}</div>
          <div className="kpi-sub">of {r.operatingTheatres} OT</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Live Resource Update — {facility.name}</h3>
          <span className="text-xs text-muted">Last updated: {facility.lastUpdated ? new Date(facility.lastUpdated).toLocaleTimeString('en-IN') : '—'}</span>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr><th>Resource</th><th>Total Capacity</th><th>Currently Occupied</th><th>Available</th><th>Occupancy %</th></tr>
            </thead>
            <tbody>
              {ROWS.map(row => {
                const total = (r as unknown as Record<string, number>)[row.totalKey] || 0;
                const occ   = (r as unknown as Record<string, number>)[row.occupiedKey] || 0;
                const avail = Math.max(0, total - occ);
                const pct   = total > 0 ? Math.round((occ / total) * 100) : 0;
                return (
                  <tr key={row.label}>
                    <td style={{ fontWeight: 600 }}>{row.label}</td>
                    <td>
                      <input type="number" min="0" value={total}
                        onChange={e => updateRes(row.totalKey, Number(e.target.value))}
                        className="form-control" style={{ width: 80 }} />
                    </td>
                    <td>
                      <input type="number" min="0" max={total} value={occ}
                        onChange={e => updateRes(row.occupiedKey, Number(e.target.value))}
                        className="form-control" style={{ width: 80 }} />
                    </td>
                    <td style={{ fontWeight: 700, color: avail === 0 ? 'var(--col-red)' : avail < 3 ? 'var(--col-amber)' : 'var(--col-green)' }}>{avail}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 8, background: 'var(--col-border)', borderRadius: 4 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? 'var(--col-red)' : pct > 70 ? 'var(--col-amber)' : 'var(--col-teal)', borderRadius: 4 }} />
                        </div>
                        <span className="text-sm">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Update & Broadcast to Network'}
          </button>
          <span className="text-xs text-muted">Visible to referring PHCs and district admin in real-time</span>
        </div>
      </div>

      {/* Diagnostics */}
      {facility.diagnostics && (
        <div style={{ marginTop: 24 }}>
          <div className="section-title">Diagnostics Available Today</div>
          <div className="diag-grid">
            {facility.diagnostics.map(d => (
              <span key={d.name} className={`diag-chip ${d.available ? 'available' : 'unavailable'}`}>
                {d.name}{d.available && d.slots > 0 ? ` (${d.slots} slots)` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Inbound Referrals ────────────────────────────────────────────
const InboundReferrals: React.FC = () => {
  const { facilityId, name, lang } = useSession();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    api.getReferrals({ facilityId: facilityId || 'RH-KHED-01' }).then(r => { setReferrals(r); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, [facilityId]);

  async function advance(ref: Referral, stage: ReferralStage) {
    await api.advanceReferral(ref._id, stage, name, 'hospital_admin');
    load();
    speakScript('referral_initiated', lang);
  }

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { l: 'Total Inbound', v: referrals.length },
          { l: 'Emergency', v: referrals.filter(r => r.urgency === 'emergency').length },
          { l: 'Urgent', v: referrals.filter(r => r.urgency === 'urgent').length },
          { l: 'Active', v: referrals.filter(r => !['discharged','follow_up_due'].includes(r.currentStage)).length },
        ].map(k => (
          <div key={k.l} className="kpi-card">
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-value">{k.v}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="text-muted">Loading referrals...</div>
      : referrals.length === 0 ? <EmptyState message="No inbound referrals" />
      : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {referrals.map(ref => (
            <ReferralSummaryCard
              key={ref._id}
              referral={ref}
              canAdvance
              onAdvance={stage => advance(ref, stage)}
              lang={lang as 'en' | 'mr'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Hospital OP Queue Boards ─────────────────────────────────────
const HospitalOPQueue: React.FC = () => {
  const { facilityId, lang } = useSession();
  const [bookings, setBookings] = useState<any[]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingToken, setCallingToken] = useState<string | null>(null);

  async function loadQueue() {
    setLoading(true);
    try {
      const [ops, encs] = await Promise.all([
        api.get<any>('/api/opd/bookings').then(r => Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : [])).catch(() => []),
        api.getEncounters().then(r => Array.isArray(r) ? r : (Array.isArray((r as any)?.data) ? (r as any).data : [])).catch(() => [] as Encounter[])
      ]);
      setBookings(ops);
      setEncounters(encs.filter((e: Encounter) => e.status === 'waiting' || !e.status));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 8000);
    return () => clearInterval(timer);
  }, [facilityId]);

  function handleCallNext(token: string, patientName: string, dept: string) {
    setCallingToken(token);
    const msg = lang === 'te'
      ? `టోకెన్ ${token}, ${patientName}, దయచేసి ${dept} కౌంటర్‌కు రండి.`
      : lang === 'kn'
      ? `ಟೋಕನ್ ${token}, ${patientName}, ದಯವಿಟ್ಟು ${dept} ಕೌಂಟರ್‌ಗೆ ಬನ್ನಿ.`
      : lang === 'hi'
      ? `टोकन ${token}, ${patientName}, कृपया ${dept} कक्ष में आएं।`
      : lang === 'mr'
      ? `टोकन ${token}, ${patientName}, कृपया ${dept} कक्षात या.`
      : `Token ${token}, ${patientName}, please proceed to ${dept} consultation counter.`;
    speakScript('queue_token_called', lang);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(msg);
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setCallingToken(null), 3000);
  }

  const depts = [
    { key: 'General Medicine', title: 'General Medicine OPD', icon: '🩺', match: (d?: string) => !d || d.toLowerCase().includes('general') || d.toLowerCase().includes('medicine') },
    { key: 'Obstetrics & Gynaecology', title: 'Obstetrics & Gynaecology (ANC)', icon: '🤰', match: (d?: string) => (d || '').toLowerCase().includes('anc') || (d || '').toLowerCase().includes('gyn') || (d || '').toLowerCase().includes('matern') },
    { key: 'Paediatrics', title: 'Paediatrics & Neonatology', icon: '👶', match: (d?: string) => (d || '').toLowerCase().includes('paed') || (d || '').toLowerCase().includes('child') },
    { key: 'Orthopaedics', title: 'Orthopaedics & Trauma', icon: '🦴', match: (d?: string) => (d || '').toLowerCase().includes('ortho') || (d || '').toLowerCase().includes('trauma') },
    { key: 'Cardiology', title: 'Cardiology & NCD Clinic', icon: '❤️', match: (d?: string) => (d || '').toLowerCase().includes('cardio') || (d || '').toLowerCase().includes('ncd') },
    { key: 'Emergency Bay', title: 'Emergency Intake Bay', icon: '🚨', match: (d?: string) => (d || '').toLowerCase().includes('emerg') }
  ];

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Active Waiting Tokens</div>
          <div className="kpi-value" style={{ color: 'var(--col-teal-dark)' }}>{bookings.length + encounters.length}</div>
          <div className="kpi-sub">Across all department boards</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Emergency Tokens</div>
          <div className="kpi-value" style={{ color: 'var(--col-red)' }}>
            {bookings.filter(b => b.clinicalUrgency === 'emergency').length + encounters.filter((e: any) => e.priority === 'emergency' || e.type === 'Emergency').length}
          </div>
          <div className="kpi-sub">Green channel prioritized</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Average Wait Time</div>
          <div className="kpi-value">18m</div>
          <div className="kpi-sub">M/M/c Multi-Counter Model</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active OP Counters</div>
          <div className="kpi-value">8</div>
          <div className="kpi-sub">Doctors on active duty</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {depts.map(dept => {
          const deptOps = bookings.filter(b => dept.match(b.department));
          const deptEncs = encounters.filter(e => dept.match(e.department));
          const totalWaiting = deptOps.length + deptEncs.length;

          return (
            <div key={dept.key} className="card" style={{ borderTop: '4px solid var(--col-teal)' }}>
              <div className="card-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{dept.icon}</span>
                  <h3 style={{ margin: 0, fontSize: '0.9375rem' }}>{dept.title}</h3>
                </div>
                <span className="badge badge-info">{totalWaiting} in queue</span>
              </div>
              <div className="card-body" style={{ padding: '12px 16px' }}>
                {totalWaiting === 0 ? (
                  <p className="text-sm text-muted">No patients waiting in queue</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {deptOps.map((op: any) => (
                      <div key={op.bookingId || op._id} className="token-card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                        <div className="token-number" style={{ background: 'var(--col-teal-dark)', color: '#ffffff' }}>
                          {op.tokenNumber || 'OPD-01'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{op.patientName}</div>
                          <div className="text-xs text-muted">
                            {Array.isArray(op.symptoms) ? op.symptoms.join(', ') : (op.symptoms || 'OP Consultation')} · Wait: {op.estimatedWaitMinutes || 15}m
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCallNext(op.tokenNumber, op.patientName, dept.title)}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          {callingToken === op.tokenNumber ? 'Calling…' : 'Call Next'}
                        </button>
                      </div>
                    ))}

                    {deptEncs.map(enc => {
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
                            onClick={() => handleCallNext(tok, pName, dept.title)}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
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
    </div>
  );
};

// ─── Emergency Bay ────────────────────────────────────────────────
const EmergencyBay: React.FC = () => {
  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--col-red)' }}>
          <div className="kpi-label">Red Priority (Critical)</div>
          <div className="kpi-value" style={{ color: 'var(--col-red)' }}>2</div>
          <div className="kpi-sub">Immediate resuscitation</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--col-amber)' }}>
          <div className="kpi-label">Yellow Priority (Urgent)</div>
          <div className="kpi-value" style={{ color: 'var(--col-amber)' }}>4</div>
          <div className="kpi-sub">Within 15 mins evaluation</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Available ICU Beds</div>
          <div className="kpi-value">6</div>
          <div className="kpi-sub">of 16 total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">108 Ambulances on Shift</div>
          <div className="kpi-value">3</div>
          <div className="kpi-sub">24x7 Emergency Ready</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Active Emergency Patients &amp; Resuscitation Bay</h3>
          <span className="badge badge-emergency">2 Critical Active</span>
        </div>
        <div className="card-body">
          <table className="data-table">
            <thead>
              <tr><th>Token</th><th>Patient</th><th>Vitals</th><th>Severity</th><th>Assigned Bed</th><th>Doctor on Duty</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong className="font-mono">EMG-001</strong></td>
                <td><div style={{ fontWeight: 600 }}>Savita Patil</div><div className="text-xs text-muted">28w Pregnant · Fever &amp; Abdominal Pain</div></td>
                <td><span className="badge badge-urgent">BP 140/95 · SpO2 96%</span></td>
                <td><span className="badge badge-emergency">RED – HIGH RISK</span></td>
                <td>ICU Bed #04 (OB/GYN)</td>
                <td>Dr. Ananya Rao</td>
              </tr>
              <tr>
                <td><strong className="font-mono">EMG-002</strong></td>
                <td><div style={{ fontWeight: 600 }}>Ramakant Bhagat</div><div className="text-xs text-muted">T2DM · Severe Dyspnoea</div></td>
                <td><span className="badge badge-emergency">BP 170/100 · SpO2 91%</span></td>
                <td><span className="badge badge-emergency">RED – CRITICAL</span></td>
                <td>Oxygen Bed #02</td>
                <td>Dr. Pradeep Kale</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Main Hospital View ───────────────────────────────────────────
export const HospitalView: React.FC<{ view: View }> = ({ view }) => {
  const titles: Record<View, string> = {
    capacity:    'Bed & Resource Management',
    referrals:   'Inbound Referrals',
    opqueue:     'OP Queue Boards',
    emergency:   'Emergency Bay',
    diagnostics: 'Diagnostics Today',
    beds:       'Bed Allocation � Ward Command Centre',
    stock:       'Stock Alerts',
  };

  return (
    <PageShell title={titles[view]} breadcrumb="Hospital Workspace">
      {view === 'capacity'   && <ResourceEditor />}
      {view === 'referrals'  && <InboundReferrals />}
      {view === 'opqueue'    && <HospitalOPQueue />}
      {view === 'emergency'  && <EmergencyBay />}
      {view === 'diagnostics'&& <HospitalDiagnostics />}
      {view === 'stock'      && <HospitalStock />}
      {view === 'beds'       && <BedAllocationView />}
    </PageShell>
  );
};

// ─── Diagnostics Component ─────────────────────────────────────────
const HospitalDiagnostics: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header"><h3 style={{ margin: 0 }}>Diagnostics Availability &amp; Radiology Lab Slots</h3></div>
      <div className="card-body">
        <table className="data-table">
          <thead>
            <tr><th>Diagnostic Modality</th><th>Equipment Status</th><th>Slots Available Today</th><th>Avg Report Turnaround</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>1.5T MRI Scanner</strong></td><td><span className="badge badge-routine">Operational</span></td><td>12 slots free</td><td>45 mins</td></tr>
            <tr><td><strong>128-Slice CT Scan</strong></td><td><span className="badge badge-routine">Operational</span></td><td>18 slots free</td><td>20 mins</td></tr>
            <tr><td><strong>Digital X-Ray &amp; CR</strong></td><td><span className="badge badge-routine">Operational</span></td><td>40 slots free</td><td>15 mins</td></tr>
            <tr><td><strong>Colour Doppler Ultrasound</strong></td><td><span className="badge badge-routine">Operational</span></td><td>14 slots free</td><td>30 mins</td></tr>
            <tr><td><strong>Automated Biochemistry Analyzer</strong></td><td><span className="badge badge-routine">Operational</span></td><td>150 tests/hr</td><td>60 mins</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Stock Component ───────────────────────────────────────────────
const HospitalStock: React.FC = () => {
  return (
    <div className="card">
      <div className="card-header"><h3 style={{ margin: 0 }}>Hospital Central Pharmacy Stock</h3></div>
      <div className="card-body">
        <table className="data-table">
          <thead>
            <tr><th>Medicine / Supply</th><th>Category</th><th>Current Stock</th><th>Buffer Level</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Inj. Oxytocin 10 IU</strong></td><td>Maternal Health</td><td>450 ampoules</td><td>200</td><td><span className="badge badge-routine">In Stock</span></td></tr>
            <tr><td><strong>Inj. Magnesium Sulphate 50%</strong></td><td>Emergency Eclampsia</td><td>120 vials</td><td>50</td><td><span className="badge badge-routine">In Stock</span></td></tr>
            <tr><td><strong>Tab. Paracetamol 500mg</strong></td><td>General Medicine</td><td>12,000 tabs</td><td>3,000</td><td><span className="badge badge-routine">In Stock</span></td></tr>
            <tr><td><strong>Inj. Artesunate 60mg</strong></td><td>Antimalarial</td><td>85 vials</td><td>40</td><td><span className="badge badge-routine">In Stock</span></td></tr>
            <tr><td><strong>IV Normal Saline 500ml</strong></td><td>Critical Fluids</td><td>1,400 bottles</td><td>500</td><td><span className="badge badge-routine">In Stock</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
