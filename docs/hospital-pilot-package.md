# ArogyaLink: Partner-Ready Hospital Pilot Package
**Smart Rural Healthcare Access and Care Coordination Platform**  
*Document Version: 2.1.0 · Safety & Clinical Governance Edition · SIH 2026 Problem 26133*

---

## 1. Executive Summary & Product Overview

**ArogyaLink** is an interoperable, clinician-governed digital health platform designed to eliminate emergency transit delays, standardize rural triage, and optimize bed and specialist allocation across tiered Indian public health networks (Sub-Centres, Primary Health Centres, Rural Hospitals, and District Hospitals).

### Key Architectural Capabilities
- **6 Clinically Distinct User Roles:** Patient, ASHA Worker (CHW), PHC Medical Officer, Hospital Specialist Doctor, Hospital Administrator, and District Health Administrator.
- **5 Supported Indian Languages:** English, Hindi (`hi`), Marathi (`mr`), Telugu (`te`), and Kannada (`kn`).
- **FHIR R4 Interoperability:** Standards-compliant transformation for `Patient`, `Encounter`, `Observation`, `Condition`, `ServiceRequest` (Referral), and `Bundle`.
- **ABDM-Compliant Architecture:** ABHA ID integration, explicit consent tracking, and longitudinal health records conforming to the Digital Personal Data Protection (DPDP) Act 2023.
- **Offline-First Synchronization:** Resilient indexed caching on field tablets with conflict-resolution rules that guarantee clinician reviews can never be overwritten by stale client updates.

---

## 2. Clinical Decision Support & Safety Architecture

ArogyaLink does not use unvalidated AI to make autonomous diagnoses. All clinical suggestions are governed by an authoritative rules engine that enforces a strict **Safety Floor**:

```
+-------------------------------------------------------------------+
|                     Clinical Input                               |
|        Symptoms (5 Languages) + Vitals + Gestational Status       |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|             Extract Affirmative & Negated Symptoms               |
|      (e.g., "no chest pain" filtered out of emergency trigger)     |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|               Authoritative Rules Registry (Floor)                |
|      WHO IMCI/IMAI · MoHFW Primary Care Guidelines · NP-NCD       |
|                                                                   |
|   Selects highest-severity rule:                                 |
|   emergency (4) > urgent (3) > routine (2) > home_care (1)       |
|                                                                   |
|   * Cough alone with normal vitals evaluates to 'routine'         |
|   * Hypoxia (SpO2 < 90%) or crisis BP triggers 'emergency'        |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                    Candidate Model (Shadow Mode)                  |
|    Model CAN escalate urgency (e.g. routine -> urgent)            |
|    Model CANNOT downgrade a rule-triggered emergency             |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                      Licensed Medical Officer                     |
|           Mandatory Clinical Review (Accept / Override)           |
|            Non-diagnostic disclaimer attached to all CDS          |
+-------------------------------------------------------------------+
```

### Safety Principles
1. **Four Consistent Urgency Tiers:** `emergency`, `urgent`, `routine`, and `home_care`.
2. **Rule-Based Safety Floor:** A statistical model may recommend escalating urgency based on multi-factorial risk, but is programmatically prohibited from downgrading any rule-triggered emergency or red flag.
3. **Multilingual Negation Handling:** Natural language parsing verifies affirmative symptoms while ensuring negated complaints (e.g., "denies chest pain", "छातीत दुखत नाही", "ఛాతీ నొప్పి లేదు") never trigger false emergencies.
4. **Non-Diagnostic Disclaimer:** Every CDS output explicitly displays:  
   > *“ArogyaLink Clinical Decision Support is assistive only and does not constitute a medical diagnosis. All recommendations must be confirmed by a licensed medical officer.”*

---

## 3. Limited Pilot Scope (Phase 1)

| Parameter | Specification |
|---|---|
| **Duration** | 4 to 8 Weeks |
| **Pilot Facilities** | 1 Primary Health Centre (PHC) + 1 Sub-District / District Hospital (DH) |
| **Target Cohort** | ~500 outpatient screenings, 50 maternal ANC evaluations, ~30 inter-facility emergency referrals |
| **Participating Personnel** | 10 ASHA Workers, 2 PHC Medical Officers, 2 Hospital Specialists, 1 District Data Officer |
| **Operating Mode** | **Shadow Mode Only** for candidate ML models; live rules engine for clinical floor |

---

## 4. Measurable Go-Live Safety Gates

Before any candidate machine learning model can transition from shadow mode to live clinician-facing assistance, it must pass all four deterministic gates:

| Gate | Metric / Benchmark | Verification Method |
|---|---|---|
| **Gate 1: Emergency Recall** | **≥ 98.0%** on critical red flags | Evaluated on frozen test suite of verified emergency presentations (ACS, eclampsia, stroke, severe hypoxia). |
| **Gate 2: Zero Under-Triage** | **0.0%** rule downgrades | Safety floor enforcement: 0 emergencies downgraded to routine or home care. |
| **Gate 3: Clinician Oversight** | **100%** clinician review | Every clinical encounter logged with `clinicianReview: { status: 'accepted' \| 'overridden', reviewedBy }`. |
| **Gate 4: Frozen Evaluation Set** | **N ≥ 500** verified records | Minimum 100 cases per supported language (`en`, `hi`, `mr`, `te`, `kn`), adjudicated by an independent panel of 3 physicians. |

---

## 5. Model Lifecycle, Drift Monitoring & Rollback Protocol

### Model Versioning & Registry
- All model artifacts, feature transformers, and decision thresholds receive cryptographic SHA-256 hashes and semantic version tags (e.g., `model-triage-v1.2.0`).
- Model parameters are versioned separately from rule definitions (`RULE-CARD-001 v2.0.0`).

### Continuous Drift Monitoring
- **Input Data Drift:** Weekly Population Stability Index (PSI) and Kolmogorov-Smirnov (KS) tests on patient age, systolic/diastolic BP, and SpO2 distributions.
- **Concept Drift:** Tracking discrepancy rate between shadow model suggestions and clinician final decisions (`overridden` rate).

### Automated Rollback Trigger
If any of the following occur during validation:
1. Candidate model suggests downgrading an emergency in shadow comparison.
2. Clinical override rate exceeds 15% over a 7-day rolling window.
3. Feature distribution PSI exceeds 0.25 (significant drift).

**Action:** Immediate automated fallback to pure rules-based decision support (`clinicalDecisionSupport.js`). Zero clinician downtime.

---

## 6. Privacy, Ethics & Regulatory Compliance

### Digital Personal Data Protection (DPDP) Act 2023
- **Data Minimization:** Only vitals, non-identifying symptom codes, and clinical categories are utilized for decision support.
- **De-Identification Pipeline:** Identifiable patient details (name, phone, ABHA number, full address) are stripped prior to any analytical or audit processing.
- **Consent Architecture:** Patient consent is explicitly captured and stored (`Consent` model) under ABDM data exchange standards.

### Training Data Governance
- **Gold-Label Standard:** `ClinicalAssessment.clinicianReview` (`accepted` vs `overridden`) serves as the true clinical label.
- **Consent Is Separate from Review:** A clinician's review is **never** treated as consent to train a model. Records enter training exports **only** if:
  ```json
  "trainingDataFlags": {
    "deidentified": true,
    "abdmConsentVerified": true,
    "eligibleForTraining": true
  }
  ```

---

## 7. Clinician & ASHA Training Plan

### Week 1: Training & System Familiarization
- **Module 1 (ASHA / CHW):** Tablet usage, selecting patient language, entering chief complaints, pulse oximeter and BP cuff data entry, offline sync best practices.
- **Module 2 (PHC MO):** Reviewing CDS recommendations, checking red flags, executing emergency referrals, recording final diagnoses.
- **Module 3 (Hospital Specialist & Admin):** Managing bed capacity snapshots, receiving teleconsult requests, ambulance dispatch tracking.

### Support & Incident Management
- Dedicated 24x7 pilot support phone and WhatsApp channel.
- Incident escalation: Technical bugs resolved within 4 hours; clinical protocol inquiries answered within 1 hour by clinical lead.

---

## 8. Stakeholder Outreach & Administrative Checklist

### A. Outreach Draft to District Health Officer / Hospital Superintendent

> **Subject:** Proposal for Limited Clinical Evaluation: ArogyaLink Intelligent Triage & Care Coordination Platform
>
> Dear [Dr. Name / District Health Officer / Superintendent],
>
> We respectfully propose a limited 6-week pilot evaluation of **ArogyaLink**, an interoperable digital health and emergency triage platform designed to improve emergency response and outpatient coordination across [District Name] health facilities.
>
> **What the platform delivers:**
> 1. Standardized triage based on WHO IMCI and MoHFW National Treatment Guidelines.
> 2. Multilingual support in Marathi, Hindi, Telugu, Kannada, and English.
> 3. Real-time facility bed visibility and automated referral tracking (108 ambulance coordination).
> 4. Full ABDM and DPDP Act 2023 compliance with strict offline tablet synchronization.
>
> **Safety and Clinical Governance:**
> - The pilot operates in **Shadow Mode** with zero disruption to existing clinical protocols.
> - All triage recommendations require mandatory confirmation by the on-duty Medical Officer.
> - No patient identifiable information (PII) is exported or used for automated training.
>
> We would welcome the opportunity to present a 20-minute demonstration to your clinical leadership team at your convenience.
>
> Sincerely,  
> **ArogyaLink Project Team**  
> *Smart Rural Healthcare Access and Care Coordination Platform*

---

### B. Prerequisite Checklist for Pilot Site Kick-Off

- [ ] **Facility Selection:** Identify 1 PHC and 1 Sub-District / District Hospital.
- [ ] **Institutional Review / Ethics:** Submit pilot protocol to Institutional Ethics Committee (IEC).
- [ ] **Hardware Verification:** 10 field Android tablets (Android 10+, min 3GB RAM) with 4G connectivity.
- [ ] **User Roster:** Enumerate participating ASHAs and Medical Officers with facility IDs.
- [ ] **Facility Master Data:** Confirm GPS coordinates, departments, 24x7 emergency status, and bed baselines.
- [ ] **Baseline Data Freeze:** Collect 30 days of retrospective queue wait-times and referral volumes for baseline comparison.
