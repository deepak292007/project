/**
 * OPBookingPortal — Outpatient (OP) Booking & DSA-Driven Hospital Prioritization
 * Uses real-world Andhra Pradesh (VIT-AP, Inavolu, Mandadam, Tulluru, AIIMS Mangalagiri, GGH Guntur)
 * and Maharashtra datasets with M/M/c queueing theory waiting time calculations.
 * Includes Government Essential Medicine Delivery for basic symptoms via ASHA network.
 */
import React, { useState, useEffect } from 'react';
import { useSession } from '../../store';
import { speak } from '../../lib/voice';
import * as api from '../../lib/api';
import type { Lang, MedicineDeliveryRequest } from '../../types';

interface PrioritizedHospital {
  facilityId: string;
  name: string;
  nameMarathi?: string;
  nameTelugu?: string;
  nameKannada?: string;
  nameHindi?: string;
  level: string;
  district: string;
  state: string;
  address: string;
  phone: string;
  distKm: number;
  travelMin: number;
  estimatedWaitMinutes: number;
  currentQueueLength: number;
  activeCounters: number;
  emergencyOpen24h: boolean;
  bedsAvailable: number;
  bedsTotal: number;
  matchedEquipment: string[];
  missingEquipment: string[];
  equipmentScore: number;
  priorityScore: number;
  availableDoctors: Array<{ name: string; specialty: string; nextSlot: string }>;
  recommendedDepartment: string;
}

interface OPBookingRecord {
  _id?: string;
  bookingId: string;
  tokenNumber: string;
  patientName: string;
  facilityName: string;
  department: string;
  doctorName: string;
  slotTime: string;
  queuePosition: number;
  estimatedWaitMinutes: number;
  status: string;
  symptoms: string[];
  consultationFee: number;
}

export const OPBookingPortal: React.FC = () => {
  const { lang, name } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  // Region / Location Coordinates
  const [selectedLocation, setSelectedLocation] = useState<'vit_ap' | 'inavolu' | 'mandadam' | 'palghar'>('vit_ap');
  const [coords, setCoords] = useState({ lat: 16.4971, lng: 80.5003 }); // VIT-AP default

  // Selected Symptoms for DSA Equipment Matching
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Fever', 'Headache']);
  const [hospitals, setHospitals] = useState<PrioritizedHospital[]>([]);
  const [loading, setLoading] = useState(false);

  // Booking Modal State
  const [bookingFacility, setBookingFacility] = useState<PrioritizedHospital | null>(null);
  const [patientPhone, setPatientPhone] = useState('9848011223');
  const [submitting, setSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState<OPBookingRecord | null>(null);
  const [myBookings, setMyBookings] = useState<OPBookingRecord[]>([]);

  // Medicine Delivery State
  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('Door No. 4-12, Main Street, Inavolu Village');
  const [deliveryVillage, setDeliveryVillage] = useState('Inavolu Village');
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [activeDelivery, setActiveDelivery] = useState<MedicineDeliveryRequest | null>(null);
  const [myDeliveries, setMyDeliveries] = useState<MedicineDeliveryRequest[]>([]);

  useEffect(() => {
    fetchPrioritizedHospitals();
    loadMyBookings();
    loadMyDeliveries();
  }, [coords, selectedSymptoms]);

  function handleLocationChange(loc: 'vit_ap' | 'inavolu' | 'mandadam' | 'palghar') {
    setSelectedLocation(loc);
    if (loc === 'vit_ap') setCoords({ lat: 16.4971, lng: 80.5003 });
    else if (loc === 'inavolu') setCoords({ lat: 16.5162, lng: 80.4988 });
    else if (loc === 'mandadam') setCoords({ lat: 16.5408, lng: 80.5482 });
    else if (loc === 'palghar') setCoords({ lat: 19.6032, lng: 72.7183 });
  }

  function toggleSymptom(sx: string) {
    if (selectedSymptoms.includes(sx)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sx));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sx]);
    }
  }

  async function fetchPrioritizedHospitals() {
    setLoading(true);
    try {
      const sxQuery = selectedSymptoms.join(',');
      const res = await api.get<any>(
        `/api/opd/hospitals/prioritize?lat=${coords.lat}&lng=${coords.lng}&symptoms=${encodeURIComponent(sxQuery)}`
      );
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (list.length > 0) {
        setHospitals(list);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  async function loadMyBookings() {
    try {
      const res = await api.get<any>(`/api/opd/bookings?patientName=${encodeURIComponent(name || '')}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setMyBookings(list);
    } catch {}
  }

  async function loadMyDeliveries() {
    try {
      const res = await api.get<any>(`/api/medicines/delivery-requests?phone=${encodeURIComponent(patientPhone)}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setMyDeliveries(list);
    } catch {}
  }

  async function handleBookToken(facility: PrioritizedHospital) {
    setSubmitting(true);
    try {
      const res = await api.post<any>('/api/opd/book', {
        patientName: name || 'Citizen Beneficiary',
        abhaId: 'ABHA-AP-2026-00101',
        phone: patientPhone,
        facilityId: facility.facilityId,
        facilityName: facility.name,
        department: facility.recommendedDepartment || 'General OPD',
        doctorName: facility.availableDoctors[0]?.name || 'On-Duty Medical Officer',
        symptoms: selectedSymptoms,
        clinicalUrgency: 'routine'
      });

      const record = (res?.tokenNumber ? res : (res?.data || null)) as OPBookingRecord | null;

      if (record) {
        setActiveTicket(record);
        setBookingFacility(null);
        loadMyBookings();
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
      setSubmitting(false);
    }
  }

  async function handleRequestMedicineDelivery() {
    setDeliverySubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; data: MedicineDeliveryRequest; message: string }>('/api/medicines/request-delivery', {
        patientName: name || 'Citizen Beneficiary',
        patientPhone,
        deliveryAddress,
        village: deliveryVillage,
        district: 'Guntur / Amaravati',
        symptoms: selectedSymptoms,
        clinicalUrgency: 'routine'
      });

      if (res?.data) {
        setActiveDelivery(res.data);
        setMedicineModalOpen(false);
        loadMyDeliveries();
        const voiceText = currentLang === 'te'
          ? `మందుల డెలివరీ అభ్యర్థన ${res.data.requestId} నమోదు చేయబడింది. ASHA కార్యకర్త త్వరలో మీ ఇంటికి చేరుకుంటారు.`
          : currentLang === 'kn'
          ? `ಔಷಧ ವಿತರಣೆ ವಿನಂತಿ ${res.data.requestId} ದಾಖಲಾಗಿದೆ. ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ಶೀಘ್ರದಲ್ಲೇ ತಲುಪಿಸುತ್ತಾರೆ.`
          : `Medicine delivery request ${res.data.requestId} submitted. ASHA worker assigned for home dispatch.`;
        speak(voiceText, currentLang);
      }
    } catch {} finally {
      setDeliverySubmitting(false);
    }
  }

  const isBasicSymptoms = selectedSymptoms.some(s => ['Fever', 'Headache', 'Mild Cough', 'Cold'].includes(s));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner */}
      <div style={{ background: 'var(--col-teal-dark)', color: '#ffffff', padding: '16px 20px', borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.75rem' }}>🏥</span>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff' }}>
                {currentLang === 'te' ? 'OP టోకెన్ బుకింగ్ & ఆసుపత్రి క్యూ వెయిటింగ్ సమయం'
                  : currentLang === 'kn' ? 'OP ಟೋಕನ್ ಬುಕಿಂಗ್ & ಆಸ್ಪತ್ರೆ ಕ್ಯೂ ಕಾಯುವ ಸಮಯ'
                  : currentLang === 'mr' ? 'ओपीडी (OP) टोकन बुकिंग व रुग्णालय प्राधान्य अल्गोरिदम'
                  : currentLang === 'hi' ? 'ओपीडी टोकन बुकिंग एवं अस्पताल प्रतीक्षा समय'
                  : 'Outpatient (OP) Token Booking & Queue Waiting Time'}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>
                National Health Mission (MoHFW) · Andhra Pradesh &amp; Rural Health Network
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 4, fontSize: '0.75rem' }}>
            <span>⚡ Algorithm:</span>
            <strong>M/M/c Multi-Server Queue + DSA Equipment Match</strong>
          </div>
        </div>
      </div>

      {/* Control Strip: Location & Symptoms */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            {/* Location Selector */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                📍 {currentLang === 'te' ? 'రోగి లొకేషన్ / రిఫరెన్స్ పాయింట్:' : 'Patient Geolocation / Reference Point:'}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {[
                  { id: 'vit_ap', label: '🎓 VIT-AP Campus (Inavolu)' },
                  { id: 'inavolu', label: '🏡 Inavolu Village' },
                  { id: 'mandadam', label: '🌾 Mandadam Village' },
                  { id: 'palghar', label: '🏖️ Kelwa / Palghar (MH)' }
                ].map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => handleLocationChange(loc.id as typeof selectedLocation)}
                    className={`btn btn-sm ${selectedLocation === loc.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.8125rem' }}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Coordinates Tag */}
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>
              <div>GPS: <code>{coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E</code></div>
              <div>Amaravati Capital Region, AP</div>
            </div>
          </div>

          {/* Symptom Selection for Dynamic Equipment & Priority Scoring */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--col-border)' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
              🩺 {currentLang === 'te' ? 'లక్షణాలు ఎంచుకోండి (పరికరాల లభ్యత & వెయిటింగ్ సమయం ఆధారంగా క్రమబద్ధీకరించబడుతుంది):'
                : 'Select Symptoms (DSA dynamically calculates required diagnostic equipment & specialist match):'}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {[
                { label: currentLang === 'te' ? 'జ్వరం' : 'Fever', code: 'Fever' },
                { label: currentLang === 'te' ? 'తలనొప్పి' : 'Headache', code: 'Headache' },
                { label: currentLang === 'te' ? 'ఛాతీ నొప్పి (గుండె)' : 'Chest Pain (Cardiac)', code: 'Chest Pain' },
                { label: currentLang === 'te' ? 'గర్భధారణ / ANC తనిఖీ' : 'Pregnancy / ANC Check', code: 'Pregnancy' },
                { label: currentLang === 'te' ? 'తీవ్రమైన శ్వాస సమస్య' : 'Severe Breathlessness', code: 'Breathlessness' },
                { label: currentLang === 'te' ? 'రక్తంలో చక్కెర (షుగర్)' : 'High Blood Sugar (Diabetes)', code: 'Diabetes' }
              ].map(sx => {
                const isSel = selectedSymptoms.includes(sx.code);
                return (
                  <button
                    key={sx.code}
                    onClick={() => toggleSymptom(sx.code)}
                    className={`diag-chip${isSel ? ' available' : ''}`}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8125rem',
                      fontWeight: isSel ? 700 : 500,
                      border: isSel ? '2px solid var(--col-teal)' : '1px solid var(--col-border)'
                    }}
                  >
                    {isSel ? '✓ ' : '+ '} {sx.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Routine Symptoms: Essential Medicine Delivery Callout */}
      {isBasicSymptoms && (
        <div className="card" style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0' }}>
          <div className="card-body" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.5rem' }}>💊</span>
              <div>
                <strong style={{ color: '#065f46', fontSize: '0.9375rem' }}>
                  {currentLang === 'te' ? 'ప్రాథమిక లక్షణాలకు ఇంటి వద్దకే మందుల సరఫరా (ASHA నెట్‌వర్క్)'
                    : currentLang === 'kn' ? 'ಪ್ರಾಥಮಿಕ ಲಕ್ಷಣಗಳಿಗೆ ಮನೆ ಬಾಗಿಲಿಗೆ ಔಷಧಿ ವಿತರಣೆ (ಆಶಾ ಜಾಲ)'
                    : 'Home Essential Medicine Delivery Available (ASHA Frontline Network)'}
                </strong>
                <div style={{ fontSize: '0.8125rem', color: '#047857' }}>
                  {currentLang === 'te' ? 'జ్వరం / తలనొప్పి కోసం ఆసుపత్రికి వెళ్లకుండానే ASHA ద్వారా ప్రభుత్వ సర్టిఫైడ్ కిట్ పొందండి.'
                    : 'Get standard verified OTC medicines (Paracetamol, ORS, Zinc) delivered to your home by the local ASHA worker.'}
                </div>
              </div>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => setMedicineModalOpen(true)}
              style={{ background: '#059669', color: '#ffffff', fontWeight: 600, border: 'none', padding: '8px 16px' }}
            >
              🏠 {currentLang === 'te' ? 'ఇంటికి మందులు ఆర్డర్ చేయండి' : 'Request Home Delivery'}
            </button>
          </div>
        </div>
      )}

      {/* Active Confirmed Token Slip (if just booked) */}
      {activeTicket && (
        <div className="card" style={{ border: '2px solid var(--col-teal)', background: '#f0fdf4' }}>
          <div className="card-header" style={{ background: 'var(--col-teal-dark)', color: '#ffffff', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.25rem' }}>🎟️</span>
              <strong style={{ color: '#ffffff' }}>Official Digital OP Token Generated (NHM / Dr. YSR Aarogyasri)</strong>
            </div>
            <button onClick={() => setActiveTicket(null)} className="btn btn-ghost btn-sm" style={{ color: '#ffffff' }}>✕</button>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>TOKEN NUMBER</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--col-teal-dark)', fontFamily: 'monospace' }}>
                  {activeTicket.tokenNumber}
                </div>
                <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>
                  👤 <strong>{activeTicket.patientName}</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>FACILITY &amp; ROOM</div>
                <strong style={{ fontSize: '0.9375rem' }}>{activeTicket.facilityName}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)' }}>
                  👨‍⚕️ {activeTicket.doctorName} · {activeTicket.department}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>ESTIMATED QUEUE WAIT (M/M/c)</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--col-green)' }}>
                  ⏱️ ~{activeTicket.estimatedWaitMinutes} Mins
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)' }}>
                  Queue Position: <strong>#{activeTicket.queuePosition}</strong> in Line
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>SLOT TIME &amp; FEE</div>
                <strong style={{ fontSize: '0.9375rem' }}>{activeTicket.slotTime}</strong>
                <div style={{ fontSize: '0.8125rem', color: 'var(--col-green)', fontWeight: 700 }}>
                  ✓ ₹0.00 (100% Free Public Health Service)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Medicine Delivery Tracker (if just requested) */}
      {activeDelivery && (
        <div className="card" style={{ border: '2px solid #059669', background: '#f0fdf4' }}>
          <div className="card-header" style={{ background: '#065f46', color: '#ffffff', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.25rem' }}>📦</span>
              <strong style={{ color: '#ffffff' }}>ASHA Essential Medicine Dispense Request Confirmed</strong>
            </div>
            <button onClick={() => setActiveDelivery(null)} className="btn btn-ghost btn-sm" style={{ color: '#ffffff' }}>✕</button>
          </div>
          <div className="card-body" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>TRACKING ID</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', fontFamily: 'monospace' }}>
                  {activeDelivery.requestId}
                </div>
                <div style={{ fontSize: '0.8125rem', marginTop: 4 }}>📍 {activeDelivery.deliveryAddress}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>ASSIGNED ASHA WORKER</div>
                <strong>{activeDelivery.assignedAshaName}</strong>
                <div style={{ fontSize: '0.8125rem', color: '#065f46' }}>📞 {activeDelivery.assignedAshaPhone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>ESTIMATED DELIVERY</div>
                <strong style={{ color: '#059669', fontSize: '1.1rem' }}>⏱️ ~{activeDelivery.estimatedDeliveryHours || 3} Hours</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>Dispensing: {activeDelivery.dispensingFacilityName}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Match Cards List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--col-teal-dark)' }}>
            🏥 {currentLang === 'te' ? `లక్షణాలు & పరికరాల ఆధారంగా ప్రాధాన్యత ఇవ్వబడిన ఆసుపత్రులు (${hospitals.length} అందుబాటులో ఉన్నాయి):`
              : `Hospitals Prioritized by Symptoms, Equipment & Wait Time (${hospitals.length} Available):`}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>
            Sorted by DSA Multi-Attribute Rank Score
          </span>
        </div>

        {loading ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <p>Evaluating clinical equipment match &amp; calculating M/M/c queue wait times…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {hospitals.map((h, idx) => {
              const displayName = currentLang === 'te' ? (h.nameTelugu || h.name)
                : currentLang === 'kn' ? (h.nameKannada || h.name)
                : currentLang === 'mr' ? (h.nameMarathi || h.name)
                : currentLang === 'hi' ? (h.nameHindi || h.name)
                : h.name;

              return (
                <div
                  key={h.facilityId}
                  className="card"
                  style={{
                    borderLeft: idx === 0 ? '5px solid var(--col-green)' : '1px solid var(--col-border)',
                    boxShadow: idx === 0 ? '0 4px 12px rgba(13, 59, 53, 0.08)' : 'none'
                  }}
                >
                  <div className="card-body" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {idx === 0 && (
                            <span className="badge badge-routine" style={{ fontWeight: 700, fontSize: '0.6875rem' }}>
                              ⭐ #1 BEST MATCHED FACILITY
                            </span>
                          )}
                          <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                            {h.level?.replace('_', ' ').toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>
                            {h.district}, {h.state}
                          </span>
                        </div>

                        <h3 style={{ margin: '6px 0 2px', fontSize: '1.15rem', color: 'var(--col-teal-dark)' }}>
                          {displayName}
                        </h3>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-muted)' }}>
                          📍 {h.address} · 📞 {h.phone}
                        </div>
                      </div>

                      {/* Right Key Metrics: Match Score, Distance, Wait Time */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', textAlign: 'right' }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--col-ink-muted)' }}>DISTANCE &amp; TRAVEL</div>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--col-ink)' }}>
                            📍 {h.distKm} km
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>
                            ~{h.travelMin} min drive
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--col-border)' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--col-ink-muted)' }}>EST. WAIT TIME (M/M/c)</div>
                          <strong style={{ fontSize: '1.05rem', color: h.estimatedWaitMinutes <= 15 ? 'var(--col-green)' : h.estimatedWaitMinutes <= 30 ? 'var(--col-amber)' : 'var(--col-red)' }}>
                            ⏱️ ~{h.estimatedWaitMinutes} Mins
                          </strong>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--col-ink-muted)' }}>
                            {h.currentQueueLength} in queue · {h.activeCounters} active counters
                          </div>
                        </div>

                        <button
                          onClick={() => setBookingFacility(h)}
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                        >
                          {currentLang === 'te' ? 'OP టోకెన్ బుక్ చేయండి' : 'Book OP Token'}
                        </button>
                      </div>
                    </div>

                    {/* Equipment & Doctor Availability Section */}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--col-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--col-teal-dark)' }}>⚙️ Matched Equipment:</span>
                        {h.matchedEquipment.length === 0 ? (
                          <span className="text-muted">Standard OPD kit</span>
                        ) : (
                          h.matchedEquipment.slice(0, 3).map((eq, i) => (
                            <span key={i} style={{ background: '#f0fdf4', color: 'var(--col-green)', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', border: '1px solid var(--col-green-border)' }}>
                              ✓ {eq}
                            </span>
                          ))
                        )}
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)' }}>
                        {h.availableDoctors.length > 0 ? (
                          <span>👨‍⚕️ <strong>{h.availableDoctors[0].name}</strong> ({h.availableDoctors[0].specialty}) · Next: {h.availableDoctors[0].nextSlot}</span>
                        ) : (
                          <span className="text-muted">Medical Officer on Duty</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Confirmation Dialog Modal */}
      {bookingFacility && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13, 59, 53, 0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <div className="card-header" style={{ background: 'var(--col-teal-dark)', color: '#ffffff', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff' }}>
                Confirm OP Token — {bookingFacility.name}
              </h3>
              <button onClick={() => setBookingFacility(null)} className="btn btn-ghost btn-sm" style={{ color: '#ffffff' }}>✕</button>
            </div>

            <div className="card-body" style={{ padding: '20px' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-muted)' }}>Patient Name:</div>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{name || 'Citizen Beneficiary'}</div>
              </div>

              <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>Estimated Wait Time (M/M/c):</div>
                  <strong style={{ color: 'var(--col-green)', fontSize: '1.1rem' }}>
                    ⏱️ ~{bookingFacility.estimatedWaitMinutes} Minutes
                  </strong>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>Queue Position:</div>
                  <strong style={{ fontSize: '1.1rem' }}>
                    #{bookingFacility.currentQueueLength + 1}
                  </strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Phone Number for SMS Token Alert:</label>
                <input
                  type="tel"
                  className="form-control"
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  placeholder="98XXXXXXXX"
                />
              </div>

              <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 4, border: '1px solid var(--col-green-border)', fontSize: '0.75rem', color: 'var(--col-green)', marginBottom: 16 }}>
                ✓ No Out-of-Pocket Cost: Covered 100% under Government Free Public Healthcare (NHM / Dr. YSR Aarogyasri).
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleBookToken(bookingFacility)}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Generating Token…' : 'Confirm & Generate Token Slip'}
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFacility(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Delivery Request Modal */}
      {medicineModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(13, 59, 53, 0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
            <div className="card-header" style={{ background: '#065f46', color: '#ffffff', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏠</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff' }}>
                  Request ASHA Home Medicine Kit
                </h3>
              </div>
              <button onClick={() => setMedicineModalOpen(false)} className="btn btn-ghost btn-sm" style={{ color: '#ffffff' }}>✕</button>
            </div>

            <div className="card-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.8125rem', color: 'var(--col-ink-muted)', marginTop: 0 }}>
                Government-verified OTC kit for mild symptoms (Paracetamol, ORS, Cetirizine) will be dispatched directly to your home via your local ASHA worker.
              </p>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Beneficiary Name:</label>
                <input type="text" className="form-control" readOnly value={name || 'Citizen Beneficiary'} />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Contact Phone Number:</label>
                <input type="tel" className="form-control" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Village / Sector:</label>
                <input type="text" className="form-control" value={deliveryVillage} onChange={e => setDeliveryVillage(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Delivery Address / Landmark:</label>
                <input type="text" className="form-control" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
              </div>

              <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 4, border: '1px solid #a7f3d0', fontSize: '0.75rem', color: '#065f46', marginBottom: 16 }}>
                ✓ 100% Free Public Health Service under National Rural Health Mission.
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleRequestMedicineDelivery}
                  disabled={deliverySubmitting}
                  className="btn btn-primary"
                  style={{ flex: 1, background: '#059669', borderColor: '#059669' }}
                >
                  {deliverySubmitting ? 'Requesting…' : 'Submit ASHA Delivery Request'}
                </button>
                <button type="button" onClick={() => setMedicineModalOpen(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient's Existing Active OP Tokens & Medicine Requests */}
      {(myBookings.length > 0 || myDeliveries.length > 0) && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1rem' }}>🎟️ My Registered OP Tokens &amp; Medicine Requests</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {myBookings.map(b => (
                <div key={b._id || b.bookingId} style={{ padding: '12px 14px', background: 'var(--col-paper)', borderRadius: 6, border: '1px solid var(--col-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: 'var(--col-teal-dark)' }}>
                      {b.tokenNumber}
                    </strong>
                    <span className="badge badge-routine" style={{ fontSize: '0.6875rem' }}>
                      ● {b.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 4 }}>
                    {b.facilityName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginTop: 2 }}>
                    👨‍⚕️ {b.doctorName} · {b.department}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--col-green)', fontWeight: 600, marginTop: 6 }}>
                    ⏱️ Wait: ~{b.estimatedWaitMinutes} mins · Slot: {b.slotTime}
                  </div>
                </div>
              ))}

              {myDeliveries.map(d => (
                <div key={d._id || d.requestId} style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#065f46' }}>
                      📦 {d.requestId}
                    </strong>
                    <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.6875rem' }}>
                      ● {d.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 4 }}>
                    {d.assignedAshaName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#065f46', marginTop: 2 }}>
                    📍 {d.deliveryAddress}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, marginTop: 6 }}>
                    ⏱️ ETA: ~{d.estimatedDeliveryHours || 3} Hours · ASHA 📞 {d.assignedAshaPhone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
