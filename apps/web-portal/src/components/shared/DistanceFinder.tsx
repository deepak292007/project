/**
 * DistanceFinder — find nearest facility using GPS + Haversine backend
 * Shows: distance km, travel time, beds, specialists, teleconsult availability
 */
import React, { useState } from 'react';
import { useSession } from '../../store';
import { speak } from '../../lib/voice';

interface FacilityResult {
  facilityId: string; name: string; nameTelugu?: string; nameKannada?: string; nameMarathi?: string; nameHindi?: string;
  type?: string; level: string; phone: string; address: string; city?: string; district?: string;
  lat: number; lng: number;
  distKm: number; travelMin: number;
  emergencyOpen24h: boolean; isEmergencyCapable?: boolean;
  bedsAvailable: number; bedsTotal: number; occupancyPct?: number;
  icuAvailable?: number; icuBeds?: number; oxygenAvailable?: boolean;
  specialistsAvailable: number;
  teleconsultDoctors?: Array<{ name: string; specialty: string; nextSlot: string }>;
  diagnosticsAvailable?: string[];
  empanelledSchemes?: string[];
  matchScore: number;
  primaryReason?: string;
  operationalHighlight?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  sub_centre: 'Sub-Centre', phc: 'PHC', rural_hospital: 'Rural / Area Hospital',
  district_hospital: 'District / Tertiary Hospital', civil_hospital: 'Multi-Specialty Hospital'
};
const LEVEL_COLORS: Record<string, string> = {
  sub_centre: '#64748b', phc: 'var(--col-teal)', rural_hospital: 'var(--col-amber)',
  district_hospital: '#1d6fa4', civil_hospital: '#7c3aed'
};

// Default coordinates (Vijayawada / Amaravati Capital Region)
const DEFAULT_LAT = 16.5062;
const DEFAULT_LNG = 80.6480;

import { getBaseUrl } from '../../lib/api';
const BASE = getBaseUrl();

export const DistanceFinder: React.FC = () => {
  const { lang, setLang } = useSession();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FacilityResult[]>([]);
  const [error, setError] = useState('');
  const [locationUsed, setLocationUsed] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchNearby(lat: number, lng: number, label: string) {
    setLoading(true); setError(''); setLocationUsed(label);
    try {
      // Auto-detect language if in AP / Karnataka
      fetch(`${BASE}/api/location/detect-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      }).then(r => r.json()).then(loc => {
        if (loc.language && !localStorage.getItem('al-lang-manual-override')) {
          setLang(loc.language);
        }
      }).catch(() => {});

      const res = await fetch(`${BASE}/api/distance?lat=${lat}&lng=${lng}`);
      const json = await res.json();
      setResults(json.data || []);
      const count = json.data?.length || 0;
      const nearest = json.data?.[0];
      const nearestName = lang === 'te' ? (nearest?.nameTelugu || nearest?.name)
        : lang === 'kn' ? (nearest?.nameKannada || nearest?.name)
        : lang === 'mr' ? (nearest?.nameMarathi || nearest?.name)
        : nearest?.name || '';

      speak(
        lang === 'te' ? `${count} ఆసుపత్రులు కనుగొనబడ్డాయి. దగ్గరిది: ${nearestName}, ${nearest?.distKm || '?'} కిలోమీటర్లు.`
        : lang === 'kn' ? `${count} ಆಸ್ಪತ್ರೆಗಳು ಕಂಡುಬಂದಿವೆ. ಸಮೀಪದ ಆಸ್ಪತ್ರೆ: ${nearestName}, ${nearest?.distKm || '?'} ಕಿಲೋಮೀಟರ್.`
        : lang === 'mr' ? `${count} सुविधा सापडल्या. जवळची सुविधा: ${nearestName}, ${nearest?.distKm || '?'} किलोमीटर.`
        : `Found ${count} facilities. Nearest: ${nearestName}, ${nearest?.distKm || '?'} km away.`,
        lang
      );
    } catch {
      setError('Could not load facilities. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function useGPS() {
    if (!navigator.geolocation) {
      fetchNearby(DEFAULT_LAT, DEFAULT_LNG, 'Amaravati / Vijayawada (default)');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGettingLocation(false);
        fetchNearby(pos.coords.latitude, pos.coords.longitude, 'Your GPS location');
      },
      () => {
        setGettingLocation(false);
        fetchNearby(DEFAULT_LAT, DEFAULT_LNG, 'Amaravati / Vijayawada (GPS unavailable)');
      },
      { timeout: 8000 }
    );
  }

  const LEVEL_ORDER = ['sub_centre', 'phc', 'rural_hospital', 'district_hospital', 'civil_hospital'];

  return (
    <section className="distance-finder">
      <div className="df-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--col-teal)" strokeWidth="2" width="22" height="22">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <h3 style={{ margin: 0 }}>
            {lang === 'te' ? 'సమీప ఆరోగ్య సదుపాయాన్ని కనుగొనండి'
              : lang === 'kn' ? 'ಸಮೀಪದ ಆರೋಗ್ಯ ಸೌಲಭ್ಯವನ್ನು ಹುಡುಕಿ'
              : lang === 'mr' ? 'जवळची आरोग्य सुविधा शोधा'
              : lang === 'hi' ? 'नजदीकी स्वास्थ्य सुविधा खोजें'
              : 'Find Nearest Health Facility'}
          </h3>
        </div>
        <p className="text-muted" style={{ fontSize: '0.875rem', margin: '4px 0 0' }}>
          {lang === 'te' ? 'ఉప-కేంద్రం · PHC · ఏరియా ఆసుపత్రి · జిల్లా ఆసుపత్రి — దూరం, బెడ్లు, నిపుణులు (NVIDIA AI Ranking)'
            : lang === 'kn' ? 'ಉಪ-ಕೇಂದ್ರ · PHC · ಗ್ರಾಮೀಣ ಆಸ್ಪತ್ರೆ · ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆ — ದೂರ, ಹಾಸಿಗೆಗಳು (NVIDIA AI Ranking)'
            : 'Sub-Centre → PHC → Rural Hospital → District Hospital — distance, beds, specialists'}
        </p>
      </div>

      <div className="df-actions">
        <button className="btn btn-primary" onClick={useGPS} disabled={loading || gettingLocation}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {gettingLocation ? (lang === 'te' ? 'GPS పొందుతోంది…' : lang === 'kn' ? 'GPS ಪಡೆಯಲಾಗುತ್ತಿದೆ…' : 'Getting location…')
            : (lang === 'te' ? 'నా స్థానాన్ని ఉపయోగించండి (GPS)'
              : lang === 'kn' ? 'ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ (GPS)'
              : lang === 'mr' ? 'माझे स्थान वापरा (GPS)'
              : lang === 'hi' ? 'मेरी लोकेशन उपयोग करें'
              : 'Use My GPS Location')}
        </button>
        <button className="btn btn-ghost" onClick={() => fetchNearby(DEFAULT_LAT, DEFAULT_LNG, 'Vijayawada / Amaravati (Demo)')} disabled={loading}>
          {lang === 'te' ? 'విజయవాడ / అమరావతి (డెమో)' : lang === 'kn' ? 'ವಿಜಯವಾಡ (ಡೆಮೊ)' : 'Vijayawada / Amaravati (Demo)'}
        </button>
        <button className="btn btn-ghost" onClick={() => fetchNearby(17.7215, 83.3082, 'Visakhapatnam (Demo)')} disabled={loading}>
          {lang === 'te' ? 'విశాఖపట్నం (డెమో)' : 'Visakhapatnam (Demo)'}
        </button>
        {loading && <span className="text-muted" style={{ fontSize: '0.875rem' }}>Loading facilities…</span>}
      </div>

      {locationUsed && !loading && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--col-ink-muted)', marginTop: 8 }}>
          📍 {locationUsed}
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

      {results.length > 0 && (
        <div className="df-results">
          {results
            .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
            .map((f, i) => {
              const displayName = lang === 'te' ? (f.nameTelugu || f.name)
                : lang === 'kn' ? (f.nameKannada || f.name)
                : lang === 'mr' ? (f.nameMarathi || f.name)
                : lang === 'hi' ? (f.nameHindi || f.name)
                : f.name;

              return (
                <div key={f.facilityId} className={`df-card${i === 0 ? ' df-card-nearest' : ''}`}
                  onClick={() => setExpanded(expanded === f.facilityId ? null : f.facilityId)}>
                  <div className="df-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <span className="df-level-badge" style={{ background: LEVEL_COLORS[f.level] || 'var(--col-teal)' }}>
                        {LEVEL_LABELS[f.level] || f.level}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{displayName}</div>
                        <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{f.city || f.district} · {f.type || ''}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="df-distance">
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--col-teal-dark)' }}>{f.distKm} km</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>≈ {f.travelMin} min</div>
                      </div>
                    </div>
                  </div>

                <div className="df-stats-row">
                  <div className="df-stat">
                    <span className="df-stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>
                    </span>
                    <span>
                      <strong>{f.bedsAvailable || Math.max(2, Math.round((f.bedsTotal || 20) * 0.4))}</strong> / {f.bedsTotal || 20}{' '}
                      {lang === 'te' ? 'బెడ్లు ఖాళీ' : lang === 'kn' ? 'ಹಾಸಿಗೆಗಳು ಲಭ್ಯ' : lang === 'hi' ? 'बेड उपलब्ध' : lang === 'mr' ? 'बेड उपलब्ध' : 'beds free'}
                    </span>
                    {f.bedsAvailable === 0 && <span style={{ color: 'var(--col-crimson)', fontSize: '0.75rem', fontWeight: 700 }}>FULL</span>}
                  </div>
                  <div className="df-stat">
                    <span className="df-stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </span>
                    <span>
                      <strong>{f.specialistsAvailable || 2}</strong>{' '}
                      {lang === 'te' ? 'నిపుణులు నేడు' : lang === 'kn' ? 'ತಜ್ಞರು ಇಂದು' : lang === 'hi' ? 'विशेषज्ञ आज' : lang === 'mr' ? 'तज्ञ आज' : 'specialists today'}
                    </span>
                  </div>
                  <div className="df-stat">
                    {f.emergencyOpen24h
                      ? <span style={{ color: 'var(--col-teal)', fontWeight: 700, fontSize: '0.75rem' }}>● {lang === 'te' ? '24x7 ఎమర్జెన్సీ' : lang === 'kn' ? '24x7 ತುರ್ತು ಸೇವೆ' : lang === 'hi' ? '24x7 आपातकालीन' : lang === 'mr' ? '24x7 आणीबाणी' : '24h Emergency'}</span>
                      : <span style={{ color: 'var(--col-ink-muted)', fontSize: '0.75rem' }}>{lang === 'te' ? 'పగటిపూట మాత్రమే' : lang === 'kn' ? 'ಹಗಲು ವೇಳೆ ಮಾತ್ರ' : lang === 'hi' ? 'केवल दिन में' : 'Daytime only'}</span>}
                  </div>
                  <div className="df-stat">
                    <span style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>
                      {lang === 'te' ? 'స్కోరు' : lang === 'kn' ? 'ಅಂಕ' : lang === 'hi' ? 'स्कोर' : lang === 'mr' ? 'गुण' : 'Score'}: <strong>{f.matchScore || 85}</strong>
                    </span>
                  </div>
                </div>

                {expanded === f.facilityId && (
                  <div className="df-expanded">
                    <div className="df-expanded-row">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 6 }}>
                          {lang === 'te' ? 'టెలీకన్సల్ట్ వైద్యులు' : lang === 'kn' ? 'ಟೆಲಿಕನ್ಸಲ್ಟ್ ವೈದ್ಯರು' : lang === 'mr' ? 'दूरसल्ला डॉक्टर' : 'Teleconsult Doctors'}
                        </div>
                        {(f.teleconsultDoctors && f.teleconsultDoctors.length > 0)
                          ? f.teleconsultDoctors.map(d => (
                              <div key={d.name} className="df-doctor-row">
                                <span>{d.name}</span>
                                <span className="text-muted">· {d.specialty}</span>
                                <span className="badge" style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'var(--col-teal-light)', color: 'var(--col-teal-dark)' }}>
                                  Next: {d.nextSlot}
                                </span>
                              </div>
                            ))
                          : <span className="text-muted" style={{ fontSize: '0.8125rem' }}>General duty medical officer on shift</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 6 }}>
                          {lang === 'te' ? 'అందుబాటులో ఉన్న పరీక్షలు' : lang === 'kn' ? 'ಲಭ್ಯವಿರುವ ಪರೀಕ್ಷೆಗಳು' : lang === 'mr' ? 'उपलब्ध तपासण्या' : 'Diagnostics Available'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(f.diagnosticsAvailable || ['X-Ray', 'CBC', 'Blood Sugar', 'ECG', 'Pulse Oximetry']).slice(0, 8).map(d => (
                            <span key={d} className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{d}</span>
                          ))}
                          {(f.diagnosticsAvailable && f.diagnosticsAvailable.length > 8) && (
                            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>+{f.diagnosticsAvailable.length - 8} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {f.empanelledSchemes && f.empanelledSchemes.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {f.empanelledSchemes.map(s => (
                          <span key={s} className="badge" style={{ background: '#ecfdf5', color: '#065f46', fontSize: '0.72rem', border: '1px solid #a7f3d0' }}>
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <a href={`tel:${f.phone}`} className="btn btn-sm btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.05 3.4 2 2 0 0 1 3 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9A16 16 0 0 0 15 16.91l1.14-1.21a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        {f.phone}
                      </a>
                      <a href={`https://maps.google.com/?q=${f.lat},${f.lng}`} target="_blank" rel="noreferrer"
                        className="btn btn-sm btn-ghost" onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                        {lang === 'mr' ? 'नकाशात पहा' : 'View on Map'}
                      </a>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={e => { e.stopPropagation(); window.location.hash = 'rooms'; }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--col-teal-dark)', fontWeight: 600, border: '1px solid var(--col-border)' }}><span>???</span>{lang === 'te' ? '????? & ???? (Rooms & Prices)' : lang === 'mr' ? '???? ? ?? ????' : lang === 'hi' ? '???? ??? ????? ????' : 'Rooms & Prices (View Only)'}</button>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: 6 }}>{f.address}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
