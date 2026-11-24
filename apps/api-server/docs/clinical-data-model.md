# Clinical continuity data model

The new `clinicalassessments` collection is the decision-support timeline. It links to the existing `patients`, `encounters`, and `referrals` collections rather than duplicating patient identity.

```text
Patient ──< Encounter ──< Referral
   │             │             │
   └────< ClinicalAssessment >─┘
                    │
                    ├── capturedBy (patient / ASHA / ANM / doctor)
                    ├── AI summary, urgency and red flags
                    ├── recommended test kits and machines
                    └── ranked nearby facilities and selected facility
```

`ClinicalAssessment` is append-only: each record preserves the clinical recommendation and facility capacity visible at that moment. A hospital clinician can set `clinicianReview` to `accepted` or `overridden`; it does not alter the original AI recommendation.

## API contract

`POST /api/ai/clinical-assessments` creates the longitudinal record and returns the summary, resource recommendations, and up to five ranked facilities.

```json
{
  "patientId": "66d0f1a01b2c3d4e5f678901",
  "source": "asha",
  "capturedBy": { "name": "Meena Bhoir", "role": "asha", "facilityId": "SC-KELWA-01" },
  "symptoms": ["fever", "chills", "body aches"],
  "symptomNarrative": "Fever for two days; no bleeding or breathing difficulty.",
  "vitals": { "temp": 39.1, "pulse": 108, "spo2": 97, "bp": "118/76" },
  "latitude": 19.612,
  "longitude": 72.733,
  "language": "en",
  "consent": { "capturedBy": "Meena Bhoir" }
}
```

Read the complete trail with `GET /api/patients/:patientId/clinical-assessments`.

## Existing collections and ownership

| Collection | Responsible actor | Continuity role |
| --- | --- | --- |
| `patients` | ASHA / registration desk | Identity, ABHA, assigned ASHA, chronic conditions and latest vitals |
| `clinicalassessments` | Patient, ASHA, ANM or doctor | Symptom summary, CDS outcome, recommendations, facility matches and review |
| `encounters` | Facility clinician | Visit/teleconsult and final clinical documentation |
| `referrals` | ASHA/PHC and receiving hospital | Closed-loop transfer and treatment stages |
| `followups` | ASHA | Home visit / post-discharge responsibility |
| `facilities` | Facility administrator | Geolocation, diagnostic services, equipment, beds and clinical departments |
| `stock` | Storekeeper / facility | Test consumables and medicines; keep diagnostic inventory as `category: "Diagnostic"` |
| `auditlogs` | System | Immutable actor and event audit trail |

The resource rules are decision support—not a diagnosis or an automatic prescription. Emergency recommendations must be confirmed through the clinical escalation process.
