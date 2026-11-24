/**
 * DataManagementPortal — High-Level Public Health Data Management & FHIR Interoperability
 * Provides database statistics, synthetic cohort generation, and FHIR R4 Bundle export.
 */
import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';

interface DataStats {
  database: string;
  collections: {
    patients: number;
    facilities: number;
    referrals: number;
    encounters: number;
    opBookings: number;
    grievances: number;
  };
  analytics: {
    highRiskCohortSize: number;
    andhraPradeshFacilities: number;
    maharashtraFacilities: number;
    fhirResourcesExportable: number;
    systemHealth: string;
    lastSeeded: string;
  };
}

export const DataManagementPortal: React.FC = () => {
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [batchSize, setBatchSize] = useState(15);
  const [targetRegion, setTargetRegion] = useState<'Andhra Pradesh' | 'Maharashtra'>('Andhra Pradesh');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [fhirJson, setFhirJson] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await api.get<{ ok: boolean; collections: DataStats['collections']; analytics: DataStats['analytics']; database: string }>('/api/data/management/stats');
      if (res?.collections) {
        setStats({
          database: res.database,
          collections: res.collections,
          analytics: res.analytics
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setStatusMsg(null);
    try {
      const res = await api.post<{ ok: boolean; count: number; message: string }>('/api/data/management/generate-synthetic', {
        batchSize,
        region: targetRegion
      });
      if (res?.ok) {
        setStatusMsg(`✓ ${res.message}`);
        fetchStats();
      }
    } catch {
      setStatusMsg('Failed to generate synthetic data.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportFhir() {
    try {
      const res = await api.get<Record<string, unknown>>('/api/data/management/export-fhir');
      if (res) {
        setFhirJson(JSON.stringify(res, null, 2));
      }
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner */}
      <div style={{ background: 'var(--col-teal-dark)', color: '#ffffff', padding: '16px 20px', borderRadius: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.75rem' }}>🗄️</span>
            <div>
              <h3 style={{ margin: 0, color: '#ffffff' }}>High-Level Health Data Management &amp; FHIR R4 Hub</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', opacity: 0.9 }}>
                Longitudinal Health Records · ABHA Registry · Synthetic Cohort Generation · Interoperability Standards
              </p>
            </div>
          </div>
          <button onClick={fetchStats} className="btn btn-ghost btn-sm" style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
            🔄 Refresh Metrics
          </button>
        </div>
      </div>

      {/* Database & Resource Counts */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
          <div className="card" style={{ padding: '14px 16px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>PATIENT RECORDS (ABHA)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--col-teal-dark)' }}>{stats.collections.patients}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-green)' }}>High-Risk Cohort: {stats.analytics.highRiskCohortSize}</div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>NETWORK FACILITIES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--col-teal-dark)' }}>{stats.collections.facilities}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>AP: {stats.analytics.andhraPradeshFacilities} · MH: {stats.analytics.maharashtraFacilities}</div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>OPD TOKENS BOOKED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--col-teal-dark)' }}>{stats.collections.opBookings}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>Live Queue Integrated</div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>REFERRALS &amp; TRANSFERS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--col-teal-dark)' }}>{stats.collections.referrals}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-green)' }}>8-Stage Continuum Active</div>
          </div>

          <div className="card" style={{ padding: '14px 16px', background: '#f8fafc' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-ink-muted)' }}>FHIR R4 RESOURCES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--col-teal-dark)' }}>~{stats.analytics.fhirResourcesExportable}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--col-green)' }}>✓ ABDM Compliant</div>
          </div>
        </div>
      )}

      {/* Synthetic Cohort Batch Generator */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>⚡ On-Demand Synthetic Patient Cohort Generator</h3>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--col-ink-light)', marginTop: 0 }}>
            Generate realistic, diverse synthetic patient records with vitals, longitudinal conditions, and ABHA IDs to stress-test queueing algorithms and clinical decision support.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Region / Target Population:</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => setTargetRegion('Andhra Pradesh')}
                  className={`btn btn-sm ${targetRegion === 'Andhra Pradesh' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  🌾 Andhra Pradesh (Amaravati)
                </button>
                <button
                  onClick={() => setTargetRegion('Maharashtra')}
                  className={`btn btn-sm ${targetRegion === 'Maharashtra' ? 'btn-primary' : 'btn-ghost'}`}
                >
                  🏖️ Maharashtra (Palghar)
                </button>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Batch Size:</label>
              <select
                className="form-control"
                style={{ width: 120, marginTop: 4, height: 34 }}
                value={batchSize}
                onChange={e => setBatchSize(Number(e.target.value))}
              >
                <option value={10}>10 Patients</option>
                <option value={20}>20 Patients</option>
                <option value={35}>35 Patients</option>
                <option value={50}>50 Patients</option>
              </select>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary"
                style={{ padding: '7px 18px', fontSize: '0.875rem' }}
              >
                {generating ? 'Generating Cohort…' : `Generate ${batchSize} Records`}
              </button>
            </div>
          </div>

          {statusMsg && (
            <div style={{ marginTop: 14, padding: '8px 12px', background: '#f0fdf4', color: 'var(--col-green)', borderRadius: 4, fontSize: '0.8125rem', border: '1px solid var(--col-green-border)' }}>
              {statusMsg}
            </div>
          )}
        </div>
      </div>

      {/* FHIR R4 Bundle Export */}
      <div className="card">
        <div className="card-header" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>🌐 FHIR R4 Standard Interoperability Export</h3>
          <button onClick={handleExportFhir} className="btn btn-secondary btn-sm">
            Export FHIR Bundle JSON
          </button>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--col-ink-light)', marginTop: 0 }}>
            Converts MongoDB clinical schemas into ABDM-compliant Fast Healthcare Interoperability Resources (FHIR R4) Bundles containing Patient, Condition, and Observation resources.
          </p>

          {fhirJson && (
            <div style={{ marginTop: 12 }}>
              <pre style={{
                background: '#1e293b', color: '#38bdf8', padding: '14px', borderRadius: 6,
                fontSize: '0.75rem', maxHeight: 280, overflowY: 'auto', fontFamily: 'monospace'
              }}>
                {fhirJson}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
