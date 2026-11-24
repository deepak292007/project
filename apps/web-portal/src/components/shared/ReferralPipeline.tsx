import React from 'react';
import type { Referral, ReferralStage } from '../../types';

const STAGES: { id: ReferralStage; labelEn: string; labelMr: string }[] = [
  { id: 'initiated',          labelEn: 'Initiated',       labelMr: 'सुरुवात' },
  { id: 'accepted',           labelEn: 'Accepted',        labelMr: 'स्वीकारले' },
  { id: 'transport_arranged', labelEn: 'Transport',       labelMr: 'वाहतूक' },
  { id: 'patient_en_route',   labelEn: 'En Route',        labelMr: 'मार्गावर' },
  { id: 'arrived',            labelEn: 'Arrived',         labelMr: 'पोहोचले' },
  { id: 'under_treatment',    labelEn: 'Treatment',       labelMr: 'उपचार' },
  { id: 'discharged',         labelEn: 'Discharged',      labelMr: 'डिस्चार्ज' },
  { id: 'follow_up_due',      labelEn: 'Follow-up',       labelMr: 'पाठपुरावा' },
];

interface ReferralPipelineProps {
  referral: Referral;
  lang?: 'en' | 'mr' | 'hi';
}

export const ReferralPipeline: React.FC<ReferralPipelineProps> = ({ referral, lang = 'en' }) => {
  const currentIdx = STAGES.findIndex(s => s.id === referral.currentStage);

  return (
    <div>
      <div className="pipeline">
        {STAGES.map((s, i) => {
          const isDone   = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <div key={s.id} className={`pipeline-step${isDone ? ' done' : ''}${isActive ? ' active' : ''}`}>
              <div className="pipeline-dot">
                {isDone && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {isActive && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--col-teal)' }} />
                )}
              </div>
              <div className="pipeline-label">
                {lang === 'mr' ? s.labelMr : s.labelEn}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage history */}
      {referral.stageHistory?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="form-label" style={{ marginBottom: 8 }}>Stage History</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Updated By</th>
                <th>Role</th>
                <th>Timestamp</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {referral.stageHistory.map((h, i) => (
                <tr key={i}>
                  <td><span className="badge badge-info">{h.stage.replace(/_/g, ' ')}</span></td>
                  <td>{h.updatedBy}</td>
                  <td><span className="text-sm text-muted">{h.role}</span></td>
                  <td className="text-sm">{h.timestamp ? new Date(h.timestamp).toLocaleString('en-IN') : '—'}</td>
                  <td className="text-sm text-muted">{h.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface ReferralSummaryCardProps {
  referral: Referral;
  onAdvance?: (stage: ReferralStage) => void;
  canAdvance?: boolean;
  lang?: 'en' | 'mr' | 'hi';
}

const NEXT_STAGE: Partial<Record<ReferralStage, ReferralStage>> = {
  initiated:          'accepted',
  accepted:           'transport_arranged',
  transport_arranged: 'patient_en_route',
  patient_en_route:   'arrived',
  arrived:            'under_treatment',
  under_treatment:    'discharged',
  discharged:         'follow_up_due',
};

const URGENCY_CLASS: Record<string, string> = {
  emergency: 'badge-emergency', urgent: 'badge-urgent', routine: 'badge-routine', elective: 'badge-neutral'
};

export const ReferralSummaryCard: React.FC<ReferralSummaryCardProps> = ({ referral, onAdvance, canAdvance, lang = 'en' }) => {
  const patient = typeof referral.patientId === 'object' ? referral.patientId : null;
  const nextStage = NEXT_STAGE[referral.currentStage];

  return (
    <div className="card">
      <div className="card-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`badge ${URGENCY_CLASS[referral.urgency] || 'badge-neutral'}`}>{referral.urgency}</span>
          <h3 style={{ margin: 0 }}>
            {patient ? patient.name : 'Patient'}
            <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.875rem' }}> · {referral.fromFacilityName} → {referral.toFacilityName}</span>
          </h3>
        </div>
        <span className="badge badge-info">{referral.currentStage.replace(/_/g, ' ')}</span>
      </div>

      <div className="card-body">
        <p style={{ marginBottom: 12 }}><strong>Reason:</strong> {referral.reason}</p>
        <ReferralPipeline referral={referral} lang={lang as 'en' | 'mr'} />

        {referral.ambulanceNumber && (
          <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
            <span className="text-sm"><strong>Ambulance:</strong> {referral.ambulanceNumber}</span>
            {referral.driverPhone && <span className="text-sm"><strong>Driver:</strong> {referral.driverPhone}</span>}
          </div>
        )}
      </div>

      {canAdvance && nextStage && (
        <div className="card-footer">
          <button
            onClick={() => onAdvance?.(nextStage)}
            className="btn btn-primary btn-sm"
          >
            Advance to: {nextStage.replace(/_/g, ' ')}
          </button>
          <span className="text-xs text-muted">Initiated {new Date(referral.initiatedAt).toLocaleDateString('en-IN')} by {referral.initiatedBy}</span>
        </div>
      )}
    </div>
  );
};
