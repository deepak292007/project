/**
 * LongDistanceCoordinator — Rural Healthcare Access Solutions
 * Inspired by global methodologies:
 * 1. Rwanda Babyl / Zipline: Hub-and-Spoke lab sample pickup & remote digital report
 * 2. China County Health Consortia: Green channel bed & token guarantee before travel
 * 3. India 108 Emergency Medical Service & Janani Express JSSK Transport Vouchers
 * 4. Mobile Medical Unit (MMU) Scheduled Outreach Camps
 */
import React, { useState, useEffect } from 'react';
import { useSession } from '../../store';
import { speak } from '../../lib/voice';
import * as api from '../../lib/api';
import type { TransportDispatch, DiagnosticSample, MMUCamp } from '../../types';

export const LongDistanceCoordinator: React.FC = () => {
  const { lang, name } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as 'en' | 'hi' | 'mr' | 'te' | 'kn';

  const [activeTab, setActiveTab] = useState<'transport' | 'samples' | 'mmu'>('transport');
  const [dispatches, setDispatches] = useState<TransportDispatch[]>([]);
  const [samples, setSamples] = useState<DiagnosticSample[]>([]);
  const [mmuCamps, setMmuCamps] = useState<MMUCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingTransit, setBookingTransit] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await api.get<{ activeDispatches: TransportDispatch[]; pendingSamples: DiagnosticSample[]; mmuCamps: MMUCamp[] }>('/api/long-distance/overview');
      if (res) {
        setDispatches(res.activeDispatches || []);
        setSamples(res.pendingSamples || []);
        setMmuCamps(res.mmuCamps || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function bookEmergencyTransport() {
    setBookingTransit(true);
    setBookingSuccess('');
    try {
      const res = await api.post<{ data: TransportDispatch }>('/api/long-distance/transport/book', {
        requestedBy: name || 'Savita Patil',
        role: 'patient',
        pickupLocation: { village: 'Kelwa Gaon', facilityName: 'Sub-Centre Kelwa' },
        dropoffLocation: { facilityName: 'Rural Hospital Khed / District Hospital Palghar' }
      });
      if (res?.data) {
        setDispatches(prev => [res.data, ...prev]);
        setBookingSuccess(
          currentLang === 'mr'
            ? `१०८ रुग्णवाहिका रवाना झाली! वाहन क्र.: ${res.data.vehicleNumber}. चालकाचा संपर्क: ${res.data.driverPhone}`
            : currentLang === 'hi'
            ? `108 एम्बुलेंस रवाना हुई! वाहन संख्या: ${res.data.vehicleNumber}. चालक संपर्क: ${res.data.driverPhone}`
            : `108 Ambulance Dispatched! Vehicle: ${res.data.vehicleNumber}. Driver Phone: ${res.data.driverPhone}`
        );
        speak(
          currentLang === 'mr'
            ? '१०८ रुग्णवाहिका रवाना झाली आहे. विनामूल्य शासकीय वाहतूक सुरू आहे.'
            : '108 Ambulance has been dispatched. Government transport is on the way.',
          currentLang
        );
      }
    } catch {
      // error handled
    } finally {
      setBookingTransit(false);
    }
  }

  const titles = {
    en: {
      heading: 'Rural Long-Distance Healthcare Solutions',
      sub: 'Overcoming geographic barriers via 108 transit, Hub-and-Spoke diagnostic couriers, and Mobile Medical Units',
      tab1: '🚑 Emergency & Maternity Transit (108/JSSK)',
      tab2: '🧪 Hub-and-Spoke Lab Sample Pickup (Rwanda Model)',
      tab3: '🚐 Mobile Medical Unit (MMU) Village Camps',
      bookBtn: 'Request 108 Emergency / Maternity Transport',
      freeGov: '100% Free under Janani Shishu Suraksha Karyakram (JSSK) & MH 108',
      waypointTitle: 'Intermediate Stabilization Waypoint',
      telemetry: 'Live Vehicle Telemetry & En-Route Oxygen',
      sampleTitle: 'Sub-Centre Sample Courier & Digital Reports',
      sampleSub: 'Blood/urine samples are collected at village Sub-Centres and delivered to District Hospital Lab. Digital reports sync directly to ABHA ID in < 6 hours.'
    },
    hi: {
      heading: 'ग्रामीण दूरस्थ स्वास्थ्य एवं परिवहन समाधान',
      sub: '108 आपातकालीन एम्बुलेंस, हब-एंड-स्पोक डायग्नोस्टिक कूरियर और मोबाइल मेडिकल यूनिट्स',
      tab1: '🚑 आपातकालीन एवं मातृ परिवहन (108/JSSK)',
      tab2: '🧪 हब-एंड-स्पोक लैब सैंपल पिकअप (रवांडा मॉडल)',
      tab3: '🚐 मोबाइल मेडिकल यूनिट (MMU) गांव शिविर',
      bookBtn: '108 आपातकालीन / प्रसूति वाहन का अनुरोध करें',
      freeGov: 'जननी शिशु सुरक्षा कार्यक्रम (JSSK) के तहत पूर्णतः निःशुल्क',
      waypointTitle: 'मध्यवर्ती प्राथमिक स्वास्थ्य केंद्र (स्थिरीकरण)',
      telemetry: 'लाइव जीपीएस एवं मार्ग में ऑक्सीजन व्यवस्था',
      sampleTitle: 'उप-केंद्र सैंपल पिकअप एवं डिजिटल रिपोर्ट',
      sampleSub: 'रक्त व मूत्र जांच के नमूने उप-केंद्र में लिए जाते हैं और जिला अस्पताल लैब भेजे जाते हैं। रिपोर्ट 6 घंटे में आभा आईडी पर उपलब्ध होती है।'
    },
    mr: {
      heading: 'ग्रामीण दुर्गम आरोग्य व जलद वाहतूक समन्वय',
      sub: '१०८ रुग्णवाहिका, हब-अँड-स्पोक लॅब नमुना संकलन आणि फिरते वैद्यकीय पथक (MMU)',
      tab1: '🚑 १०८ रुग्णवाहिका व प्रसूती वाहतूक (JSSK)',
      tab2: '🧪 हब-अँड-स्पोक लॅब नमुना संकलन (रवांडा मॉडेल)',
      tab3: '🚐 फिरते वैद्यकीय पथक (MMU) गाव शिबिरे',
      bookBtn: '१०८ रुग्णवाहिका / मोफत शासकीय वाहतूक बोलवा',
      freeGov: 'जननी शिशु सुरक्षा कार्यक्रम (JSSK) अंतर्गत १००% मोफत शासकीय सेवा',
      waypointTitle: 'मध्यवर्ती प्राथमिक आरोग्य केंद्र (स्थिरीकरण पॉईंट)',
      telemetry: 'थेट जीपीएस ट्रॅकिंग व प्रवासात ऑक्सिजन सुविधा',
      sampleTitle: 'उप-केंद्र नमुना संकलन व थेट डिजिटल रिपोर्ट',
      sampleSub: 'रुग्णाला ४० किमी लांब जाण्याची गरज नाही; उप-केंद्रात घेतलेले नमुने जिल्हा रुग्णालयाच्या केंद्रीय लॅबमध्ये पाठवून ६ तासांत डिजिटल रिपोर्ट मिळतो.'
    }
  };

  const t = titles[currentLang as 'en' | 'hi' | 'mr'] || titles.en;

  return (
    <section className="long-distance-coordinator" style={{ background: 'var(--col-surface)', border: '1.5px solid var(--col-border)', borderRadius: 6, overflow: 'hidden' }}>
      {/* Header Banner */}
      <div style={{ background: 'var(--col-teal-dark)', color: '#e8f4f3', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" width="24" height="24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', color: '#ffffff' }}>{t.heading}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>{t.sub}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--col-border)', background: 'var(--col-paper)' }}>
        <button
          onClick={() => setActiveTab('transport')}
          style={{
            flex: 1, padding: '12px 14px', border: 'none', background: activeTab === 'transport' ? 'var(--col-surface)' : 'transparent',
            fontWeight: activeTab === 'transport' ? 700 : 500,
            borderBottom: activeTab === 'transport' ? '3px solid var(--col-teal)' : 'none',
            cursor: 'pointer', fontSize: '0.875rem'
          }}
        >
          {t.tab1}
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          style={{
            flex: 1, padding: '12px 14px', border: 'none', background: activeTab === 'samples' ? 'var(--col-surface)' : 'transparent',
            fontWeight: activeTab === 'samples' ? 700 : 500,
            borderBottom: activeTab === 'samples' ? '3px solid var(--col-teal)' : 'none',
            cursor: 'pointer', fontSize: '0.875rem'
          }}
        >
          {t.tab2}
        </button>
        <button
          onClick={() => setActiveTab('mmu')}
          style={{
            flex: 1, padding: '12px 14px', border: 'none', background: activeTab === 'mmu' ? 'var(--col-surface)' : 'transparent',
            fontWeight: activeTab === 'mmu' ? 700 : 500,
            borderBottom: activeTab === 'mmu' ? '3px solid var(--col-teal)' : 'none',
            cursor: 'pointer', fontSize: '0.875rem'
          }}
        >
          {t.tab3}
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Tab 1: Emergency & Maternity Transit */}
        {activeTab === 'transport' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <span className="badge badge-routine" style={{ fontSize: '0.75rem', marginRight: 8 }}>
                  ✓ {t.freeGov}
                </span>
              </div>
              <button onClick={bookEmergencyTransport} disabled={bookingTransit} className="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h1"/>
                  <circle cx="7.5" cy="17.5" r="2.5"/>
                  <circle cx="17.5" cy="17.5" r="2.5"/>
                </svg>
                {bookingTransit ? (currentLang === 'mr' ? 'वाहन बुक होत आहे…' : 'Booking…') : t.bookBtn}
              </button>
            </div>

            {bookingSuccess && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                ✓ {bookingSuccess}
              </div>
            )}

            {dispatches.length === 0 ? (
              <p className="text-muted">No active transport dispatches.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dispatches.map(d => (
                  <div key={d._id || d.bookingId} className="card" style={{ borderLeft: '4px solid var(--col-teal)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <span className="badge badge-emergency" style={{ marginRight: 8 }}>
                          {d.serviceType?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <strong>{d.vehicleNumber}</strong>
                        <span className="text-muted" style={{ marginLeft: 8 }}>· Booking: {d.bookingId}</span>
                      </div>
                      <span className="badge badge-routine">
                        ● {d.currentStatus?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid-2" style={{ gap: 14, marginTop: 12 }}>
                      <div>
                        <div className="form-label" style={{ fontSize: '0.75rem' }}>Pickup & Destination</div>
                        <div style={{ fontSize: '0.875rem' }}>
                          📍 <strong>{d.pickupLocation?.village || d.pickupLocation?.facilityName}</strong> → 🏥 <strong>{d.dropoffLocation?.facilityName}</strong>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)', marginTop: 4 }}>
                          Driver: <strong>{d.driverName}</strong> (📞 <a href={`tel:${d.driverPhone}`}>{d.driverPhone}</a>) {d.emtName && `· EMT: ${d.emtName}`}
                        </div>
                      </div>

                      {d.liveTelemetry && (
                        <div style={{ background: 'var(--col-paper)', padding: '10px 12px', borderRadius: 4, border: '1px solid var(--col-border)' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--col-teal-dark)', marginBottom: 4 }}>
                            📡 {t.telemetry}
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: '0.8125rem' }}>
                            <span>ETA: <strong>{d.liveTelemetry.etaMinutes} mins</strong></span>
                            <span>Remaining: <strong>{d.liveTelemetry.distanceRemainingKm} km</strong></span>
                            <span>Speed: <strong>{d.liveTelemetry.speedKmph} km/h</strong></span>
                          </div>
                          {d.liveTelemetry.oxygenSupplyAvailable && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--col-green)', marginTop: 4, fontWeight: 600 }}>
                              ✓ Onboard High-Flow Oxygen Active
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {d.intermediateWaypoint && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#eff6ff', borderRadius: 4, border: '1px solid var(--col-blue-border)', fontSize: '0.8125rem' }}>
                        <strong>📍 {t.waypointTitle}:</strong> {d.intermediateWaypoint.facilityName} ({d.intermediateWaypoint.reason})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Hub-and-Spoke Diagnostic Samples (Rwanda Model) */}
        {activeTab === 'samples' && (
          <div>
            <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 4, border: '1px solid var(--col-green-border)', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--col-green)', marginBottom: 4 }}>
                💡 Rwanda & China Hub-and-Spoke Diagnostics Network
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5 }}>
                {t.sampleSub}
              </p>
            </div>

            {samples.length === 0 ? (
              <p className="text-muted">No diagnostic samples in transit.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {samples.map(s => (
                  <div key={s._id || s.sampleBarcode} className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <strong>{s.patientName}</strong>
                        <span className="text-muted" style={{ marginLeft: 8 }}>· {s.sampleBarcode}</span>
                        <span className="text-muted" style={{ marginLeft: 8 }}>· {s.collectedAtFacilityName}</span>
                      </div>
                      <span className={`badge ${s.status === 'report_ready' ? 'badge-routine' : 'badge-urgent'}`}>
                        {s.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {s.testTypes?.map(test => (
                        <span key={test} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{test}</span>
                      ))}
                    </div>

                    {s.results && s.results.length > 0 && (
                      <div style={{ marginTop: 10, background: 'var(--col-paper)', padding: '8px 12px', borderRadius: 4, fontSize: '0.8125rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>🔬 Verified Laboratory Results (District Lab):</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {s.results.map(r => (
                            <span key={r.testName}>
                              {r.testName}: <strong style={{ color: r.isAbnormal ? 'var(--col-red)' : 'var(--col-ink)' }}>{r.value} {r.unit}</strong> (Norm: {r.normalRange})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Mobile Medical Unit (MMU) Camps */}
        {activeTab === 'mmu' && (
          <div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 14 }}>
              {currentLang === 'mr'
                ? 'जिल्हा आरोग्य पथकाची फिरती वैद्यकीय शिबिरे (MMU) — तज्ञ डॉक्टर, सोनोग्राफी, ईसीजी व मोफत औषधे आपल्या गावात:'
                : 'Upcoming Mobile Medical Unit (MMU) village camps providing free specialist doctor consultations, onboard ultrasound, and pharmacy:'}
            </p>

            {mmuCamps.length === 0 ? (
              <p className="text-muted">No scheduled MMU camps in this block.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {mmuCamps.map(c => (
                  <div key={c.campId} className="card" style={{ padding: '14px 16px', borderTop: '3px solid var(--col-teal)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--col-teal-dark)' }}>
                      📍 {c.village}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-light)', marginTop: 4 }}>
                      🗓 {new Date(c.scheduledDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {c.timings}
                    </div>
                    <div style={{ fontSize: '0.8125rem', marginTop: 8 }}>
                      👨‍⚕️ <strong>Doctors:</strong> {c.teamLeadDoctor}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginTop: 6 }}>
                      ⚙️ <strong>Equipment:</strong> {c.equipmentOnboard?.join(', ')}
                    </div>
                    <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--col-ink-light)' }}>
                      ASHA Contact: <strong>{c.ashaContact}</strong> (📞 {c.ashaPhone})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
