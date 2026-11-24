/**
 * GrievancePortal — Citizen Health Vigilance & Quality Feedback
 * Allows patients to lodge complaints (e.g. Doctor absent on duty despite app showing present,
 * free medicines denied, emergency admission refused, ambulance delays).
 */
import React, { useState, useEffect } from 'react';
import { useSession } from '../../store';
import { speak } from '../../lib/voice';
import * as api from '../../lib/api';

interface GrievanceItem {
  _id?: string;
  grievanceId: string;
  facilityName: string;
  complaintType: string;
  targetDoctorOrStaff?: string;
  comment: string;
  rating: number;
  status: 'lodged' | 'under_inquiry' | 'action_taken' | 'resolved';
  actionTakenNotes?: string;
  submittedAt: string;
}

export const GrievancePortal: React.FC = () => {
  const { lang, name } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as 'en' | 'hi' | 'mr' | 'te' | 'kn';

  const [complaintType, setComplaintType] = useState('doctor_absent_on_duty');
  const [facilityId, setFacilityId] = useState('PHC-KELWA-01');
  const [targetDoctor, setTargetDoctor] = useState('Dr. Suresh Naik');
  const [rating, setRating] = useState(2);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [grievanceList, setGrievanceList] = useState<GrievanceItem[]>([]);

  useEffect(() => {
    loadGrievances();
  }, []);

  async function loadGrievances() {
    try {
      const res = await api.get<GrievanceItem[]>('/api/feedback');
      if (Array.isArray(res)) setGrievanceList(res);
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment) return;
    setSubmitting(true);
    setFeedbackSuccess('');
    try {
      const res = await api.post<{ ok: boolean; message: string; data: GrievanceItem }>('/api/feedback', {
        patientName: isAnonymous ? 'Anonymous Citizen' : name,
        facilityId,
        facilityName: facilityId === 'PHC-KELWA-01' ? 'PHC Kelwa' : facilityId === 'RH-KHED-01' ? 'Rural Hospital Khed' : 'District Hospital Palghar',
        category: 'Grievance',
        complaintType,
        targetDoctorOrStaff: targetDoctor,
        rating,
        comment,
        anonymous: isAnonymous,
        lang: currentLang
      });

      if (res?.ok) {
        setFeedbackSuccess(
          currentLang === 'mr'
            ? 'तक्रार यशस्वीरीत्या नोंदवली. वैद्यकीय अधिकाऱ्यांची उपस्थिती सूची दुरुस्त केली असून जिल्हा आरोग्य अधिकाऱ्यांकडे (DHO) चौकशीसाठी पाठवली आहे.'
            : currentLang === 'hi'
            ? 'शिकायत सफलतापूर्वक दर्ज हुई। डॉक्टर की उपस्थिति सूची संशोधित कर दी गई है और DHO को जांच हेतु भेजी गई है।'
            : 'Grievance registered. Duty roster has been automatically corrected and forwarded to DHO for inquiry.'
        );
        speak(
          currentLang === 'mr'
            ? 'आपली तक्रार नोंदवली आहे. शासकीय कारवाई सुरू झाली आहे.'
            : 'Your grievance has been recorded for administrative action.',
          currentLang
        );
        setComment('');
        loadGrievances();
      }
    } catch {
      // error handling
    } finally {
      setSubmitting(false);
    }
  }

  const TEXT = {
    en: {
      title: 'Citizen Grievance & Service Quality Vigilance',
      subtitle: 'Government of Maharashtra Public Health Vigilance & CM Helpline Integration',
      formTitle: 'Lodge a Complaint or Quality Feedback',
      typeLabel: 'Nature of Complaint',
      facilityLabel: 'Health Facility',
      targetDoctorLabel: 'Doctor or Staff Name (if absent / involved)',
      commentLabel: 'Detailed Description of Issue',
      commentPlaceholder: 'e.g. App showed doctor available at OPD at 10:30 AM, but doctor was absent. Medicine counter asked to purchase paracetamol from private pharmacy…',
      ratingLabel: 'Overall Service Rating',
      anonLabel: 'Lodge as Anonymous Citizen (protect identity)',
      submitBtn: 'Submit Grievance to Health Department',
      submitting: 'Registering Grievance…',
      historyTitle: 'Recent Grievances & Action Taken Reports',
      types: {
        doctor_absent_on_duty: '👨‍⚕️ Doctor / Staff Absent (App showed present, but absent in hospital)',
        emergency_service_denied: '🚨 Emergency / Maternity Admission Refused',
        free_medicine_unavailable: '💊 Free Government Medicines Denied / Out-of-Pocket Payment Demanded',
        ambulance_delayed_or_denied: '🚑 108 Ambulance Delayed > 45 mins',
        staff_misbehavior_or_bribe: '⚠️ Staff Misbehavior or Demanding Bribe',
        unhygienic_ward_facilities: '🧹 Unhygienic Ward or Washroom Facilities',
        other: '📝 Other Service Quality Feedback'
      }
    },
    hi: {
      title: 'नागरिक शिकायत एवं स्वास्थ्य सेवा गुणवत्ता निगरानी',
      subtitle: 'महाराष्ट्र शासन जन स्वास्थ्य सतर्कता एवं सीएम हेल्पलाइन समन्वय',
      formTitle: 'शिकायत या सेवा प्रतिक्रिया दर्ज करें',
      typeLabel: 'शिकायत का प्रकार',
      facilityLabel: 'स्वास्थ्य केंद्र / अस्पताल',
      targetDoctorLabel: 'डॉक्टर या कर्मचारी का नाम (यदि अनुपस्थित हों)',
      commentLabel: 'समस्या का विस्तृत विवरण',
      commentPlaceholder: 'उदा. ऐप में डॉक्टर 10:30 बजे उपस्थित दिख रहे थे, लेकिन अस्पताल में अनुपस्थित थे। दवा काउंटर पर बाहर से दवा खरीदने को कहा गया…',
      ratingLabel: 'सेवा मूल्यांकन (रेटिंग)',
      anonLabel: 'गोपनीय / अनाम नागरिक के रूप में दर्ज करें',
      submitBtn: 'स्वास्थ्य विभाग को शिकायत भेजें',
      submitting: 'शिकायत दर्ज हो रही है…',
      historyTitle: 'हाल की शिकायतें एवं की गई कार्रवाई रिपोर्ट',
      types: {
        doctor_absent_on_duty: '👨‍⚕️ डॉक्टर ड्युटी पर अनुपस्थित (ऐप में उपस्थित दिख रहे थे, पर अस्पताल में नहीं थे)',
        emergency_service_denied: '🚨 आपातकालीन / प्रसूति उपचार देने से इनकार',
        free_medicine_unavailable: '💊 मुफ्त सरकारी दवा न मिलना / बाहर से खरीदने को कहना',
        ambulance_delayed_or_denied: '🚑 108 एम्बुलेंस 45 मिनट से अधिक देरी से आई',
        staff_misbehavior_or_bribe: '⚠️ कर्मचारियों का अनुचित व्यवहार या रिश्वत मांगना',
        unhygienic_ward_facilities: '🧹 वार्ड या शौचालय में अस्वच्छता',
        other: '📝 अन्य सेवा गुणवत्ता प्रतिक्रिया'
      }
    },
    mr: {
      title: 'नागरिक तक्रार निवारण व आरोग्य सेवा दक्षता मंच',
      subtitle: 'महाराष्ट्र शासन सार्वजनिक आरोग्य दक्षता व थेट जिल्हा शल्यचिकित्सक समन्वय',
      formTitle: 'तक्रार किंवा गुणवत्ता अभिप्राय नोंदवा',
      typeLabel: 'तक्रारीचे स्वरूप',
      facilityLabel: 'आरोग्य संस्था / रुग्णालय',
      targetDoctorLabel: 'संबंधित डॉक्टर किंवा कर्मचाऱ्याचे नाव (गैरहजर असल्यास)',
      commentLabel: 'तक्रारीचा सविस्तर तपशील',
      commentPlaceholder: 'उदा. ॲपमध्ये डॉक्टर १०:३० वाजता हजर दाखवत होते, पण ओपीडीत गैरहजर होते. औषध विभागाने मोफत औषध संपल्याचे सांगून बाहेरून आणण्यास सांगितले…',
      ratingLabel: 'सेवा समाधान स्तर (रेटिंग)',
      anonLabel: 'गोपनीय / नाव न दाखवता तक्रार नोंदवा',
      submitBtn: 'आरोग्य विभागाकडे तक्रार दाखल करा',
      submitting: 'तक्रार दाखल होत आहे…',
      historyTitle: 'दाखल तक्रारी व प्रशासनाने केलेली कारवाई',
      types: {
        doctor_absent_on_duty: '👨‍⚕️ ड्युटीवर डॉक्टर गैरहजर (ॲपमध्ये हजर दाखवत होते, पण रुग्णालयात गैरहजर)',
        emergency_service_denied: '🚨 आणीबाणी / प्रसूती उपचार नाकारणे',
        free_medicine_unavailable: '💊 मोफत शासकीय औषधे न देणे / बाहेरून विकत घेण्यास सांगणे',
        ambulance_delayed_or_denied: '🚑 १०८ रुग्णवाहिका ४५ मिनिटांपेक्षा उशिरा येणे',
        staff_misbehavior_or_bribe: '⚠️ कर्मचाऱ्यांचे गैरवर्तन किंवा पैशांची मागणी',
        unhygienic_ward_facilities: '🧹 वॉर्ड व स्वच्छतागृहात अस्वच्छता',
        other: '📝 इतर सेवा गुणवत्ता अभिप्राय'
      }
    }
  };

  const t = TEXT[currentLang as 'en' | 'hi' | 'mr'] || TEXT.en;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <div style={{ background: 'var(--col-teal-dark)', color: '#ffffff', padding: '16px 20px', borderRadius: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" width="24" height="24">
            <path d="M12 3v18"/>
            <rect x="2" y="6" width="20" height="2"/>
            <path d="M5 8l-3 7a3 3 0 0 0 6 0L5 8z"/>
            <path d="M19 8l-3 7a3 3 0 0 0 6 0L19 8z"/>
          </svg>
          <div>
            <h3 style={{ margin: 0, color: '#ffffff' }}>{t.title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Grievance Form */}
      <div className="card">
        <div className="card-header"><h3 style={{ margin: 0 }}>{t.formTitle}</h3></div>
        <div className="card-body">
          {feedbackSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              ✓ {feedbackSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">{t.typeLabel}</label>
              <select
                className="form-control"
                value={complaintType}
                onChange={e => setComplaintType(e.target.value)}
              >
                {Object.entries(t.types || {}).map(([key, label]) => (
                  <option key={key} value={key}>{String(label)}</option>
                ))}
              </select>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
              <div>
                <label className="form-label">{t.facilityLabel}</label>
                <select className="form-control" value={facilityId} onChange={e => setFacilityId(e.target.value)}>
                  <option value="PHC-KELWA-01">PHC Kelwa (प्राथमिक आरोग्य केंद्र केळवा)</option>
                  <option value="SC-KELWA-01">Sub-Centre Kelwa (उप-केंद्र केळवा)</option>
                  <option value="RH-KHED-01">Rural Hospital Khed (ग्रामीण रुग्णालय खेड)</option>
                  <option value="DH-PALGHAR-01">District Hospital Palghar (जिल्हा रुग्णालय पालघर)</option>
                </select>
              </div>
              <div>
                <label className="form-label">{t.targetDoctorLabel}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Suresh Naik / Staff"
                  value={targetDoctor}
                  onChange={e => setTargetDoctor(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">{t.commentLabel}</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={t.commentPlaceholder}
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
                <span>{t.anonLabel}</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                <span>{t.ratingLabel}:</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontSize: '1.25rem', color: star <= rating ? '#f59e0b' : '#cbd5e1'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={submitting || !comment} className="btn btn-primary">
              {submitting ? t.submitting : t.submitBtn}
            </button>
          </form>
        </div>
      </div>

      {/* History / Transparency Log */}
      <div className="card">
        <div className="card-header"><h3 style={{ margin: 0 }}>{t.historyTitle}</h3></div>
        <div className="card-body">
          {grievanceList.length === 0 ? (
            <p className="text-muted">No grievances logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grievanceList.map(g => (
                <div key={g._id || g.grievanceId} className="card" style={{ padding: '12px 16px', background: 'var(--col-paper)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <span className="badge badge-emergency" style={{ fontSize: '0.6875rem', marginRight: 6 }}>
                        {g.grievanceId}
                      </span>
                      <strong>{g.facilityName}</strong>
                      {g.targetDoctorOrStaff && (
                        <span className="text-muted" style={{ marginLeft: 6 }}>· Staff: {g.targetDoctorOrStaff}</span>
                      )}
                    </div>
                    <span className={`badge ${g.status === 'action_taken' ? 'badge-urgent' : g.status === 'resolved' ? 'badge-routine' : 'badge-neutral'}`}>
                      ● {g.status?.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>

                  <p style={{ margin: '8px 0 4px', fontSize: '0.875rem', color: 'var(--col-ink)' }}>
                    "{g.comment}"
                  </p>

                  {g.actionTakenNotes && (
                    <div style={{ marginTop: 6, padding: '6px 10px', background: '#f0fdf4', borderRadius: 4, border: '1px solid var(--col-green-border)', fontSize: '0.8125rem', color: 'var(--col-green)' }}>
                      <strong>⚖️ Action Taken by DHO:</strong> {g.actionTakenNotes}
                    </div>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', marginTop: 6 }}>
                    Submitted: {new Date(g.submittedAt).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
