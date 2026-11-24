import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from fastapi.testclient import TestClient

class TestMLService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["modelState"], "SHADOW_ONLY_NO_UNVALIDATED_MODELS")
        self.assertTrue(data["governance"]["dpdpAct2023Compliant"])

    def test_triage_shadow_safety_floor(self):
        payload = {
            "symptoms": ["chest pain", "shortness of breath"],
            "vitals": {"spo2": 88.0, "bp": "160/100"},
            "isPregnant": False,
            "ruleFloorUrgency": "emergency"
        }
        response = self.client.post("/api/v1/triage/shadow", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["ruleFloorUrgency"], "emergency")
        self.assertTrue(data["safetyFloorEnforced"])
        self.assertIsNone(data["shadowModelSuggestion"])

    def test_multilingual_symptom_extraction_negation(self):
        payload = {
            "narrative": "no chest pain",
            "language": "en"
        }
        response = self.client.post("/api/v1/extraction/symptoms", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("no chest pain", data["negatedSymptoms"])

    def test_guideline_rag_refusal_to_diagnose(self):
        payload = {
            "clinicalQuery": "Severe headache and elevated blood pressure in 3rd trimester"
        }
        response = self.client.post("/api/v1/guidelines/search", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("refuses to generate automated medical diagnoses", data["diagnosisRefusal"])
        self.assertGreaterEqual(len(data["citedSources"]), 2)

if __name__ == "__main__":
    unittest.main()
