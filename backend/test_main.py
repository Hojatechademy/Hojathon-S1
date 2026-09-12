import os
import sys
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))
import main


class StudyPilotBackendTests(unittest.TestCase):
    def setUp(self):
        main.sessions.clear()
        self.client = TestClient(main.app)

    def _start(self, goal):
        response = self.client.post(
            "/sessions",
            json={"goal": goal, "days": 3, "hours_per_day": 2},
        )
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def test_health_and_fallback_workflow(self):
        with patch.dict(os.environ, {}, clear=True):
            session = self._start("I have a Python exam in 3 days")
        topics = [item["topic"] for item in session["study_plan"]]
        self.assertEqual(session["ai_mode"], "fallback")
        self.assertTrue(all("operating" not in topic.lower() for topic in topics))
        self.assertEqual(len(session["diagnostic_quiz"]), 4)
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})

        answers = [
            {"question_id": question["id"], "answer_index": 0}
            for question in session["diagnostic_quiz"]
        ]
        evaluation = self.client.post(
            f"/sessions/{session['session_id']}/diagnostic/submit",
            json={"answers": answers},
        )
        self.assertEqual(evaluation.status_code, 200, evaluation.text)
        result = evaluation.json()
        self.assertTrue(result["weak_topics"])
        self.assertTrue(result["targeted_practice"])
        self.assertTrue(result["targeted_practice"][0]["id"])
        self.assertTrue(result["targeted_practice"][0]["question"])
        self.assertNotIn("correct_answer", result["targeted_practice"][0])
        self.assertEqual(sum(item["minutes"] for item in result["adapted_plan"]), 360)
        self.assertEqual(result["ai_mode"], "fallback")
        explanation = self.client.get(f"/sessions/{session['session_id']}/topics/{result['weak_topics'][0]}/explanation")
        self.assertEqual(explanation.status_code, 200)
        self.assertEqual(explanation.json()["topic"], result["weak_topics"][0])
        practice_answers = [{"practice_id": item["id"], "answer_index": 0} for item in result["targeted_practice"]]
        weak_practice = self.client.post(f"/sessions/{session['session_id']}/practice/submit", json={"answers": [{**answer, "answer_index": 1} for answer in practice_answers]})
        self.assertEqual(weak_practice.status_code, 200, weak_practice.text)
        self.assertEqual(weak_practice.json()["topic_status"], "still weak")
        practice_result = self.client.post(f"/sessions/{session['session_id']}/practice/submit", json={"answers": practice_answers})
        self.assertEqual(practice_result.status_code, 200, practice_result.text)
        self.assertIn(practice_result.json()["topic_status"], {"strong", "improving", "still weak"})
        self.assertEqual(practice_result.json()["progress"]["practice_score"], 1.0)

    def test_fallback_subjects_are_distinct(self):
        with patch.dict(os.environ, {}, clear=True):
            python_session = self._start("I have a Python exam in 3 days")
            os_session = self._start("I have an Operating Systems exam in 3 days")
        python_topics = {item["topic"] for item in python_session["study_plan"]}
        os_topics = {item["topic"] for item in os_session["study_plan"]}
        self.assertNotEqual(python_topics, os_topics)
        self.assertTrue(all("python" in topic.lower() for topic in python_topics))
        self.assertTrue(all("operating systems" in topic.lower() for topic in os_topics))

    def test_mocked_llm_returns_structured_subject_relevant_content(self):
        generated = {
            "subject": "Python",
            "plan": [
                {"topic": "Functions", "title": "Build function fluency", "minutes": 90, "reason": "Foundation for reuse."},
                {"topic": "Data structures", "title": "Practice collections", "minutes": 90, "reason": "Common exam patterns."},
                {"topic": "OOP", "title": "Model objects", "minutes": 90, "reason": "High-value application."},
                {"topic": "Exceptions", "title": "Handle failures", "minutes": 90, "reason": "Important runtime skill."},
            ],
            "quiz": [
                {"topic": "Functions", "prompt": "What does a function package?", "options": ["Reusable behavior", "A file", "A comment"], "correct_answer": 0, "difficulty": "easy"},
                {"topic": "Data structures", "prompt": "Which stores ordered values?", "options": ["List", "Comment", "Module"], "correct_answer": 0, "difficulty": "easy"},
                {"topic": "OOP", "prompt": "What is an instance?", "options": ["An object", "A loop", "A syntax error"], "correct_answer": 0, "difficulty": "medium"},
                {"topic": "Exceptions", "prompt": "What handles an error?", "options": ["try/except", "print only", "import only"], "correct_answer": 0, "difficulty": "medium"},
            ],
        }
        with patch.object(main.llm_service, "generate_json", return_value=generated):
            session = self._start("I have a Python exam in 3 days")
        self.assertEqual(session["ai_mode"], "ai")
        self.assertEqual(session["subject"], "Python")
        self.assertEqual(session["diagnostic_quiz"][0]["topic"], "Functions")
        self.assertNotIn("correct_answer", session["diagnostic_quiz"][0])

    def test_unknown_tool_is_rejected_and_agent_is_bounded(self):
        with self.assertRaises(ValueError):
            main._execute_approved_tool("run_shell", lambda: None)
        session = self._start("Calculus exam")
        state = main.sessions[session["session_id"]]
        state.tool_calls = main.MAX_AGENT_STEPS
        answers = [{"question_id": question["id"], "answer_index": 0} for question in session["diagnostic_quiz"]]
        response = self.client.post(f"/sessions/{state.session_id}/diagnostic/submit", json={"answers": answers})
        self.assertEqual(response.status_code, 409)


if __name__ == "__main__":
    unittest.main()
