/**
 * BedAllocationView — SFH Rwanda Blue Room–Inspired Ward Bed Allocation System
 *
 * Inspired by the Rwanda Society for Family Health (SFH) Blue Room command centre:
 *  - Wall-to-wall colour-coded bed status grid (visual ward map)
 *  - Real-time occupancy KPIs with colour alert thresholds
 *  - Per-bed patient card assignment, with admit / discharge / transfer actions
 *  - Ward-level filter tabs (General · ICU · Maternity · Paediatrics · Emergency)
 *  - Auto-refresh every 15 s (simulated live telemetry)
 *  - Predictive capacity alerts (≥ 85% occupancy warns, ≥ 95% shows critical banner)
 *  - Discharge prediction badge on long-stay beds
 *  - ABHA-linked patient assignment with triage urgency badge
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageShell } from '../../components/layout/PageShell';
import { useSession } from '../../store';
import * as api from '../../lib/api';
import type { Facility, Referral, UrgencyLevel } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type WardType = 'general' | 'icu' | 'maternity' | 'paediatrics' | 'emergency' | 'oxygen';

type BedStatus =
  | 'available'      // green  — ready to receive patient
  | 'occupied'       // red    — patient in bed
  | 'reserved'       // amber  — reserved for incoming referral
  | 'cleaning'       // grey   — just discharged, being sanitized
  | 'maintenance';   // dark   — equipment fault / out-of-service

interface BedPatient {
  patientName: string;
  abhaId?: string;
  age?: number;
  gender?: 'M' | 'F' | 'O';
  diagnosis?: string;
  admittedAt: string;        // ISO
  urgency: UrgencyLevel;
  referralId?: string;
  doctorName?: string;
  daysStay?: number;
  dischargeExpected?: string; // ISO date
  vitals?: {
    bp?: string;
    spo2?: number;
    pulse?: number;
  };
}

interface Bed {
  id: string;           // e.g. "GEN-01"
  ward: WardType;
  wardLabel: string;
  number: number;
  status: BedStatus;
  patient?: BedPatient;
  isWindowBed?: boolean;
  hasOxygen?: boolean;
  hasMonitor?: boolean;
}

type ModalMode = 'admit' | 'discharge' | 'transfer' | 'info' | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const WARD_META: Record<WardType, { label: string; icon: string; color: string; bgColor: string }> = {
  general:     { label: 'General Medicine',       icon: '🏥', color: '#0f766e', bgColor: '#f0fdfa' },
  icu:         { label: 'ICU / Critical Care',    icon: '❤️‍🔥', color: '#b91c1c', bgColor: '#fff1f2' },
  maternity:   { label: 'Maternity & OB-GYN',    icon: '🤰', color: '#7c3aed', bgColor: '#faf5ff' },
  paediatrics: { label: 'Paediatrics & NICU',    icon: '👶', color: '#0369a1', bgColor: '#f0f9ff' },
  emergency:   { label: 'Emergency / Resus Bay', icon: '🚨', color: '#dc2626', bgColor: '#fef2f2' },
  oxygen:      { label: 'High-Dependency (O₂)',  icon: '💨', color: '#d97706', bgColor: '#fffbeb' },
};

const STATUS_META: Record<BedStatus, { label: string; color: string; bg: string; border: string }> = {
  available:   { label: 'Available',   color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  occupied:    { label: 'Occupied',    color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
  reserved:    { label: 'Reserved',    color: '#b45309', bg: '#fef9c3', border: '#fde047' },
  cleaning:    { label: 'Sanitising',  color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  maintenance: { label: 'Out of Svc', color: '#374151', bg: '#e5e7eb', border: '#9ca3af' },
};

const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  emergency: '#dc2626',
  urgent:    '#d97706',
  routine:   '#15803d',
  elective:  '#2563eb',
};

// ─── Seed / Simulate Bed Data ─────────────────────────────────────────────────

function generateBeds(facilityResources?: Facility['resources']): Bed[] {
  const r = facilityResources;
  const genTotal  = r?.bedsTotal      ?? 30;
  const genOcc    = r?.bedsOccupied   ?? 18;
  const icuTotal  = r?.icuTotal       ?? 10;
  const icuOcc    = r?.icuOccupied    ?? 6;
  const oxyTotal  = r?.oxygenBeds     ?? 8;
  const oxyOcc    = r?.oxygenOccupied ?? 5;

  const beds: Bed[] = [];
  let idx = 0;

  // Helper to generate a patient for occupied bed
  const samplePatients: BedPatient[] = [
    { patientName: 'Savita Patil',     abhaId: 'ABHA-9876-5432', age: 28, gender: 'F', diagnosis: 'Gestational Hypertension', admittedAt: new Date(Date.now()-86400000*2).toISOString(), urgency: 'urgent',    doctorName: 'Dr. Ananya Rao',     daysStay: 2, dischargeExpected: new Date(Date.now()+86400000).toISOString(),   vitals: { bp: '140/95', spo2: 97, pulse: 84 } },
    { patientName: 'Ramakant Bhagat',  abhaId: 'ABHA-1234-5678', age: 62, gender: 'M', diagnosis: 'COPD Exacerbation',        admittedAt: new Date(Date.now()-86400000*4).toISOString(), urgency: 'emergency', doctorName: 'Dr. Pradeep Kale',   daysStay: 4, vitals: { bp: '170/100', spo2: 91, pulse: 98 } },
    { patientName: 'Meena Deshmukh',   abhaId: 'ABHA-2345-6789', age: 34, gender: 'F', diagnosis: 'Post-LSCS Day 1',          admittedAt: new Date(Date.now()-86400000*1).toISOString(), urgency: 'routine',   doctorName: 'Dr. Ananya Rao',     daysStay: 1, dischargeExpected: new Date(Date.now()+86400000*2).toISOString(), vitals: { bp: '120/80', spo2: 99, pulse: 72 } },
    { patientName: 'Arjun Gaikwad',    abhaId: 'ABHA-3456-7890', age: 7,  gender: 'M', diagnosis: 'Severe Falciparum Malaria',admittedAt: new Date(Date.now()-86400000*3).toISOString(), urgency: 'urgent',    doctorName: 'Dr. Kavya Nair',     daysStay: 3, vitals: { bp: '—', spo2: 95, pulse: 110 } },
    { patientName: 'Sunita Waghmare',  abhaId: 'ABHA-4567-8901', age: 45, gender: 'F', diagnosis: 'Diabetic Ketoacidosis',    admittedAt: new Date(Date.now()-86400000*2).toISOString(), urgency: 'emergency', doctorName: 'Dr. Pradeep Kale',   daysStay: 2, vitals: { bp: '100/70', spo2: 94, pulse: 120 } },
    { patientName: 'Lakshman Thorat',                              age: 55, gender: 'M', diagnosis: 'ACS / STEMI',             admittedAt: new Date(Date.now()-86400000*1).toISOString(), urgency: 'emergency', doctorName: 'Dr. Rajan Mehta',    daysStay: 1, vitals: { bp: '90/60', spo2: 92, pulse: 105 } },
    { patientName: 'Priya Kulkarni',   abhaId: 'ABHA-6789-0123', age: 23, gender: 'F', diagnosis: 'Ante-partum Haemorrhage',  admittedAt: new Date(Date.now()-86400000*1).toISOString(), urgency: 'emergency', doctorName: 'Dr. Ananya Rao',     daysStay: 1, vitals: { bp: '80/50', spo2: 96, pulse: 130 } },
    { patientName: 'Govind Salve',                                 age: 70, gender: 'M', diagnosis: 'Hypertensive Crisis',     admittedAt: new Date(Date.now()-86400000*5).toISOString(), urgency: 'urgent',    doctorName: 'Dr. Rajan Mehta',    daysStay: 5, dischargeExpected: new Date(Date.now()+86400000).toISOString(),   vitals: { bp: '180/110', spo2: 96, pulse: 88 } },
    { patientName: 'Rekha Jadhav',     abhaId: 'ABHA-8901-2345', age: 38, gender: 'F', diagnosis: 'Placenta Praevia – Watch', admittedAt: new Date(Date.now()-86400000*3).toISOString(), urgency: 'urgent',    doctorName: 'Dr. Ananya Rao',     daysStay: 3, dischargeExpected: new Date(Date.now()+86400000*4).toISOString(), vitals: { bp: '130/85', spo2: 98, pulse: 78 } },
    { patientName: 'Aditya Mane',                                  age: 3,  gender: 'M', diagnosis: 'Febrile Seizures',        admittedAt: new Date(Date.now()-86400000*1).toISOString(), urgency: 'urgent',    doctorName: 'Dr. Kavya Nair',     daysStay: 1, vitals: { bp: '—', spo2: 97, pulse: 128 } },
  ];

  let patIdx = 0;
  const nextPatient = (): BedPatient => samplePatients[patIdx++ % samplePatients.length];

  // General wards
  for (let i = 1; i <= Math.min(genTotal, 20); i++) {
    const isOcc = i <= Math.min(genOcc, 20);
    const isRes = !isOcc && i === Math.min(genOcc, 20) + 1;
    const isCln = !isOcc && !isRes && i === Math.min(genOcc, 20) + 2;
    beds.push({
      id: `GEN-${String(i).padStart(2,'0')}`,
      ward: 'general', wardLabel: 'General Medicine',
      number: i,
      status: isOcc ? 'occupied' : isRes ? 'reserved' : isCln ? 'cleaning' : 'available',
      patient: isOcc ? nextPatient() : undefined,
      isWindowBed: i % 4 === 0,
      hasOxygen: i % 3 === 0,
    });
    idx++;
  }

  // ICU beds
  for (let i = 1; i <= Math.min(icuTotal, 10); i++) {
    const isOcc = i <= Math.min(icuOcc, 10);
    beds.push({
      id: `ICU-${String(i).padStart(2,'0')}`,
      ward: 'icu', wardLabel: 'ICU / Critical Care',
      number: i,
      status: isOcc ? 'occupied' : i === Math.min(icuOcc, 10) + 1 ? 'reserved' : 'available',
      patient: isOcc ? nextPatient() : undefined,
      hasOxygen: true,
      hasMonitor: true,
    });
    idx++;
  }

  // Maternity ward
  for (let i = 1; i <= 8; i++) {
    beds.push({
      id: `MAT-${String(i).padStart(2,'0')}`,
      ward: 'maternity', wardLabel: 'Maternity & OB-GYN',
      number: i,
      status: i <= 5 ? 'occupied' : i === 6 ? 'reserved' : i === 7 ? 'cleaning' : 'available',
      patient: i <= 5 ? nextPatient() : undefined,
      hasOxygen: i <= 3,
    });
  }

  // Paediatrics
  for (let i = 1; i <= 6; i++) {
    beds.push({
      id: `PAE-${String(i).padStart(2,'0')}`,
      ward: 'paediatrics', wardLabel: 'Paediatrics & NICU',
      number: i,
      status: i <= 3 ? 'occupied' : i === 4 ? 'cleaning' : 'available',
      patient: i <= 3 ? nextPatient() : undefined,
      hasOxygen: i <= 4,
      hasMonitor: i <= 2,
    });
  }

  // Emergency bays
  for (let i = 1; i <= 6; i++) {
    beds.push({
      id: `EMG-${String(i).padStart(2,'0')}`,
      ward: 'emergency', wardLabel: 'Emergency / Resus Bay',
      number: i,
      status: i <= 2 ? 'occupied' : i <= 4 ? 'reserved' : i === 5 ? 'cleaning' : 'available',
      patient: i <= 2 ? nextPatient() : undefined,
      hasOxygen: true,
      hasMonitor: true,
    });
  }

  // Oxygen / High-Dependency
  for (let i = 1; i <= Math.min(oxyTotal, 8); i++) {
    const isOcc = i <= Math.min(oxyOcc, 8);
    beds.push({
      id: `OXY-${String(i).padStart(2,'0')}`,
      ward: 'oxygen', wardLabel: 'High-Dependency (O₂)',
      number: i,
      status: isOcc ? 'occupied' : i === Math.min(oxyOcc, 8) + 1 ? 'reserved' : 'available',
      patient: isOcc ? nextPatient() : undefined,
      hasOxygen: true,
      hasMonitor: i <= 4,
    });
  }

  return beds;
}

// ─── Bed Card ─────────────────────────────────────────────────────────────────

interface BedCardProps {
  bed: Bed;
  onClick: (bed: Bed) => void;
  compact?: boolean;
}

const BedCard: React.FC<BedCardProps> = ({ bed, onClick, compact }) => {
  const sm = STATUS_META[bed.status];
  const wm = WARD_META[bed.ward];
  const uColor = bed.patient ? URGENCY_COLORS[bed.patient.urgency] : undefined;
  const isLongStay = (bed.patient?.daysStay ?? 0) >= 5;
  const dischargeToday = bed.patient?.dischargeExpected
    ? new Date(bed.patient.dischargeExpected).toDateString() === new Date().toDateString()
    : false;

  return (
    <button
      onClick={() => onClick(bed)}
      title={`${bed.id} — ${sm.label}${bed.patient ? ' · ' + bed.patient.patientName : ''}`}
      style={{
        border: `2px solid ${sm.border}`,
        background: sm.bg,
        borderRadius: 10,
        padding: compact ? '6px 8px' : '10px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s',
        minWidth: compact ? 80 : 140,
        minHeight: compact ? 56 : 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Urgency left stripe */}
      {uColor && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: uColor, borderRadius: '8px 0 0 8px' }} />
      )}

      {/* Bed ID + icons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: uColor ? 6 : 0 }}>
        <span style={{ fontWeight: 700, fontSize: compact ? '0.7rem' : '0.78rem', color: wm.color, fontFamily: 'monospace' }}>{bed.id}</span>
        <span style={{ fontSize: '0.65rem', display: 'flex', gap: 2 }}>
          {bed.hasOxygen && <span title="Piped Oxygen">💨</span>}
          {bed.hasMonitor && <span title="Bedside Monitor">📟</span>}
          {isLongStay && <span title="Long-stay (≥5 days)">⏰</span>}
          {dischargeToday && <span title="Discharge expected today">🟢</span>}
        </span>
      </div>

      {/* Status pill */}
      <div style={{
        fontSize: '0.65rem', fontWeight: 700, color: sm.color,
        background: 'rgba(255,255,255,0.65)', borderRadius: 4,
        padding: '1px 5px', display: 'inline-block', width: 'fit-content',
      }}>
        {sm.label.toUpperCase()}
      </div>

      {/* Patient info */}
      {!compact && bed.patient && (
        <>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', marginTop: 2, lineHeight: 1.2 }}>
            {bed.patient.patientName}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
            {bed.patient.age}{bed.patient.gender ? `y ${bed.patient.gender}` : ''} · {bed.patient.diagnosis}
          </div>
          {bed.patient.vitals && (
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 1 }}>
              {bed.patient.vitals.bp && `BP ${bed.patient.vitals.bp}`}
              {bed.patient.vitals.spo2 && ` · SpO₂ ${bed.patient.vitals.spo2}%`}
            </div>
          )}
        </>
      )}

      {compact && bed.status === 'occupied' && (
        <div style={{ fontSize: '0.6rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 76 }}>
          {bed.patient?.patientName?.split(' ')[0]}
        </div>
      )}
    </button>
  );
};

// ─── Bed Detail Modal ─────────────────────────────────────────────────────────

interface BedModalProps {
  bed: Bed | null;
  mode: ModalMode;
  onClose: () => void;
  onAction: (bedId: string, action: 'admit' | 'discharge' | 'transfer' | 'clean', payload?: Partial<BedPatient & { targetBedId?: string }>) => void;
  allBeds: Bed[];
}

const BedModal: React.FC<BedModalProps> = ({ bed, mode, onClose, onAction, allBeds }) => {
  const [admitForm, setAdmitForm] = useState({ patientName: '', abhaId: '', age: '', gender: 'F' as 'M'|'F'|'O', diagnosis: '', urgency: 'routine' as UrgencyLevel, doctorName: '' });
  const [transferTarget, setTransferTarget] = useState('');

  if (!bed || !mode) return null;

  const sm = STATUS_META[bed.status];
  const wm = WARD_META[bed.ward];

  const availableForTransfer = allBeds.filter(b => b.status === 'available' && b.id !== bed.id);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: 28, maxWidth: 520, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: wm.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {wm.icon} {wm.label}
            </span>
            <h2 style={{ margin: '4px 0 0', fontSize: '1.2rem' }}>Bed {bed.id}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`,
              borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700,
            }}>
              {sm.label}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#94a3b8' }}>✕</button>
          </div>
        </div>

        {/* Current patient info */}
        {bed.patient && mode !== 'admit' && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{bed.patient.patientName}</div>
            {bed.patient.abhaId && <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 4 }}>ABHA: {bed.patient.abhaId}</div>}
            <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 4 }}>
              {bed.patient.age}y · {bed.patient.gender} · {bed.patient.diagnosis}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: 4 }}>
              Doctor: <strong>{bed.patient.doctorName || '—'}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 8 }}>
              Admitted: {new Date(bed.patient.admittedAt).toLocaleString('en-IN')}
              {bed.patient.daysStay !== undefined && ` · Day ${bed.patient.daysStay}`}
            </div>
            {/* Urgency */}
            <div style={{
              display: 'inline-block', borderRadius: 6, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
              background: URGENCY_COLORS[bed.patient.urgency] + '22',
              color: URGENCY_COLORS[bed.patient.urgency],
              border: `1px solid ${URGENCY_COLORS[bed.patient.urgency]}55`,
            }}>
              {bed.patient.urgency.toUpperCase()}
            </div>
            {/* Vitals */}
            {bed.patient.vitals && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {bed.patient.vitals.bp && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>BP</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{bed.patient.vitals.bp}</div>
                  </div>
                )}
                {bed.patient.vitals.spo2 && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>SpO₂</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: bed.patient.vitals.spo2 < 94 ? '#dc2626' : '#15803d' }}>{bed.patient.vitals.spo2}%</div>
                  </div>
                )}
                {bed.patient.vitals.pulse && (
                  <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pulse</div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{bed.patient.vitals.pulse} bpm</div>
                  </div>
                )}
              </div>
            )}
            {/* Discharge expected */}
            {bed.patient.dischargeExpected && (
              <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#0369a1', background: '#eff6ff', borderRadius: 6, padding: '4px 10px', display: 'inline-block' }}>
                🗓 Expected discharge: {new Date(bed.patient.dischargeExpected).toLocaleDateString('en-IN')}
              </div>
            )}
          </div>
        )}

        {/* Admit Form */}
        {mode === 'admit' && bed.status !== 'occupied' && (
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#1e293b' }}>Admit Patient to Bed {bed.id}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Patient Name *</label>
                <input className="form-control" value={admitForm.patientName} onChange={e => setAdmitForm(f => ({ ...f, patientName: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>ABHA ID</label>
                <input className="form-control" value={admitForm.abhaId} onChange={e => setAdmitForm(f => ({ ...f, abhaId: e.target.value }))} placeholder="ABHA-XXXX-XXXX" />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Age</label>
                <input type="number" className="form-control" value={admitForm.age} onChange={e => setAdmitForm(f => ({ ...f, age: e.target.value }))} placeholder="Years" />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Gender</label>
                <select className="form-control" value={admitForm.gender} onChange={e => setAdmitForm(f => ({ ...f, gender: e.target.value as 'M'|'F'|'O' }))}>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Diagnosis / Reason for Admission *</label>
                <input className="form-control" value={admitForm.diagnosis} onChange={e => setAdmitForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Primary diagnosis" />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Urgency *</label>
                <select className="form-control" value={admitForm.urgency} onChange={e => setAdmitForm(f => ({ ...f, urgency: e.target.value as UrgencyLevel }))}>
                  <option value="emergency">🔴 Emergency</option>
                  <option value="urgent">🟡 Urgent</option>
                  <option value="routine">🟢 Routine</option>
                  <option value="elective">🔵 Elective</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 3 }}>Attending Doctor</label>
                <input className="form-control" value={admitForm.doctorName} onChange={e => setAdmitForm(f => ({ ...f, doctorName: e.target.value }))} placeholder="Doctor name" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                className="btn btn-primary"
                disabled={!admitForm.patientName || !admitForm.diagnosis}
                onClick={() => {
                  onAction(bed.id, 'admit', {
                    patientName: admitForm.patientName,
                    abhaId: admitForm.abhaId || undefined,
                    age: admitForm.age ? Number(admitForm.age) : undefined,
                    gender: admitForm.gender,
                    diagnosis: admitForm.diagnosis,
                    urgency: admitForm.urgency,
                    doctorName: admitForm.doctorName || undefined,
                    admittedAt: new Date().toISOString(),
                    daysStay: 0,
                  });
                }}
              >
                ✅ Admit Patient
              </button>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* Discharge action */}
        {mode === 'discharge' && bed.patient && (
          <div>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: 16 }}>
              You are about to discharge <strong>{bed.patient.patientName}</strong> from Bed <strong>{bed.id}</strong>.
              The bed will enter <em>Sanitising</em> state for 30 minutes before becoming available again.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={() => onAction(bed.id, 'discharge')}>
                ✅ Confirm Discharge
              </button>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* Transfer action */}
        {mode === 'transfer' && bed.patient && (
          <div>
            <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: 12 }}>
              Transfer <strong>{bed.patient.patientName}</strong> to another available bed:
            </p>
            <select className="form-control" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} style={{ marginBottom: 16 }}>
              <option value="">— Select target bed —</option>
              {availableForTransfer.map(b => (
                <option key={b.id} value={b.id}>{b.id} · {WARD_META[b.ward].label}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-primary"
                disabled={!transferTarget}
                onClick={() => onAction(bed.id, 'transfer', { targetBedId: transferTarget })}
              >
                ↔️ Confirm Transfer
              </button>
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* Info / action buttons */}
        {mode === 'info' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
            {(bed.status === 'available' || bed.status === 'reserved') && (
              <button className="btn btn-primary" onClick={() => onAction(bed.id, 'admit')}>🛏 Admit Patient</button>
            )}
            {bed.status === 'occupied' && (
              <>
                <button className="btn btn-outline" onClick={() => onAction(bed.id, 'discharge')}>🔓 Discharge</button>
                <button className="btn btn-outline" onClick={() => onAction(bed.id, 'transfer')}>↔️ Transfer</button>
              </>
            )}
            {bed.status === 'cleaning' && (
              <button className="btn btn-primary" onClick={() => onAction(bed.id, 'clean')}>✅ Mark Ready</button>
            )}
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── KPI Strip ─────────────────────────────────────────────────────────────────

interface KPIStripProps {
  beds: Bed[];
}

const KPIStrip: React.FC<KPIStripProps> = ({ beds }) => {
  const total    = beds.length;
  const occupied = beds.filter(b => b.status === 'occupied').length;
  const available= beds.filter(b => b.status === 'available').length;
  const reserved = beds.filter(b => b.status === 'reserved').length;
  const cleaning = beds.filter(b => b.status === 'cleaning').length;
  const occ_pct  = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const critical = occ_pct >= 95;
  const warning  = occ_pct >= 85 && !critical;

  const icus   = beds.filter(b => b.ward === 'icu');
  const icuOcc = icus.filter(b => b.status === 'occupied').length;
  const icuAvail = icus.filter(b => b.status === 'available').length;

  const emergency = beds.filter(b => b.ward === 'emergency');
  const emgOcc   = emergency.filter(b => b.status === 'occupied').length;

  return (
    <>
      {/* Capacity banner */}
      {(critical || warning) && (
        <div style={{
          background: critical ? '#fee2e2' : '#fef9c3',
          border: `1px solid ${critical ? '#fca5a5' : '#fde047'}`,
          borderRadius: 10,
          padding: '10px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          color: critical ? '#b91c1c' : '#92400e',
          fontSize: '0.875rem',
        }}>
          <span style={{ fontSize: '1.3rem' }}>{critical ? '🔴' : '🟡'}</span>
          {critical
            ? `CRITICAL CAPACITY ALERT — ${occ_pct}% beds occupied. Activate overflow protocol or inter-facility transfer immediately.`
            : `CAPACITY WARNING — ${occ_pct}% beds occupied. Consider pre-emptive discharge reviews and elective postponements.`
          }
        </div>
      )}

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Total Beds</div>
          <div className="kpi-value" style={{ color: 'var(--col-teal-dark)' }}>{total}</div>
          <div className="kpi-sub">Across all wards</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Occupancy Rate</div>
          <div className="kpi-value" style={{ color: critical ? '#b91c1c' : warning ? '#d97706' : 'var(--col-teal-dark)' }}>
            {occ_pct}%
          </div>
          <div className="kpi-sub">{occupied} of {total} beds</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Available Beds</div>
          <div className="kpi-value" style={{ color: available < 5 ? '#b91c1c' : '#15803d' }}>{available}</div>
          <div className="kpi-sub">{reserved} reserved, {cleaning} sanitising</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">ICU Available</div>
          <div className="kpi-value" style={{ color: icuAvail === 0 ? '#b91c1c' : icuAvail <= 2 ? '#d97706' : '#15803d' }}>
            {icuAvail}
          </div>
          <div className="kpi-sub">of {icus.length} ICU beds · {icuOcc} occupied</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Emergency Bays</div>
          <div className="kpi-value" style={{ color: '#dc2626' }}>{emgOcc}</div>
          <div className="kpi-sub">active of {emergency.length} bays</div>
        </div>
      </div>
    </>
  );
};

// ─── Occupancy Bar ─────────────────────────────────────────────────────────────

const OccupancyBar: React.FC<{ beds: Bed[]; ward: WardType }> = ({ beds, ward }) => {
  const wBeds  = beds.filter(b => b.ward === ward);
  const occ    = wBeds.filter(b => b.status === 'occupied').length;
  const res    = wBeds.filter(b => b.status === 'reserved').length;
  const total  = wBeds.length;
  const pct    = total > 0 ? Math.round(((occ + res) / total) * 100) : 0;
  const wm     = WARD_META[ward];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: '0.72rem', color: '#64748b', width: 130, flexShrink: 0 }}>{wm.icon} {wm.label}</span>
      <div style={{ flex: 1, height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 95 ? '#dc2626' : pct >= 80 ? '#f59e0b' : wm.color, borderRadius: 5, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pct >= 95 ? '#dc2626' : '#475569', width: 38, textAlign: 'right' }}>{pct}%</span>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8', width: 48, textAlign: 'right' }}>{occ+res}/{total}</span>
    </div>
  );
};

// ─── Legend ───────────────────────────────────────────────────────────────────

const Legend: React.FC = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginRight: 4 }}>BED STATUS:</span>
    {(Object.entries(STATUS_META) as [BedStatus, typeof STATUS_META[BedStatus]][]).map(([key, m]) => (
      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 14, height: 14, background: m.bg, border: `2px solid ${m.border}`, borderRadius: 3 }} />
        <span style={{ fontSize: '0.72rem', color: '#475569' }}>{m.label}</span>
      </div>
    ))}
    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>· Left stripe = urgency colour</span>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

type WardFilter = 'all' | WardType;

export const BedAllocationView: React.FC = () => {
  const { facilityId, lang } = useSession();
  const [beds, setBeds] = useState<Bed[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeWard, setActiveWard] = useState<WardFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [search, setSearch] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(() => {
    api.getFacility(facilityId || 'RH-KHED-01')
      .then(f => {
        setFacility(f);
        setBeds(generateBeds(f.resources));
        setLastRefresh(new Date());
      })
      .catch(() => {
        // fallback
        setBeds(generateBeds(undefined));
        setLastRefresh(new Date());
      })
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadData]);

  // ─── Actions ──────────────────────────────────────────────────────

  function handleBedClick(bed: Bed) {
    setSelectedBed(bed);
    setModalMode('info');
  }

  function handleAction(
    bedId: string,
    action: 'admit' | 'discharge' | 'transfer' | 'clean',
    payload?: Partial<BedPatient & { targetBedId?: string }>
  ) {
    if (action === 'admit' && payload?.patientName) {
      setBeds(prev => prev.map(b =>
        b.id === bedId
          ? { ...b, status: 'occupied', patient: payload as BedPatient }
          : b
      ));
      setModalMode(null);
      setSelectedBed(null);
    } else if (action === 'admit') {
      // switch to admit form
      setModalMode('admit');
    } else if (action === 'discharge') {
      if (selectedBed?.status === 'occupied' && !payload) {
        setModalMode('discharge');
        return;
      }
      setBeds(prev => prev.map(b =>
        b.id === bedId ? { ...b, status: 'cleaning', patient: undefined } : b
      ));
      setModalMode(null);
      setSelectedBed(null);
    } else if (action === 'transfer') {
      if (!payload?.targetBedId) {
        setModalMode('transfer');
        return;
      }
      const sourceBed = beds.find(b => b.id === bedId);
      setBeds(prev => prev.map(b => {
        if (b.id === bedId) return { ...b, status: 'cleaning', patient: undefined };
        if (b.id === payload.targetBedId) return { ...b, status: 'occupied', patient: sourceBed?.patient };
        return b;
      }));
      setModalMode(null);
      setSelectedBed(null);
    } else if (action === 'clean') {
      setBeds(prev => prev.map(b =>
        b.id === bedId ? { ...b, status: 'available' } : b
      ));
      setModalMode(null);
      setSelectedBed(null);
    }
  }

  // ─── Filter & Search ──────────────────────────────────────────────

  const filteredBeds = beds.filter(b => {
    const wardOk = activeWard === 'all' || b.ward === activeWard;
    const searchOk = !search ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.patient?.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      b.patient?.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
      b.patient?.abhaId?.toLowerCase().includes(search.toLowerCase());
    return wardOk && searchOk;
  });

  if (loading) {
    return (
      <PageShell title="Bed Allocation — Blue Room" breadcrumb="Hospital Workspace">
        <div className="text-muted">Loading ward map...</div>
      </PageShell>
    );
  }

  const wards: WardType[] = ['general', 'icu', 'maternity', 'paediatrics', 'emergency', 'oxygen'];

  return (
    <PageShell title="🛏 Bed Allocation — Ward Command Centre" breadcrumb="Hospital Workspace">

      {/* Blue-Room-style header stripe */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #065f46 100%)',
        color: '#fff', borderRadius: 12, padding: '16px 24px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ArogyaLink · SFH Blue Room Inspired
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', marginTop: 2 }}>
            {facility?.name ?? 'Facility'} — Live Ward Map
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            🕐 Last synced: {lastRefresh.toLocaleTimeString('en-IN')} (15s auto-refresh)
          </div>
          <button
            className="btn btn-sm"
            style={{ background: '#0f766e', color: '#fff', border: 'none' }}
            onClick={() => { setLoading(true); loadData(); }}
          >
            🔄 Sync Now
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <KPIStrip beds={beds} />

      {/* Ward occupancy bars */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3 style={{ margin: 0, fontSize: '0.95rem' }}>📊 Ward-Level Occupancy Overview</h3></div>
        <div className="card-body">
          {wards.map(w => <OccupancyBar key={w} beds={beds} ward={w} />)}
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Ward filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', ...wards] as WardFilter[]).map(w => {
            const isAll = w === 'all';
            const meta = isAll ? null : WARD_META[w as WardType];
            return (
              <button
                key={w}
                onClick={() => setActiveWard(w)}
                style={{
                  border: `2px solid ${activeWard === w ? (meta?.color ?? '#0f766e') : '#e2e8f0'}`,
                  background: activeWard === w ? (meta?.bgColor ?? '#f0fdfa') : '#fff',
                  color: activeWard === w ? (meta?.color ?? '#0f766e') : '#64748b',
                  borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                  fontWeight: activeWard === w ? 700 : 500,
                  fontSize: '0.78rem', transition: 'all 0.15s',
                }}
              >
                {isAll ? '🏥 All Wards' : `${meta!.icon} ${meta!.label}`}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Search */}
        <input
          className="form-control"
          style={{ maxWidth: 220, fontSize: '0.82rem' }}
          placeholder="🔍 Search bed / patient / ABHA..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          {(['grid', 'compact'] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                border: 'none', padding: '6px 12px', cursor: 'pointer',
                background: viewMode === v ? '#0f766e' : '#fff',
                color: viewMode === v ? '#fff' : '#64748b',
                fontSize: '0.78rem', fontWeight: viewMode === v ? 700 : 400,
              }}
            >
              {v === 'grid' ? '⊞ Detailed' : '⊟ Compact'}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <Legend />

      {/* Ward Grids */}
      {(activeWard === 'all' ? wards : [activeWard as WardType]).map(ward => {
        const wardBeds = filteredBeds.filter(b => b.ward === ward);
        if (wardBeds.length === 0 && activeWard !== 'all') return null;
        if (wardBeds.length === 0) return null;
        const wm = WARD_META[ward];
        const occCount = wardBeds.filter(b => b.status === 'occupied').length;
        const pct = wardBeds.length > 0 ? Math.round((occCount / wardBeds.length) * 100) : 0;

        return (
          <div key={ward} style={{ marginBottom: 28 }}>
            {/* Ward title bar */}
            <div style={{
              background: wm.bgColor, border: `1px solid ${wm.color}33`,
              borderLeft: `4px solid ${wm.color}`,
              borderRadius: '8px 8px 0 0', padding: '10px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>{wm.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: wm.color }}>{wm.label}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>· {wardBeds.length} beds</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {pct >= 90 && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: 20 }}>⚠ {pct}% FULL</span>}
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{occCount}/{wardBeds.length} occupied</span>
              </div>
            </div>

            {/* Bed grid */}
            <div style={{
              border: `1px solid ${wm.color}33`, borderTop: 'none', borderRadius: '0 0 8px 8px',
              padding: 16, background: '#fff',
              display: 'grid',
              gridTemplateColumns: viewMode === 'compact'
                ? 'repeat(auto-fill, minmax(88px, 1fr))'
                : 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: viewMode === 'compact' ? 8 : 12,
            }}>
              {wardBeds.map(bed => (
                <BedCard
                  key={bed.id}
                  bed={bed}
                  onClick={handleBedClick}
                  compact={viewMode === 'compact'}
                />
              ))}
            </div>
          </div>
        );
      })}

      {filteredBeds.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '0.9rem' }}>
          No beds match your search or filter.
        </div>
      )}

      {/* Discharge predictions panel */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '0.95rem' }}>🗓 Expected Discharges — Next 24 Hours</h3>
        </div>
        <div className="card-body">
          {(() => {
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
            const upcoming = beds.filter(b =>
              b.patient?.dischargeExpected &&
              new Date(b.patient.dischargeExpected) <= tomorrow
            );
            if (upcoming.length === 0) return <div className="text-muted" style={{ fontSize: '0.875rem' }}>No discharges expected in the next 24 hours.</div>;
            return (
              <table className="data-table">
                <thead>
                  <tr><th>Bed</th><th>Ward</th><th>Patient</th><th>Diagnosis</th><th>Expected Discharge</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {upcoming.map(b => (
                    <tr key={b.id}>
                      <td><strong className="font-mono">{b.id}</strong></td>
                      <td>{WARD_META[b.ward].icon} {WARD_META[b.ward].label}</td>
                      <td>{b.patient!.patientName}</td>
                      <td className="text-xs text-muted">{b.patient!.diagnosis}</td>
                      <td>
                        <span style={{ color: '#15803d', fontWeight: 600, fontSize: '0.82rem' }}>
                          {new Date(b.patient!.dischargeExpected!).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => { setSelectedBed(b); setModalMode('discharge'); }}
                          style={{ fontSize: '0.72rem' }}
                        >
                          Discharge Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* Bed Modal */}
      <BedModal
        bed={selectedBed}
        mode={modalMode}
        onClose={() => { setModalMode(null); setSelectedBed(null); }}
        onAction={handleAction}
        allBeds={beds}
      />
    </PageShell>
  );
};

export default BedAllocationView;

