import React from 'react';
import type { TriageResult, UrgencyLevel, Lang } from '../../types';
import { speak } from '../../lib/voice';
import { useSession } from '../../store';

const URGENCY_BADGE: Record<UrgencyLevel, string> = {
  emergency: 'badge-emergency',
  urgent:    'badge-urgent',
  routine:   'badge-routine',
  elective:  'badge-neutral',
};

const URGENCY_LABEL: Record<UrgencyLevel, Record<Lang, string>> = {
  emergency: { en: 'Emergency', hi: 'आपातकालीन', mr: 'आणीबाणी', te: 'తక్షణ అత్యవసరం (Emergency)', kn: 'ತಕ್ಷಣದ ತುರ್ತು (Emergency)' },
  urgent:    { en: 'Urgent Evaluation', hi: 'तात्कालिक जांच', mr: 'तातडीची तपासणी', te: 'అత్యవసర మూల్యాంకనం (Urgent)', kn: 'ತುರ್ತು ಮೌಲ್ಯಮಾಪನ (Urgent)' },
  routine:   { en: 'Routine Care', hi: 'नियमित देखभाल', mr: 'नियमित काळजी', te: 'సాధారణ సంరక్షణ (Routine)', kn: 'ಸಾಮಾನ್ಯ ಆರೈಕೆ (Routine)' },
  elective:  { en: 'Elective / Wellness', hi: 'नियमित स्वास्थ्य', mr: 'नियमित आरोग्य', te: 'వెల్‌నెస్ సంరక్షణ', kn: 'ಕ್ಷೇಮ ಆರೈಕೆ' },
};

interface TriageNoteCardProps {
  result: TriageResult;
  patientName?: string;
  recordedAt?: string;
}

export const TriageNoteCard: React.FC<TriageNoteCardProps> = ({ result, patientName, recordedAt }) => {
  const { lang } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;
  const [, setVoiced] = React.useState(false);

  function handleVoice() {
    const textToSpeak = result.patientMessage
      ? result.patientMessage
      : `${result.clinicalReasoning}. ${result.homeCareAdvice ? result.homeCareAdvice : ''}`;
    speak(textToSpeak, currentLang);
    setVoiced(true);
  }

  const urgencyBorder = result.urgency === 'emergency' ? 'var(--col-red)'
    : result.urgency === 'urgent' ? 'var(--col-amber)' : 'var(--col-teal)';

  const headers: Record<Lang, { title: string; reasoning: string; dept: string; level: string; diag: string; advice: string; listen: string; diff: string; redFlags: string; patientMsg: string; ashaMsg: string; offlineNote: string }> = {
    en: { title: 'Clinical Analyse Assessment', reasoning: 'Clinical Reasoning & Pathophysiology', dept: 'Suggested Department', level: 'Care Facility Level', diag: 'Recommended Diagnostics', advice: 'Home & Supportive Care Advice', listen: 'Listen Advice', diff: 'Differential Diagnosis', redFlags: 'Red Flag Indicators Detected', patientMsg: 'Guidance for Beneficiary', ashaMsg: 'ASHA Field Checklist', offlineNote: 'Using offline support rules' },
    hi: { title: 'क्लिनिकल विश्लेषण मूल्यांकन', reasoning: 'नैदानिक मूल्यांकन (Clinical Reasoning)', dept: 'सुझाया गया विभाग', level: 'स्वास्थ्य केंद्र स्तर', diag: 'आवश्यक जांचें', advice: 'घरेलू देखभाल एवं परामर्श', listen: 'परामर्श सुनें', diff: 'संभावित नैदानिक स्थितियां (Differential Diagnosis)', redFlags: 'पहचाने गए खतरे के संकेत', patientMsg: 'लाभार्थी हेतु दिशा-निर्देश', ashaMsg: 'आशा फील्ड चेकलिस्ट', offlineNote: 'ऑफलाइन सहायता नियम उपयोग में हैं' },
    mr: { title: 'क्लिनिकल विश्लेषण निष्कर्ष', reasoning: 'वैद्यकीय मूल्यांकन (Clinical Reasoning)', dept: 'सुचवलेला विभाग', level: 'आरोग्य केंद्र स्तर', diag: 'आवश्यक तपासण्या', advice: 'घरगुती काळजी व सल्ला', listen: 'सल्ला ऐका', diff: 'संभाव्य आजार (Differential Diagnosis)', redFlags: 'धोक्याची लक्षणे', patientMsg: 'लाभार्थ्यांसाठी मार्गदर्शन', ashaMsg: 'आशा फील्ड चेकलिस्ट', offlineNote: 'ऑफलाइन सहायता नियम वापरले जात आहेत' },
    te: { title: 'క్లినికల్ విశ్లేషణ మూల్యాంకనం', reasoning: 'క్లినికల్ కారణం & అంచనా', dept: 'సూచించిన విభాగం', level: 'ఆసుపత్రి స్థాయి', diag: 'సిఫార్సు చేసిన పరీక్షలు', advice: 'ఇంటి వద్ద సంరక్షణ సలహా', listen: 'సలహా వినండి', diff: 'అనుమానిత పరిస్థితులు (Differential)', redFlags: 'ప్రమాద సంకేతాలు గుర్తించబడ్డాయి', patientMsg: 'లబ్ధిదారునికి సూచనలు', ashaMsg: 'ఆశా కార్యకర్త చెక్‌లిస్ట్', offlineNote: 'ఆఫ్‌లైన్ నియమాలు అమలులో ఉన్నాయి' },
    kn: { title: 'ಕ್ಲಿನಿಕಲ್ ವಿಶ್ಲೇಷಣೆ ಮೌಲ್ಯಮಾಪನ', reasoning: 'ಕ್ಲಿನಿಕಲ್ ಕಾರಣ ಮತ್ತು ಮೌಲ್ಯಮಾಪನ', dept: 'ಸೂಚಿಸಲಾದ ವಿಭಾಗ', level: 'ಆಸ್ಪತ್ರೆಯ ಹಂತ', diag: 'ಶಿಫಾರಸು ಮಾಡಿದ ಪರೀಕ್ಷೆಗಳು', advice: 'ಮನೆಯ ಆರೈಕೆ ಸಲಹೆ', listen: 'ಸಲಹೆ ಆಲಿಸಿ', diff: 'ಸಂಭಾವ್ಯ ರೋಗನಿರ್ಣಯ', redFlags: 'ಅಪಾಯದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ', patientMsg: 'ಫಲಾನುಭವಿಗೆ ಮಾರ್ಗದರ್ಶನ', ashaMsg: 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆಯ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ', offlineNote: 'ಆಫ್‌ಲೈನ್ ನಿಯಮಗಳು ಚಾಲನೆಯಲ್ಲಿವೆ' }
  };
  const h = headers[currentLang];

  return (
    <div className="card" style={{ borderLeft: `5px solid ${urgencyBorder}`, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
      <div className="card-header" style={{ justifyContent: 'space-between', background: 'var(--col-paper)', borderBottom: '1px solid var(--col-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className={`badge ${URGENCY_BADGE[result.urgency]}`} style={{ fontSize: '0.8125rem', padding: '4px 12px', fontWeight: 700 }}>
            {result.urgencyLabel || URGENCY_LABEL[result.urgency]?.[currentLang]}
          </span>
          {result.urgencyScore !== undefined && (
            <span style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)', background: '#ffffff', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--col-border)' }}>
              Severity Index: <strong>{result.urgencyScore}/100</strong>
            </span>
          )}
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--col-teal-dark)' }}>
            {h.title}
            {patientName && <span className="text-muted" style={{ fontWeight: 400 }}> — {patientName}</span>}
          </h3>
        </div>
        <button onClick={handleVoice} className="voice-btn" style={{ fontSize: '0.8125rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          {h.listen}
        </button>
      </div>

      <div className="card-body">
        {/* Red Flags Alert if detected */}
        {result.redFlagsDetected && result.redFlagsDetected.length > 0 && (
          <div style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 4,
            background: 'var(--col-red-bg)',
            border: '1px solid var(--col-red-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--col-red)" strokeWidth="2" width="20" height="20" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--col-red)' }}>
                {h.redFlags}:
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--col-red)' }}>
                {result.redFlagsDetected.join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* Clinical reasoning */}
        <div style={{ marginBottom: 16 }}>
          <div className="form-label" style={{ marginBottom: 6 }}>{h.reasoning}</div>
          <p style={{ lineHeight: 1.7, color: 'var(--col-ink)', fontSize: '0.9375rem', margin: 0 }}>
            {result.clinicalReasoning}
          </p>
        </div>

        {/* Beneficiary message */}
        {result.patientMessage && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 6,
            background: result.urgency === 'emergency' ? 'var(--col-red-bg)'
              : result.urgency === 'urgent' ? 'var(--col-amber-bg)' : '#f0fdf4',
            border: `1.5px solid ${result.urgency === 'emergency' ? 'var(--col-red-border)'
              : result.urgency === 'urgent' ? 'var(--col-amber-border)' : 'var(--col-green-border)'}`,
            display: 'flex', alignItems: 'flex-start', gap: 10
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={result.urgency === 'emergency' ? 'var(--col-red)' : result.urgency === 'urgent' ? 'var(--col-amber)' : 'var(--col-green)'} strokeWidth="2" width="18" height="18" style={{ marginTop: 2, flexShrink: 0 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 4,
                color: result.urgency === 'emergency' ? 'var(--col-red)'
                  : result.urgency === 'urgent' ? 'var(--col-amber)' : 'var(--col-green)' }}>
                {h.patientMsg}
                {result.lnklingOffline && (
                  <span style={{ marginLeft: 8, fontWeight: 400, opacity: 0.7 }}>· {h.offlineNote}</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--col-ink)' }}>
                {result.patientMessage}
              </p>
            </div>
          </div>
        )}

        {/* Differential Diagnosis */}
        {result.differentialDiagnosis && result.differentialDiagnosis.length > 0 && (
          <div style={{ marginBottom: 16, background: '#f8fafc', padding: '10px 14px', borderRadius: 4, border: '1px solid var(--col-border)' }}>
            <div className="form-label" style={{ marginBottom: 6, fontSize: '0.75rem' }}>{h.diff}:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {result.differentialDiagnosis.map((item, idx) => (
                <span key={idx} style={{ background: '#ffffff', border: '1px solid var(--col-border)', padding: '4px 10px', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--col-ink)' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Home & Supportive Care Advice */}
        {result.homeCareAdvice && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 4,
            background: result.urgency === 'emergency' ? 'var(--col-red-bg)' : result.urgency === 'urgent' ? 'var(--col-amber-bg)' : '#f0fdf4',
            border: `1px solid ${result.urgency === 'emergency' ? 'var(--col-red-border)' : result.urgency === 'urgent' ? 'var(--col-amber-border)' : 'var(--col-green-border)'}`
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: 4, color: result.urgency === 'emergency' ? 'var(--col-red)' : result.urgency === 'urgent' ? 'var(--col-amber)' : 'var(--col-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {h.advice}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--col-ink-light)' }}>
              {result.homeCareAdvice}
            </p>
          </div>
        )}

        <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
          {/* Suggested facility */}
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>{h.dept}</div>
            <div style={{ fontWeight: 700, color: 'var(--col-teal-dark)' }}>{result.suggestedDept}</div>
          </div>
          {/* Facility level */}
          <div>
            <div className="form-label" style={{ marginBottom: 4 }}>{h.level}</div>
            <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>
              {result.suggestedFacilityLevel === 'sub_centre' ? (currentLang === 'mr' ? 'उप-केंद्र (Sub-Centre)' : currentLang === 'hi' ? 'उप-स्वास्थ्य केंद्र' : 'Sub-Centre') :
               result.suggestedFacilityLevel === 'phc' ? (currentLang === 'mr' ? 'प्राथमिक आरोग्य केंद्र (PHC)' : currentLang === 'hi' ? 'प्राथमिक स्वास्थ्य केंद्र (PHC)' : 'Primary Health Centre (PHC)') :
               result.suggestedFacilityLevel === 'rural_hospital' ? (currentLang === 'mr' ? 'ग्रामीण रुग्णालय (RH)' : currentLang === 'hi' ? 'ग्रामीण अस्पताल (RH)' : 'Rural Hospital') :
               (currentLang === 'mr' ? 'जिल्हा रुग्णालय (DH)' : currentLang === 'hi' ? 'जिला अस्पताल (DH)' : 'District Hospital')}
            </div>
          </div>
        </div>

        {/* ASHA field checklist */}
        {result.ashaMessage && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 6,
            background: '#fffbeb',
            border: '1.5px solid #fcd34d'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: 6, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              {h.ashaMsg}
            </div>
            <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.875rem',
              lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--col-ink)' }}>
              {result.ashaMessage}
            </pre>
          </div>
        )}

        {/* Diagnostics needed */}
        {result.diagnosticsNeeded && result.diagnosticsNeeded.length > 0 && (
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>{h.diag}</div>
            <div className="diag-grid">
              {result.diagnosticsNeeded.map(d => (
                <span key={d} className="diag-chip available">{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Protocol & confirmation */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid #f0ede8' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Protocol: {result.aiModel || 'Certified NHM Protocol'}</span>
          {result.confirmedByDoctor && (
            <span className="badge badge-routine" style={{ fontSize: '0.75rem' }}>
              ✓ Confirmed — {result.doctorName}
            </span>
          )}
          {result.disclaimer && (
            <span className="text-xs text-muted" style={{ flex: 1, minWidth: 200 }}>
              {result.disclaimer}
            </span>
          )}
          {recordedAt && (
            <span className="text-xs text-muted">
              {new Date(recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
