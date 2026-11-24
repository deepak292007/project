# ArogyaLink ML Service

Truthful Shadow Evaluation, Safety Flooring & Data Governance Service for ArogyaLink (SIH 2026 Problem 26133).

## 1. Truthful Machine Learning Architecture

ArogyaLink enforces absolute clinical integrity:
- **No Unvalidated Models in Patient Care:** Currently, all production clinical decision support runs on the authoritative rules engine in `apps/api-server/src/services/clinicalDecisionSupport.js` (WHO IMCI, MoHFW Guidelines, NP-NCD).
- **Explicit Shadow Mode:** ML endpoints return `modelState: "SHADOW_ONLY_NO_UNVALIDATED_MODELS"`.
- **Safety Floor Guarantee:** Any candidate model may escalate urgency (e.g. routine -> urgent) based on multi-factorial risk, but **can NEVER downgrade a rule-triggered emergency**.

---

## 2. Five Distinct ML Tasks

| # | Task Name | Description & Model Strategy | Production Clinical Status |
|---|---|---|---|
| **1** | **Triage Urgency** | Gradient boosting / LightGBM on vitals, age, gestational status, and symptom flags. Rules act as immutable safety floor. | **Shadow Evaluation Only** (`POST /api/v1/triage/shadow`) |
| **2** | **Multilingual Extraction** | Indic language symptom extraction (te/kn/hi/mr/en) with strict JSON schema and negation handling. | **Rule-grounded Shadow** (`POST /api/v1/extraction/symptoms`) |
| **3** | **Guideline RAG Assistant** | Evidence-based guideline search over NHM, ICMR STG, IMCI, and Dakshata protocols. Strictly cites sources and refuses to diagnose. | **Non-Diagnostic Reference** (`POST /api/v1/guidelines/search`) |
| **4** | **Learned Facility Ranker** | Ranks healthcare facilities based on logged queue wait-time vs baseline, actual bed availability, and transit urgency. | **Shadow Mode** (`POST /api/v1/ranking/facility`) |
| **5** | **Operational Forecasting** | Footfall & essential medicine stock-out prediction based on aggregate longitudinal encounter trends. | **Aggregate Telemetry** (`POST /api/v1/forecast/operational`) |

---

## 3. Data Governance & Privacy Compliance

1. **Digital Personal Data Protection Act (DPDP Act 2023):**
   - No identifiable health data (PII) is ever transmitted to model training clusters or third-party inference providers.
   - Clinical assessments require explicit `trainingDataFlags: { deidentified: true, abdmConsentVerified: true, eligibleForTraining: true }` before being exported.

2. **Ayushman Bharat Digital Mission (ABDM):**
   - Consent artifacts are verified before data is used for retrospective model validation.
   - Historical clinician reviews (`clinicianReview.status`) act as the gold standard label. Clinician review alone is NOT treated as consent to train a model.

3. **Institutional Review & Clinical Pilot:**
   - Pre-training utilizes public benchmarks (MedMCQA, AI4Bharat IndicTrans2, ICMR STGs).
   - Real patient data requires Institutional Ethics Committee (IEC) approval before model training.

---

## 4. Running the Service

```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000
```
Health check:
`GET http://localhost:8000/api/v1/health`
