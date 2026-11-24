/**
 * TeleconsultPanel — Long-distance solution
 * ASHA/PHC doctor initiates audio/video teleconsult with specialist
 * Uses WebSocket signaling already in server.js
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '../../store';
import { speak } from '../../lib/voice';
import * as api from '../../lib/api';
import type { Patient, Facility } from '../../types';

interface Props {
  patient?: Patient;
  facility?: Facility;
}

const SPECIALIST_OPTIONS = [
  { name: 'Dr. Neeta Kulkarni', specialty: 'Obstetrics & Gynaecology', facility: 'Rural Hospital Khed', facilityId: 'RH-KHED-01' },
  { name: 'Dr. Anjali Mehta', specialty: 'Obstetrics & Gynaecology', facility: 'District Hospital Palghar', facilityId: 'DH-PALGHAR-01' },
  { name: 'Dr. Ramesh Sharma', specialty: 'General Medicine', facility: 'District Hospital Palghar', facilityId: 'DH-PALGHAR-01' },
  { name: 'Dr. Kavita Rane', specialty: 'Paediatrics', facility: 'District Hospital Palghar', facilityId: 'DH-PALGHAR-01' },
  { name: 'Dr. Pradeep Kale', specialty: 'Cardiology', facility: 'Civil Hospital Thane', facilityId: 'CH-THANE-01' },
];

type CallState = 'idle' | 'initiating' | 'waiting' | 'connected' | 'ended';

export const TeleconsultPanel: React.FC<Props> = ({ patient, facility }) => {
  const { name, role, lang, facilityId } = useSession();
  const [callState, setCallState] = useState<CallState>('idle');
  const [selectedDoctor, setSelectedDoctor] = useState(SPECIALIST_OPTIONS[0]);
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [notes, setNotes] = useState('');
  const [roomId, setRoomId] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsedSec(s => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  async function startCall() {
    setCallState('initiating');
    speak(lang === 'mr' ? `${selectedDoctor.name} यांच्याशी दूरसल्ला सुरू होत आहे.` : `Initiating teleconsult with ${selectedDoctor.name}.`, lang);
    try {
      const session = await api.post<{ roomId: string }>('/api/teleconsult/start', {
        patientId: patient?._id,
        initiatedBy: name, role, facilityId,
        targetDoctor: selectedDoctor.name,
        targetFacilityId: selectedDoctor.facilityId,
        urgency, notes
      });
      setRoomId(session.roomId);
      setCallState('waiting');
      // Simulate doctor joining after 3 seconds in demo
      setTimeout(() => {
        setCallState('connected');
        setElapsedSec(0);
        speak(lang === 'mr' ? `${selectedDoctor.name} जोडले गेले.` : `${selectedDoctor.name} has joined the call.`, lang);
      }, 3000);
    } catch {
      setCallState('idle');
    }
  }

  async function endCall() {
    try {
      await api.post('/api/teleconsult/end', { roomId, endedBy: name, role, notes: consultNotes, prescription });
    } catch {}
    setCallState('ended');
    speak(lang === 'mr' ? 'दूरसल्ला संपला. नोट्स जतन केल्या.' : 'Teleconsult ended. Notes saved.', lang);
  }

  const URGENCY_LABELS = { routine: 'Routine', urgent: 'Urgent', emergency: 'Emergency' };
  const URGENCY_COLORS = { routine: 'var(--col-teal)', urgent: 'var(--col-amber)', emergency: 'var(--col-crimson)' };

  return (
    <section className="teleconsult-panel">
      {/* Header */}
      <div className="tc-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.12 11.7 19.79 19.79 0 0 1 1.07 3.12 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            <path d="M14.05 2a9 9 0 0 1 8 7.94"/>
            <path d="M14.05 6A5 5 0 0 1 18 10"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>
            {lang === 'mr' ? 'दूरसल्ला (Teleconsult)' : lang === 'hi' ? 'टेलीपरामर्श' : 'Assisted Teleconsult'}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>
          Village → PHC → Specialist · Long-distance clinical consultation
        </div>
      </div>

      {/* Patient context bar */}
      {patient && (
        <div className="tc-patient-bar">
          <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>
            {patient.riskCategory?.toUpperCase()}
          </span>
          <strong>{patient.name}</strong>
          <span className="text-muted">·</span>
          <span>{patient.age}y {patient.gender}</span>
          <span className="text-muted">·</span>
          <span>{patient.conditions?.join(', ')}</span>
          {patient.latestVitals && (
            <>
              <span className="text-muted">·</span>
              <span>BP {patient.latestVitals.bp} · SpO₂ {patient.latestVitals.spo2}%</span>
            </>
          )}
        </div>
      )}

      {/* Main content */}
      {callState === 'idle' && (
        <div className="tc-setup">
          <div className="form-row">
            <label className="form-label">
              {lang === 'mr' ? 'तज्ञ निवडा' : lang === 'hi' ? 'विशेषज्ञ चुनें' : 'Select Specialist'}
            </label>
            <select className="form-select" value={selectedDoctor.name}
              onChange={e => setSelectedDoctor(SPECIALIST_OPTIONS.find(d => d.name === e.target.value) || SPECIALIST_OPTIONS[0])}>
              {SPECIALIST_OPTIONS.map(d => (
                <option key={d.name} value={d.name}>{d.name} — {d.specialty} ({d.facility})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">
              {lang === 'mr' ? 'तातडीची पातळी' : lang === 'hi' ? 'तात्कालिकता' : 'Urgency Level'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['routine', 'urgent', 'emergency'] as const).map(u => (
                <button key={u} className={`btn btn-sm ${urgency === u ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderColor: urgency === u ? URGENCY_COLORS[u] : undefined, color: urgency === u ? '#fff' : URGENCY_COLORS[u], background: urgency === u ? URGENCY_COLORS[u] : undefined }}
                  onClick={() => setUrgency(u)}>
                  {URGENCY_LABELS[u]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">
              {lang === 'mr' ? 'सल्ल्याचे कारण' : lang === 'hi' ? 'परामर्श का कारण' : 'Reason for Consultation'}
            </label>
            <textarea className="form-textarea" rows={3} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={lang === 'mr' ? 'रुग्णाचे लक्षणे, व्हायटल्स, आणि प्रश्न…' : 'Patient symptoms, vitals, and clinical questions…'} />
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} onClick={startCall}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.12 11.7 19.79 19.79 0 0 1 1.07 3.12 2 2 0 0 1 3.05 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {lang === 'mr' ? 'दूरसल्ला सुरू करा' : lang === 'hi' ? 'कॉल शुरू करें' : 'Start Teleconsult Call'}
          </button>
        </div>
      )}

      {callState === 'initiating' && (
        <div className="tc-status connecting">
          <div className="pulse-ring" />
          <p style={{ fontWeight: 600 }}>{lang === 'mr' ? 'जोडत आहे…' : 'Connecting…'}</p>
          <p className="text-muted">{selectedDoctor.name} · {selectedDoctor.specialty}</p>
        </div>
      )}

      {callState === 'waiting' && (
        <div className="tc-status waiting">
          <div className="pulse-ring" style={{ borderColor: 'var(--col-amber)' }} />
          <p style={{ fontWeight: 600, color: 'var(--col-amber)' }}>
            {lang === 'mr' ? 'डॉक्टरची प्रतीक्षा…' : lang === 'hi' ? 'डॉक्टर की प्रतीक्षा…' : 'Waiting for doctor to join…'}
          </p>
          <p className="text-muted">{selectedDoctor.name} · {selectedDoctor.facility}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginTop: 8 }}>Room: {roomId}</p>
        </div>
      )}

      {callState === 'connected' && (
        <div className="tc-active">
          <div className="tc-call-header">
            <div className="call-indicator">
              <span className="live-dot" /> LIVE
            </div>
            <div style={{ fontWeight: 700 }}>{selectedDoctor.name}</div>
            <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{selectedDoctor.specialty} · {selectedDoctor.facility}</div>
            <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '1.5rem', color: 'var(--col-teal)', marginTop: 4 }}>
              {formatTime(elapsedSec)}
            </div>
          </div>

          {/* Patient vitals for doctor to see */}
          {patient?.latestVitals && (
            <div className="tc-vitals-strip">
              <span><strong>BP</strong> {patient.latestVitals.bp}</span>
              <span><strong>SpO₂</strong> {patient.latestVitals.spo2}%</span>
              <span><strong>Pulse</strong> {patient.latestVitals.pulse}/min</span>
              <span><strong>Temp</strong> {patient.latestVitals.temp}°C</span>
              <span><strong>Wt</strong> {patient.latestVitals.weight}kg</span>
            </div>
          )}

          <div className="form-row" style={{ marginTop: 16 }}>
            <label className="form-label">
              {lang === 'mr' ? 'सल्ला नोट्स (डॉक्टरांनी भरा)' : 'Consultation Notes'}
            </label>
            <textarea className="form-textarea" rows={4} value={consultNotes}
              onChange={e => setConsultNotes(e.target.value)}
              placeholder="Clinical findings, advice, management plan…" />
          </div>

          <div className="form-row">
            <label className="form-label">
              {lang === 'mr' ? 'ई-प्रिस्क्रिप्शन' : 'e-Prescription'}
            </label>
            <textarea className="form-textarea" rows={3} value={prescription}
              onChange={e => setPrescription(e.target.value)}
              placeholder="Medicines: Drug name | Dose | Frequency | Duration…" />
          </div>

          <button className="btn btn-danger btn-lg" style={{ width: '100%', marginTop: 12 }} onClick={endCall}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/>
              <line x1="23" y1="1" x2="1" y2="23"/>
            </svg>
            {lang === 'mr' ? 'कॉल समाप्त करा' : 'End Call & Save Notes'}
          </button>
        </div>
      )}

      {callState === 'ended' && (
        <div className="tc-status ended">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--col-teal)" strokeWidth="2" width="40" height="40">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <p style={{ fontWeight: 700, color: 'var(--col-teal)' }}>
            {lang === 'mr' ? 'दूरसल्ला पूर्ण झाला' : 'Teleconsult Completed'}
          </p>
          {consultNotes && <div className="tc-summary"><strong>Notes:</strong> {consultNotes}</div>}
          {prescription && <div className="tc-summary" style={{ marginTop: 8 }}><strong>Prescription:</strong> {prescription}</div>}
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => { setCallState('idle'); setConsultNotes(''); setPrescription(''); setElapsedSec(0); }}>
            {lang === 'mr' ? 'नवीन सल्ला सुरू करा' : 'Start New Teleconsult'}
          </button>
        </div>
      )}
    </section>
  );
};
