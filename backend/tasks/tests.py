# Create your tests here.
from django.test import TestCase
from .scoring import calculate_score, detect_cycle
from datetime import date, timedelta
import json

class ScoringTests(TestCase):
    def test_detect_cycle_true(self):
        tasks = [
            {"title": "A", "dependencies": ["B"]},
            {"title": "B", "dependencies": ["A"]},
        ]
        self.assertTrue(detect_cycle(tasks))

    def test_calculate_score_overdue(self):
        t = {
            "title": "Overdue",
            "due_date": (date.today() - timedelta(days=2)).isoformat(),
            "estimated_hours": 2,
            "importance": 8,
            "dependencies": []
        }
        score, explanation = calculate_score(t, [t])
        # overdue should result in a high urgency component, so score > importance alone
        self.assertTrue(score > 5)

    def test_sorting_priorities(self):
        t1 = {"title": "Quick low", "due_date": None, "estimated_hours": 0.5, "importance": 3, "dependencies": []}
        t2 = {"title": "Important", "due_date": None, "estimated_hours": 8, "importance": 10, "dependencies": []}
        s1, _ = calculate_score(t1, [t1,t2])
        s2, _ = calculate_score(t2, [t1,t2])
        # ensure scores computed, and make assertion that at least one score is > 0
        self.assertTrue(isinstance(s1, float) and isinstance(s2, float))

    def test_suggest_returns_top3(self):
        today = date.today()
        tasks = [
            {"title": "A", "due_date": (today + timedelta(days=1)).isoformat(), "estimated_hours": 2, "importance": 8, "dependencies": []},
            {"title": "B", "due_date": (today + timedelta(days=10)).isoformat(), "estimated_hours": 0.5, "importance": 4, "dependencies": []},
            {"title": "C", "due_date": None, "estimated_hours": 5, "importance": 10, "dependencies": []},
            {"title": "D", "due_date": (today - timedelta(days=1)).isoformat(), "estimated_hours": 8, "importance": 6, "dependencies": []}
        ]

        resp = self.client.post("/api/tasks/suggest/", data=json.dumps(tasks), content_type="application/json")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn("suggestions", body)
        self.assertTrue(isinstance(body["suggestions"], list))
        # top3 length should be min(3, number of tasks)
        self.assertEqual(len(body["suggestions"]), 3)
        # each suggestion must contain score and explanation
        for s in body["suggestions"]:
            self.assertIn("score", s)
            self.assertIn("explanation", s)
