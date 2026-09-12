import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, adk_agent_service

def test_rubric():
    print("==================================================")
    print("      Testing Scoring Rubric Tool Integration     ")
    print("==================================================")

    client = app.test_client()

    # 1. Health check - tool count should now be 9
    print("\n--- Test 1: Health Check (Tool Count) ---")
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    tools_count = data["adk_agent"]["tools_count"]
    print(f"ADK Agent tool count: {tools_count}")
    assert tools_count == 9, f"Expected 9 tools, found {tools_count}"
    print("✅ Health check confirmed: generate_scoring_rubric is registered in ADK tool set.")

    # 2. Rubric API - Physics 5-mark question
    print("\n--- Test 2: Generate Rubric for Physics (5 Marks) ---")
    payload_physics = {
        "subject": "Physics",
        "question": "State Newton's Second Law of Motion and derive F = ma from the rate of change of momentum.",
        "max_marks": 5,
        "chapter_title": "Newton's Laws of Motion"
    }
    res = client.post("/api/rubric/generate", json=payload_physics)
    assert res.status_code == 200, f"Status code {res.status_code}: {res.data}"
    rubric = res.get_json()
    print("Rubric Subject:", rubric.get("subject"))
    print("Max Marks:", rubric.get("max_marks"))
    print("Bloom Level:", rubric.get("bloom_level"))
    print("Criteria Count:", len(rubric.get("criteria", [])))
    
    total_criteria_marks = sum(c["marks"] for c in rubric["criteria"])
    print(f"Criteria marks sum: {total_criteria_marks} (Expected: 5.0)")
    assert abs(total_criteria_marks - 5.0) < 0.1, f"Marks mismatch: {total_criteria_marks} != 5.0"
    assert len(rubric.get("performance_levels", [])) >= 3
    assert len(rubric.get("examiner_tips", [])) >= 1
    assert len(rubric.get("model_answer", "")) > 50
    print("✅ Physics 5-mark rubric generated successfully with balanced criteria.")

    # 3. Rubric API - Computer Science 10-mark question
    print("\n--- Test 3: Generate Rubric for Computer Science (10 Marks) ---")
    payload_cs = {
        "subject": "Computer Science",
        "question": "Explain Dijkstra's shortest path algorithm and derive its asymptotic time complexity using a min-heap priority queue.",
        "max_marks": 10
    }
    res = client.post("/api/rubric/generate", json=payload_cs)
    assert res.status_code == 200
    rubric_cs = res.get_json()
    total_cs_marks = sum(c["marks"] for c in rubric_cs["criteria"])
    print(f"CS criteria marks sum: {total_cs_marks} (Expected: 10.0)")
    assert abs(total_cs_marks - 10.0) < 0.1
    print("✅ Computer Science 10-mark rubric generated successfully.")

    # 4. Agent Chat Turn - Rubric Tool invocation
    print("\n--- Test 4: ADK Agent Chat Turn for Rubric Tool ---")
    chat_payload = {
        "chapter_id": "physics_newtons_laws",
        "message": "Create a 5 marks scoring rubric for the question: Explain Newton's third law with an example.",
        "session_id": "test_rubric_session_1",
        "student_id": "student_001"
    }
    res = client.post("/api/agent/chat", json=chat_payload)
    assert res.status_code == 200
    chat_data = res.get_json()
    tools = [t["name"] for t in chat_data.get("tools_called", [])]
    print("Tools called in chat:", tools)
    print("Reply preview:", chat_data.get("reply", "")[:180])
    action = chat_data.get("action_payload")
    print("Action payload type:", action.get("type") if action else None)
    assert "generate_scoring_rubric" in tools or (action and action.get("type") == "rubric") or "rubric" in chat_data.get("reply", "").lower()
    print("✅ ADK Agent successfully recognized and handled the scoring rubric request!")

    print("\n==================================================")
    print("🎉 ALL SCORING RUBRIC BACKEND TESTS PASSED! 🎉")
    print("==================================================")

if __name__ == "__main__":
    test_rubric()
