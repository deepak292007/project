import React, { useEffect, useState } from 'react';
import { PageShell, EmptyState, SkeletonRow } from '../../components/layout/PageShell';
import { TriageNoteCard } from '../../components/shared/TriageNoteCard';
import { DistanceFinder } from '../../components/shared/DistanceFinder';
import { TeleconsultPanel } from '../../components/shared/TeleconsultPanel';
import { LongDistanceCoordinator } from '../../components/shared/LongDistanceCoordinator';
import { EmergencySOSPanel } from '../../components/shared/EmergencySOSPanel';
import { GrievancePortal } from '../../components/shared/GrievancePortal';
import { OPBookingPortal } from '../../components/shared/OPBookingPortal';
import { LiveFacilityMap } from '../../components/shared/LiveFacilityMap';
import { AvailableRoomsPortal } from '../../components/shared/AvailableRoomsPortal';
import { useSession } from '../../store';
import { speak } from '../../lib/voice';
import * as api from '../../lib/api';
import type { Encounter, Referral, TriageResult, Lang, OPBookingRecord, MedicineDeliveryRequest } from '../../types';

type View = 'symptom' | 'triage' | 'facility' | 'book' | 'record' | 'followups' | 'transport' | 'opd' | 'emergency' | 'grievance' | 'rooms';

const SYMPTOM_DEFINITIONS = [
  { id: 'fever', en: 'Fever', mr: 'ताप', hi: 'बुखार', te: 'జ్వరం', kn: 'ಜ್ವರ' },
  { id: 'headache', en: 'Headache', mr: 'डोकेदुखी', hi: 'सिरदर्द', te: 'తలనొప్పి', kn: 'ತಲೆನೋವು' },
  { id: 'cough', en: 'Cough / Cold', mr: 'खोकला / सर्दी', hi: 'खांसी / जुकाम', te: 'దగ్గు / జలుబు', kn: 'ಕೆಮ್ಮು / ಶೀತ' },
  { id: 'fatigue', en: 'Fatigue / Tiredness', mr: 'थकवा / अशक्तपणा', hi: 'थकान / कमजोरी', te: 'నీరసం / అలసట', kn: 'ಆಯಾಸ / ದಣಿವು' },
  { id: 'bodyache', en: 'Body Aches', mr: 'अंगदुखी', hi: 'बदन दर्द', te: 'శరీర నొప్పులు', kn: 'ಮೈಕೈ ನೋವು' },
  { id: 'vomiting', en: 'Vomiting', mr: 'उलटी', hi: 'उल्टी', te: 'వాంతులు', kn: 'ವಾಂತಿ' },
  { id: 'diarrhoea', en: 'Diarrhoea', mr: 'अतिसार / जुलाब', hi: 'दस्त', te: 'విరేచనాలు', kn: 'ಭೇದಿ' },
  { id: 'abdominal_pain', en: 'Abdominal Pain', mr: 'पोटदुखी', hi: 'पेट दर्द', te: 'కడుపు నొప్పి', kn: 'ಹೊಟ್ಟೆ ನೋವು' },
  { id: 'swelling_legs', en: 'Swelling in Legs', mr: 'पायांना सूज', hi: 'पैरों में सूजन', te: 'కాళ్ల వాపు', kn: 'ಕಾಲುಗಳಲ್ಲಿ ಊತ' },
  { id: 'chest_pain', en: 'Chest Pain', mr: 'छातीत वेदना', hi: 'सीने में दर्द', te: 'ఛాతీ / గుండె నొప్పి', kn: 'ಎದೆ ನೋವು' },
  { id: 'difficulty_breathing', en: 'Difficulty Breathing', mr: 'श्वास घेण्यास त्रास', hi: 'सांस लेने में तकलीफ', te: 'శ్వాస తీసుకోవడంలో ఇబ్బంది', kn: 'ಉಸಿರಾಟದ ತೊಂದರೆ' },
  { id: 'routine_anc', en: 'Routine Pregnancy (ANC)', mr: 'नियमित गरोदर तपासणी (ANC)', hi: 'नियमित प्रसवपूर्व जांच', te: 'గర్భధారణ పరీక్ష (ANC)', kn: 'ಗರ್ಭಿಣಿ ತಪಾಸಣೆ (ANC)' }
];

// ─── Symptom Entry ──────────────────────────────────────────────────
const SymptomEntry: React.FC<{
  onTriage: (r: TriageResult) => void;
  onSymptomsChange?: (symptoms: string[]) => void;
}> = ({ onTriage, onSymptomsChange }) => {
  const { lang, name, setLang } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Fever', 'Headache']);
  const [custom, setCustom] = useState('');
  const [vitals, setVitals] = useState({ bp: '', pulse: '', temp: '', spo2: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onSymptomsChange) {
      onSymptomsChange(selectedSymptoms);
    }
  }, []);

  // Auto-detect location & language on first load if geolocation available
  useEffect(() => {
    if (navigator.geolocation && !localStorage.getItem('al-lang-manual-override')) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/location/detect-language`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          }).then(r => r.json()).then(loc => {
            if (loc.language) setLang(loc.language);
          }).catch(() => {});
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, [setLang]);

  function toggle(symptomText: string) {
    const next = selectedSymptoms.includes(symptomText)
      ? selectedSymptoms.filter(x => x !== symptomText)
      : [...selectedSymptoms, symptomText];
    setSelectedSymptoms(next);
    if (onSymptomsChange) {
      onSymptomsChange(next);
    }
  }

  async function runTriage() {
    setLoading(true);
    try {
      const all = custom ? [...selectedSymptoms, custom] : selectedSymptoms;
      const v = { bp: vitals.bp, pulse: Number(vitals.pulse), temp: Number(vitals.temp), spo2: Number(vitals.spo2) };
      const result = await api.runTriage({
        symptoms: all,
        vitals: v,
        lang: currentLang,
        context: name || 'Citizen Beneficiary'
      });
      onTriage(result);
    } finally { setLoading(false); }
  }

  const labels: Record<Lang, { title: string; common: string; other: string; otherPlaceholder: string; vitalsTitle: string; assessBtn: string; assessing: string; note: string }> = {
    en: { title: 'Report Symptoms & Health Check', common: 'Select your symptoms', other: 'Other / Specific Complaints', otherPlaceholder: 'Describe additional symptoms or health concerns…', vitalsTitle: 'Vital Signs (Optional)', assessBtn: 'Run Clinical Analyse', assessing: 'Analyzing Symptoms & Vitals…', note: 'Certified clinical protocol (NHM aligned) • Not a replacement for a doctor' },
    hi: { title: 'लक्षण रिपोर्ट एवं स्वास्थ्य जांच', common: 'अपने लक्षण चुनें', other: 'अन्य / विशिष्ट शिकायतें', otherPlaceholder: 'अन्य लक्षण या स्वास्थ्य चिंताएं लिखें…', vitalsTitle: 'वाइटल संकेत (वैकल्पिक)', assessBtn: 'क्लीनिकल विश्लेषण शुरू करें', assessing: 'लक्षणों का विश्लेषण जारी है…', note: 'प्रमाणित क्लिनिकल प्रोटोकॉल (NHM) • डॉक्टर का विकल्प नहीं' },
    mr: { title: 'लक्षणे नोंदवा व आरोग्य तपासणी', common: 'आपली लक्षणे निवडा', other: 'इतर तक्रारी', otherPlaceholder: 'इतर लक्षणे किंवा समस्या येथे लिहा…', vitalsTitle: 'महत्त्वाच्या नोंदी (पर्यायी)', assessBtn: 'क्लिनिकल विश्लेषण करा', assessing: 'लक्षणे व नोंदी तपासत आहे…', note: 'प्रमाणित क्लिनिकल पद्धती (NHM) • डॉक्टरांचा प्रत्यक्ष पर्याय नाही' },
    te: { title: 'లక్షణాల నమోదు & ఆరోగ్య పరీక్ష', common: 'మీ లక్షణాలను ఎంచుకోండి', other: 'ఇతర నిర్దిష్ట సమస్యలు', otherPlaceholder: 'ఇతర లక్షణాలు లేదా సమస్యలను వివరించండి…', vitalsTitle: 'వైటల్ రీడింగ్స్ (ఐచ్ఛికం)', assessBtn: 'క్లినికల్ విశ్లేషణ ప్రారంభించండి (Clinical Analyse)', assessing: 'లక్షణాల విశ్లేషణ జరుగుతోంది…', note: 'ప్రామాణిక క్లినికల్ విధానం (NHM) • ఇది డాక్టర్ ప్రత్యామ్నాయం కాదు' },
    kn: { title: 'ರೋಗಲಕ್ಷಣಗಳ ವರದಿ ಮತ್ತು ಆರೋಗ್ಯ ತಪಾಸಣೆ', common: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ', other: 'ಇತರ ನಿರ್ದಿಷ್ಟ ದೂರುಗಳು', otherPlaceholder: 'ಹೆಚ್ಚುವರಿ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ…', vitalsTitle: 'ವೈಟಲ್ ಸಂಕೇತಗಳು (ಐಚ್ಛಿಕ)', assessBtn: 'ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಿ (Clinical Analyse)', assessing: 'ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…', note: 'ನ್ಯಾಷನಲ್ ಹೆಲ್ತ್ ಮಿಷನ್ (NHM) ಪ್ರಮಾಣಿತ • ವೈದ್ಯರ ಪರ್ಯಾಯವಲ್ಲ' }
  };
  const l = labels[currentLang];

  return (
    <div style={{ width: '100%' }}>
      <div className="card">
        <div className="card-header"><h3 style={{ margin: 0 }}>{l.title}</h3></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">{l.common}</label>
            <div className="diag-grid">
              {SYMPTOM_DEFINITIONS.map(s => {
                const text = s[currentLang] || s.en;
                const isSelected = selectedSymptoms.includes(text) || selectedSymptoms.includes(s.en);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(text)}
                    className={`diag-chip${isSelected ? ' available' : ''}`}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--col-teal)' : '1px solid var(--col-border)',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">{l.other}</label>
            <input className="form-control" placeholder={l.otherPlaceholder} value={custom} onChange={e => setCustom(e.target.value)} />
          </div>
          <div className="section-title" style={{ marginTop: 16 }}>{l.vitalsTitle}</div>
          <div className="vitals-grid">
            {[{ k: 'bp', l: 'BP (mmHg)', p: '120/80' }, { k: 'pulse', l: 'Pulse (/min)', p: '72' }, { k: 'temp', l: 'Temp (°C)', p: '37.0' }, { k: 'spo2', l: 'SpO2 (%)', p: '98' }].map(f => (
              <div key={f.k} className="vital-cell">
                <span className="vital-label">{f.l}</span>
                <input type="text" placeholder={f.p} className="form-control" style={{ marginTop: 4, textAlign: 'center' }}
                  value={(vitals as Record<string, string>)[f.k]} onChange={e => setVitals(v => ({ ...v, [f.k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
        <div className="card-footer">
          <button onClick={runTriage} disabled={(selectedSymptoms.length === 0 && !custom) || loading} className="btn btn-primary">
            {loading ? l.assessing : l.assessBtn}
          </button>
          <span className="text-xs text-muted">{l.note}</span>
        </div>
      </div>
    </div>
  );
};

// ─── My Health Record (ABHA Longitudinal Timeline) ───────────────────
const MyRecord: React.FC = () => {
  const { name, lang } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [opBookings, setOpBookings] = useState<OPBookingRecord[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [medicines, setMedicines] = useState<MedicineDeliveryRequest[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'encounters' | 'opd' | 'medicines' | 'referrals' | 'prescriptions'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toArr = (r: any) => {
      if (Array.isArray(r)) return r;
      if (Array.isArray(r?.data)) return r.data;
      return [];
    };

    setLoading(true);
    Promise.all([
      api.getEncounters(name ? { patientName: name } : undefined).then(toArr).catch(() => []),
      api.get<any>(`/api/opd/bookings?patientName=${encodeURIComponent(name || '')}`).then(toArr).catch(() => []),
      api.getReferrals().then(toArr).catch(() => []),
      api.get<any>('/api/medicines/delivery-requests').then(toArr).catch(() => []),
      api.get<any>('/api/patients/all/prescriptions').then(toArr).catch(() => [])
    ]).then(([encs, ops, refs, meds, rxs]) => {
      setEncounters(encs);
      setOpBookings(ops);
      setReferrals(refs);
      setMedicines(meds);
      setPrescriptions(rxs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [name]);

  const recordLabels: Record<Lang, { title: string; all: string; encs: string; ops: string; meds: string; refs: string; rxs: string; empty: string }> = {
    en: { title: `ABHA Longitudinal Health Timeline — ${name || 'Citizen'}`, all: 'All Records', encs: 'Clinical Encounters & Analyse', ops: 'OP Tokens', meds: 'Medicine Deliveries', refs: 'Referrals', rxs: 'e-Prescriptions', empty: 'No records found yet. Book an OP token or run Clinical Analyse to see records here.' },
    hi: { title: `आभा (ABHA) स्वास्थ्य समय रेखा — ${name || 'नागरिक'}`, all: 'सभी रिकॉर्ड', encs: 'क्लिनिकल विश्लेषण एवं मुलाकात', ops: 'ओपीडी टोकन', meds: 'दवा वितरण', refs: 'रेफरल', rxs: 'ई-प्रिस्क्रिप्शन', empty: 'कोई रिकॉर्ड नहीं मिला। क्लिनिकल विश्लेषण या ओपीडी टोकन बुक करें।' },
    mr: { title: `आरोग्य इतिहास (ABHA) — ${name || 'नागरिक'}`, all: 'सर्व नोंदी', encs: 'वैद्यकीय तपासणी व क्लिनिकल विश्लेषण', ops: 'ओपीडी टोकन', meds: 'औषध वितरण', refs: 'रेफरल्स', rxs: 'ई-प्रिस्क्रिप्शन', empty: 'कोणत्याही नोंदी नाहीत. क्लिनिकल विश्लेषण करा किंवा टोकन बुक करा.' },
    te: { title: `ఆరోగ్య చరిత్ర (ABHA కాలక్రమం) — ${name || 'పౌరుడు'}`, all: 'అన్ని రికార్డులు', encs: 'క్లినికల్ విశ్లేషణ & రికార్డులు', ops: 'OP టోకెన్లు', meds: 'మందుల పంపిణీ', refs: 'రెఫరల్స్', rxs: 'ఇ-ప్రిస్క్రిప్షన్లు', empty: 'ఇంకా ఎటువంటి రికార్డులు లేవు. OP టోకెన్ లేదా క్లినికల్ విశ్లేషణ నిర్వహించండి.' },
    kn: { title: 'ಆರೋಗ್ಯ ಇತಿಹಾಸ (ABHA ಟೈಮ್‌ಲೈನ್) — ' + (name || 'ನಾಗರಿಕ'), all: 'ಎಲ್ಲಾ ದಾಖಲೆಗಳು', encs: 'ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ & ಭೇಟಿಗಳು', ops: 'OP ಟೋಕನ್‌ಗಳು', meds: 'ಔಷಧ ವಿತರಣೆ', refs: 'ರೆಫರಲ್‌ಗಳು', rxs: 'ಇ-ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು', empty: 'ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ. OP ಟೋಕನ್ ಅಥವಾ ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ ಮಾಡಿ.' }
  };
  const rl = recordLabels[currentLang];

  const totalCount = encounters.length + opBookings.length + medicines.length + referrals.length + prescriptions.length;

  return (
    <div>
      <div className="section-title" style={{ marginBottom: 12 }}>
        {rl.title}
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[
          { id: 'all', label: `${rl.all} (${totalCount})` },
          { id: 'encounters', label: `${rl.encs} (${encounters.length})` },
          { id: 'opd', label: `${rl.ops} (${opBookings.length})` },
          { id: 'prescriptions', label: `${rl.rxs || 'Prescriptions'} (${prescriptions.length})` },
          { id: 'medicines', label: `${rl.meds} (${medicines.length})` },
          { id: 'referrals', label: `${rl.refs} (${referrals.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8125rem' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <table className="data-table"><tbody>{[...Array(3)].map((_, i) => <SkeletonRow key={i} cols={4} />)}</tbody></table>
      ) : totalCount === 0 ? (
        <EmptyState message="No health records found" sub={rl.empty} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 1. Encounters & Analyse */}
          {(activeTab === 'all' || activeTab === 'encounters') && encounters.map(enc => (
            <div key={enc._id} className="card" style={{ borderLeft: '4px solid var(--col-teal)' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-info">{enc.type || 'OPD'}</span>
                    <strong>{enc.department || enc.type}</strong>
                    <span className="text-muted">• {enc.facilityName}</span>
                  </div>
                  <span className="text-sm text-muted">
                    {enc.conductedAt ? new Date(enc.conductedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>

                {enc.chiefComplaint && (
                  <div style={{ fontSize: '0.875rem', marginBottom: 6 }}>
                    <strong>{currentLang === 'te' ? 'లక్షణం / ఫిర్యాదు:' : 'Chief Complaint:'}</strong> {enc.chiefComplaint}
                  </div>
                )}

                {enc.triageResult && <TriageNoteCard result={enc.triageResult} />}
                {enc.notes && <p className="text-sm text-muted" style={{ marginTop: 8, fontStyle: 'italic' }}>{enc.notes}</p>}
              </div>
            </div>
          ))}

          {/* 2. OP Bookings */}
          {(activeTab === 'all' || activeTab === 'opd') && opBookings.map(b => (
            <div key={b._id || b.bookingId} className="card" style={{ borderLeft: '4px solid #10b981', background: '#f0fdf4' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-success" style={{ background: '#059669', color: '#ffffff', fontWeight: 700 }}>
                      🎟️ {b.tokenNumber}
                    </span>
                    <strong>{b.facilityName}</strong>
                    <span className="text-muted">• {b.department}</span>
                  </div>
                  <span className="text-sm" style={{ fontWeight: 600, color: 'var(--col-teal-dark)' }}>
                    ⏱️ Est. Wait: ~{b.estimatedWaitMinutes || 15}m (Pos #{b.queuePosition || 1})
                  </span>
                </div>
                <div className="text-sm text-muted">
                  👨‍⚕️ Doctor: {b.doctorName || 'Medical Officer'} · Slot: {b.slotTime || '10:00 AM'} · Fee: ₹0.00 (Public Service)
                </div>
              </div>
            </div>
          ))}

          {/* 3. e-Prescriptions */}
          {(activeTab === 'all' || activeTab === 'prescriptions') && prescriptions.map((rx, idx) => (
            <div key={rx._id || idx} className="card" style={{ borderLeft: '4px solid #8b5cf6', background: '#faf5ff' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge" style={{ background: '#8b5cf6', color: '#ffffff', fontWeight: 700 }}>
                      💊 e-Prescription
                    </span>
                    <strong>{rx.facilityName || 'Government Hospital'}</strong>
                    <span className="text-muted">• Dr. {rx.prescribedBy || 'Attending Physician'}</span>
                  </div>
                  <span className="text-sm text-muted">
                    {rx.authoredOn ? new Date(rx.authoredOn).toLocaleDateString('en-IN') : 'Today'}
                  </span>
                </div>
                {Array.isArray(rx.medications) && rx.medications.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rx.medications.map((m: any, mi: number) => (
                      <span key={mi} className="badge badge-neutral" style={{ fontSize: '0.8125rem', padding: '4px 8px' }}>
                        {m.name} ({m.dose || '1 tab'} · {m.freq || 'OD'} · {m.days || '5'}d)
                      </span>
                    ))}
                  </div>
                )}
                {rx.note && <div className="text-sm text-muted" style={{ marginTop: 6, fontStyle: 'italic' }}>Note: {rx.note}</div>}
              </div>
            </div>
          ))}

          {/* 4. Medicine Deliveries */}
          {(activeTab === 'all' || activeTab === 'medicines') && medicines.map(m => (
            <div key={m._id || m.requestId} className="card" style={{ borderLeft: '4px solid #059669', background: '#f0fdf4' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-success">📦 {m.requestId}</span>
                    <strong>ASHA Medicine Dispatch</strong>
                    <span className="text-muted">• {m.village}</span>
                  </div>
                  <span className="badge badge-outline">{m.status || 'dispatched'}</span>
                </div>
                <div className="text-sm text-muted">
                  ASHA: {m.assignedAshaName} ({m.assignedAshaPhone}) · Est: ~{m.estimatedDeliveryHours || 3}h
                </div>
              </div>
            </div>
          ))}

          {/* 4. Referrals */}
          {(activeTab === 'all' || activeTab === 'referrals') && referrals.map(ref => (
            <div key={ref._id} className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge ${ref.urgency === 'emergency' ? 'badge-emergency' : 'badge-urgent'}`}>
                      {ref.urgency.toUpperCase()}
                    </span>
                    <strong>{ref.toFacilityName || 'Higher Center'}</strong>
                  </div>
                  <span className="badge badge-info">{ref.currentStage}</span>
                </div>
                <div className="text-sm text-muted">
                  Reason: {ref.reason} · Transport: {(ref as any).transportMode || '108 Ambulance'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Patient View ─────────────────────────────────────────────
export const PatientView: React.FC<{ view: View; onNavigate?: (navId: string) => void }> = ({ view, onNavigate }) => {
  const { lang, name } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);

  // Symptoms & Location State for Right-Col Facility Ranking
  const [currentSymptoms, setCurrentSymptoms] = useState<string[]>(['Fever', 'Headache']);
  const [coords, setCoords] = useState({ lat: 16.4971, lng: 80.5003 }); // VIT-AP / Amaravati
  const [selectedLoc, setSelectedLoc] = useState<'vit_ap' | 'inavolu' | 'mandadam' | 'palghar'>('vit_ap');
  const [rankedFacilities, setRankedFacilities] = useState<any[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(false);
  const [rightTab, setRightTab] = useState<'ranked' | 'map'>('ranked');

  // Booking Modal State
  const [bookingFacility, setBookingFacility] = useState<any | null>(null);
  const [patientPhone, setPatientPhone] = useState('9848011223');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  // Fetch Ranked Hospitals whenever symptoms or coordinates change
  useEffect(() => {
    fetchRankedHospitals();
  }, [currentSymptoms, coords]);

  async function fetchRankedHospitals() {
    setLoadingFacilities(true);
    try {
      const sxQuery = currentSymptoms.join(',');
      const res = await api.get<any>(
        `/api/opd/hospitals/prioritize?lat=${coords.lat}&lng=${coords.lng}&symptoms=${encodeURIComponent(sxQuery)}`
      );
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (list.length > 0) {
        setRankedFacilities(list);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingFacilities(false);
    }
  }

  function handleLocationChange(loc: 'vit_ap' | 'inavolu' | 'mandadam' | 'palghar') {
    setSelectedLoc(loc);
    if (loc === 'vit_ap') setCoords({ lat: 16.4971, lng: 80.5003 });
    else if (loc === 'inavolu') setCoords({ lat: 16.5162, lng: 80.4988 });
    else if (loc === 'mandadam') setCoords({ lat: 16.5408, lng: 80.5482 });
    else if (loc === 'palghar') setCoords({ lat: 19.6032, lng: 72.7183 });
  }

  function handleTriage(result: TriageResult) {
    setTriageResult(result);
    const speakText = result.patientMessage || result.clinicalReasoning || '';
    if (speakText) speak(speakText, currentLang);
  }

  async function handleBookOPToken(facility: any) {
    setBookingSubmitting(true);
    try {
      const res = await api.post<any>('/api/opd/book', {
        patientName: name || 'Citizen Beneficiary',
        abhaId: 'ABHA-AP-2026-00101',
        phone: patientPhone,
        facilityId: facility.facilityId,
        facilityName: facility.name,
        department: facility.recommendedDepartment || 'General OPD',
        doctorName: facility.availableDoctors?.[0]?.name || 'On-Duty Medical Officer',
        symptoms: currentSymptoms,
        clinicalUrgency: triageResult?.urgency || 'routine'
      });

      const record = res?.tokenNumber ? res : (res?.data || null);

      if (record) {
        setActiveTicket(record);
        setBookingFacility(null);
        const voiceText = currentLang === 'te'
          ? `${facility.name} లో OP టోకెన్ ${record.tokenNumber} నిర్ధారించబడింది. వేచి ఉండే సమయం సుమారు ${record.estimatedWaitMinutes} నిమిషాలు.`
          : currentLang === 'kn'
          ? `${facility.name} ನಲ್ಲಿ OP ಟೋಕನ್ ${record.tokenNumber} ದೃಢಪಟ್ಟಿದೆ. ಕಾಯುವ ಸಮಯ ಸುಮಾರು ${record.estimatedWaitMinutes} ನಿಮಿಷಗಳು.`
          : currentLang === 'mr'
          ? `${facility.name} येथे ओपीडी टोकन ${record.tokenNumber} यशस्वीरित्या बुक झाले. अंदाजे प्रतीक्षा वेळ ${record.estimatedWaitMinutes} मिनिटे आहे.`
          : `OP Token ${record.tokenNumber} confirmed for ${facility.name}. Estimated waiting time is ${record.estimatedWaitMinutes} minutes.`;
        speak(voiceText, currentLang);
      }
    } catch {} finally {
      setBookingSubmitting(false);
    }
  }

  function goTo(targetView: string) {
    if (onNavigate) {
      onNavigate(targetView);
    }
    window.location.hash = targetView;
  }

  const titles: Record<string, Record<Lang, string>> = {
    symptom:  { en: 'Report Symptoms & Clinical Analyse', hi: 'लक्षण रिपोर्ट एवं क्लीनिकल विश्लेषण', mr: 'लक्षणे नोंदवा व क्लिनिकल विश्लेषण', te: 'లక్షణాల నమోదు & క్లినికల్ విశ్లేషణ', kn: 'ರೋಗಲಕ್ಷಣ ವರದಿ & ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ' },
    opd:      { en: 'Outpatient (OP) Booking & Queue Wait Time', hi: 'ओपीडी टोकन बुकिंग एवं प्रतीक्षा समय', mr: 'ओपीडी टोकन बुकिंग व प्रतीक्षा वेळ', te: 'OP టోకెన్ బుకింగ్ & క్యూ వేచియుండే సమయం', kn: 'OP ಟೋಕನ್ ಬುಕಿಂಗ್ & ಸರದಿ ಸಮಯ' },
    triage:   { en: 'Clinical Analyse Assessment', hi: 'क्लीनिकल विश्लेषण मूल्यांकन', mr: 'क्लिनिकल विश्लेषण निष्कर्ष', te: 'క్లినికల్ విశ్లేషణ అంచనా', kn: 'ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ ಮೌಲ್ಯಮಾಪನ' },
    facility: { en: 'Find Nearest Health Facility', hi: 'नजदीकी स्वास्थ्य सुविधा', mr: 'जवळचे आरोग्य केंद्र शोधा', te: 'దగ్గరి ఆరోగ్య కేంద్రం (Nemotron AI)', kn: 'ಹತ್ತಿರದ ಆರೋಗ್ಯ ಕೇಂದ್ರ (Nemotron AI)' },
    book:     { en: 'Assisted Teleconsultation', hi: 'सहाय्यक टेलीपरामर्श', mr: 'मदत टेलिकन्सल्टेशन सुविधा', te: 'టెలికన్సల్టేషన్ సహాయం', kn: 'ಸಹಾಯ ಟೆಲಿಕನ್ಸಲ್ಟೇಶನ್' },
    record:   { en: 'My Health Record (ABHA)', hi: 'मेरा स्वास्थ्य रिकॉर्ड (ABHA)', mr: 'माझे आरोग्य रेकॉर्ड (ABHA)', te: 'నా ఆరోగ్య రికార్డు (ABHA చరిత్ర)', kn: 'ನನ್ನ ಆರೋಗ್ಯ ದಾಖಲೆ (ABHA ಇತಿಹಾಸ)' },
    followups:{ en: 'Follow-up Schedule', hi: 'फॉलो-अप समय सारणी', mr: 'पाठपुरावा वेळापत्रक', te: 'ఫాలో-అప్ షెడ్యూల్', kn: 'ಫಾಲೋ-ಅಪ್ ವೇಳಾಪಟ್ಟಿ' },
    transport:{ en: '108 Transport & Hub Lab Network', hi: '108 एम्बुलेंस एवं लैब नेटवर्क', mr: '१०८ रुग्णवाहिका व लॅब नेटवर्क', te: '108 వాహనం & ల్యాబ్ నెట్‌వర్క్', kn: '108 ವಾಹನ & ಪ್ರಯೋಗಾಲಯ ಜಾಲ' },
    emergency:{ en: 'Emergency SOS & Crisis Response', hi: 'आपातकालीन संकट (SOS)', mr: 'आणीबाणी मदत (SOS)', te: 'అత్యవసర SOS & సంక్షోభ ప్రతిస్పందన', kn: 'ತುರ್ತು SOS & ಪ್ರತಿಕ್ರಿಯೆ' },
    grievance:{ en: 'Citizen Grievance & Service Vigilance', hi: 'नागरिक शिकायत एवं सेवा निगरानी', mr: 'नागरिक तक्रार व सेवा दक्षता', te: 'ప్రజా ఫిర్యాదులు & సేవా పర్యవేక్షణ', kn: 'ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ಸೇವೆ ನಿಗಾ' }
  };

  return (
    <PageShell title={titles[view]?.[currentLang] || titles[view]?.en || 'Patient Workspace'} breadcrumb="Patient Workspace">
      {view === 'symptom' && (
        <div className="triage-layout-grid">
          <div className="triage-left-col">
            <SymptomEntry onTriage={handleTriage} onSymptomsChange={setCurrentSymptoms} />
            {triageResult && (
              <div style={{ marginTop: 20 }}>
                <TriageNoteCard result={triageResult} patientName={name} />
                
                {/* Quick Action Buttons based on Triage Output */}
                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    id="btn-book-opd"
                    onClick={() => goTo('opd')}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {currentLang === 'te' ? 'OP టోకెన్ బుక్ చేయండి (క్యూ తనిఖీ)' : currentLang === 'kn' ? 'OP ಟೋಕನ್ ಬುಕ್ ಮಾಡಿ' : 'Book OP Token & Check Queue'}
                  </button>
                  <button
                    type="button"
                    id="btn-find-facility"
                    onClick={() => goTo('facility')}
                    className="btn btn-ghost"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'var(--col-surface)', border: '1px solid var(--col-border)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {currentLang === 'te' ? 'దగ్గరి ఆసుపత్రులు (AI Ranking)' : currentLang === 'kn' ? 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು' : 'Find Nearest Ranked Facility'}
                  </button>
                  <button
                    type="button"
                    id="btn-teleconsult"
                    onClick={() => goTo('book')}
                    className="btn btn-ghost"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'var(--col-surface)', border: '1px solid var(--col-border)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.05 3.4 2 2 0 0 1 3 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9A16 16 0 0 0 15 16.91l1.14-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    {currentLang === 'te' ? 'స్పెషలిస్ట్ సంప్రదింపు' : currentLang === 'kn' ? 'ತಜ್ಞರ ಸಂಪರ್ಕ' : 'Specialist Teleconsult'}
                  </button>
                  <button type="button" id="btn-rooms" onClick={() => goTo('rooms')} className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'var(--col-surface)', border: '1px solid var(--col-border)' }}><span>???</span>{currentLang === 'te' ? '????? & ???? (Rooms & Tariffs)' : currentLang === 'mr' ? '?????? ???? ? ??' : currentLang === 'hi' ? '???? ??? ?????' : 'Available Rooms & Tariffs'}</button>
                </div>
              </div>
            )}
          </div>

          <div className="triage-right-col">
            {/* Active Ticket Banner if token booked */}
            {activeTicket && (
              <div className="card" style={{ marginBottom: 16, border: '2px solid var(--col-green)', background: '#f0fdf4' }}>
                <div className="card-body" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.5rem' }}>🎟️</span>
                    <div>
                      <strong style={{ color: '#065f46', fontSize: '0.9375rem' }}>
                        OP Token Booked: {activeTicket.tokenNumber} (#{activeTicket.queuePosition} in Queue)
                      </strong>
                      <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                        {activeTicket.facilityName} · {activeTicket.department} · Est. Wait: ~{activeTicket.estimatedWaitMinutes}m
                      </div>
                    </div>
                  </div>
                  <button onClick={() => goTo('record')} className="btn btn-sm btn-primary">
                    View in ABHA Record
                  </button>
                </div>
              </div>
            )}

            {/* Right Column Header: Tab Toggle + Location Preset */}
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-body" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setRightTab('ranked')}
                    className={`btn btn-sm ${rightTab === 'ranked' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                  >
                    🏥 {currentLang === 'te' ? `ప్రాధాన్యత ఆసుపత్రులు (${rankedFacilities.length})` : `Ranked Facilities (${rankedFacilities.length})`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRightTab('map')}
                    className={`btn btn-sm ${rightTab === 'map' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                  >
                    🗺️ {currentLang === 'te' ? 'లైవ్ నెట్‌వర్క్ మ్యాప్' : 'Live Network Map'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--col-ink-muted)' }}>📍 Location:</span>
                  <select
                    value={selectedLoc}
                    onChange={e => handleLocationChange(e.target.value as any)}
                    className="form-control"
                    style={{ fontSize: '0.75rem', padding: '3px 8px', width: 'auto' }}
                  >
                    <option value="vit_ap">VIT-AP Campus (Inavolu)</option>
                    <option value="inavolu">Inavolu Village</option>
                    <option value="mandadam">Mandadam Village</option>
                    <option value="palghar">Palghar (MH)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tab 1: Ranked Facilities List */}
            {rightTab === 'ranked' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingFacilities ? (
                  <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                    <p>Evaluating clinical equipment match &amp; calculating M/M/c wait times…</p>
                  </div>
                ) : rankedFacilities.length === 0 ? (
                  <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                    <p>No facilities found in network.</p>
                  </div>
                ) : (
                  rankedFacilities.slice(0, 6).map((f, idx) => {
                    const displayName = currentLang === 'te' ? (f.nameTelugu || f.name)
                      : currentLang === 'kn' ? (f.nameKannada || f.name)
                      : currentLang === 'mr' ? (f.nameMarathi || f.name)
                      : currentLang === 'hi' ? (f.nameHindi || f.name)
                      : f.name;

                    const isTop = idx === 0;

                    return (
                      <div
                        key={f.facilityId}
                        className="card"
                        style={{
                          borderLeft: isTop ? '5px solid var(--col-green)' : '3px solid var(--col-teal)',
                          boxShadow: isTop ? '0 4px 12px rgba(13, 59, 53, 0.08)' : 'none'
                        }}
                      >
                        <div className="card-body" style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                className={`badge ${isTop ? 'badge-success' : 'badge-info'}`}
                                style={{ fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px' }}
                              >
                                #{idx + 1} {isTop ? 'Optimal Match' : `${f.priorityScore || 80}% Match`}
                              </span>
                              <strong style={{ fontSize: '0.9375rem', color: 'var(--col-teal-dark)' }}>{displayName}</strong>
                            </div>
                            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--col-ink-muted)' }}>
                              📍 {f.distKm} km · {f.travelMin} mins
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                            <div style={{ fontSize: '0.8125rem' }}>
                              <div>⏱️ M/M/c Est. Wait: <strong style={{ color: 'var(--col-green)' }}>~{f.estimatedWaitMinutes || 12} mins</strong> ({f.currentQueueLength || 3} in line)</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                                👨‍⚕️ {f.availableDoctors?.[0]?.name || 'Medical Officer'} · {f.recommendedDepartment || 'General OPD'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setBookingFacility(f)}
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '0.8125rem', padding: '6px 14px', cursor: 'pointer' }}
                            >
                              🎟️ Book OP Token
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Live Network Map */}
            {rightTab === 'map' && (
              <LiveFacilityMap height={540} />
            )}
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {bookingFacility && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', background: '#ffffff', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
            <div className="card-header" style={{ background: 'var(--col-teal-dark)', color: '#ffffff', justifyContent: 'space-between' }}>
              <strong style={{ color: '#ffffff' }}>Confirm OP Token Booking</strong>
              <button onClick={() => setBookingFacility(null)} className="btn btn-ghost btn-sm" style={{ color: '#ffffff' }}>✕</button>
            </div>
            <div className="card-body" style={{ padding: '18px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>SELECTED FACILITY</div>
                <strong style={{ fontSize: '1rem', color: 'var(--col-teal-dark)' }}>{bookingFacility.name}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-muted)' }}>
                  {bookingFacility.recommendedDepartment || 'General OPD'} · Distance: {bookingFacility.distKm} km
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 4, marginBottom: 14, border: '1px solid var(--col-border)' }}>
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Patient Name:</span>
                  <strong>{name || 'Citizen Beneficiary'}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Estimated Wait Time:</span>
                  <strong style={{ color: 'var(--col-green)' }}>~{bookingFacility.estimatedWaitMinutes || 12} Minutes</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Consultation Fee:</span>
                  <strong style={{ color: 'var(--col-green)' }}>₹0.00 (100% Free Public NHM)</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Phone Number for SMS Token &amp; Live Tracking:</label>
                <input
                  type="tel"
                  className="form-control"
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setBookingFacility(null)} className="btn btn-ghost">
                  Cancel
                </button>
                <button onClick={() => handleBookOPToken(bookingFacility)} disabled={bookingSubmitting} className="btn btn-primary">
                  {bookingSubmitting ? 'Booking Token…' : 'Confirm & Generate Token'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {((view as string) === 'opd') && (
        <div style={{ maxWidth: 940 }}>
          <OPBookingPortal />
        </div>
      )}
      {view === 'record' && <MyRecord />}
      {view === 'facility' && (
        <div style={{ maxWidth: 880 }}>
          <DistanceFinder />
        </div>
      )}
      {view === 'book' && (
        <div style={{ maxWidth: 840 }}>
          <TeleconsultPanel />
        </div>
      )}
      {view === 'transport' && (
        <div style={{ maxWidth: 880 }}>
          <LongDistanceCoordinator />
        </div>
      )}
      {((view as string) === 'emergency') && (
        <div style={{ maxWidth: 880 }}>
          <EmergencySOSPanel />
        </div>
      )}
      {((view as string) === 'grievance') && (
        <div style={{ maxWidth: 880 }}>
          <GrievancePortal />
        </div>
      )}
      {((view as string) === 'rooms') && (
        <div style={{ maxWidth: 1100 }}>
          <AvailableRoomsPortal onNavigate={goTo} />
        </div>
      )}
    </PageShell>
  );
};
