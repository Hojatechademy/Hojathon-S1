import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, adk_agent_service

def run_tests():
    print("==================================================")
    print("      Testing Google ADK Agent Integration        ")
    print("==================================================")

    client = app.test_client()

    # 1. Health check with ADK agent status
    print("\n--- Test 1: Health Check ---")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    health_data = res.get_json()
    print("Health response:", health_data)
    assert health_data.get("adk_agent", {}).get("status") == "active"
    print("✅ Health check passed: ADK agent is active.")

    # 2. Agent Memory Summary
    print("\n--- Test 2: Agent Memory Summary ---")
    res = client.get("/api/agent/memory/student_001")
    assert res.status_code == 200
    mem_data = res.get_json()
    print("Initial memory summary:", mem_data)
    assert mem_data.get("student_name") == "Alex Rivera"
    assert "rank" in mem_data
    print("✅ Memory summary retrieved successfully.")

    # 3. Agent Chat - Multi-angle explanation (Sports Car Analogy)
    print("\n--- Test 3: Multi-Angle Explanation Turn ---")
    chat_payload = {
        "chapter_id": "physics_newtons_laws",
        "message": "Explain Newton's third law using a sports car analogy.",
        "session_id": "test_session_verify_1",
        "student_id": "student_001"
    }
    res = client.post("/api/agent/chat", json=chat_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
    reply_data = res.get_json()
    print("Tools called:", [t["name"] for t in reply_data.get("tools_called", [])])
    print("Reply preview:", reply_data.get("reply", "")[:200])
    assert len(reply_data.get("reply", "")) > 50
    assert reply_data.get("memory_used") is True
    print("✅ Multi-angle explanation turn succeeded.")

    # 4. Agent Chat - Practice Question Generation Tool
    print("\n--- Test 4: Practice Question Generation Tool ---")
    quiz_payload = {
        "chapter_id": "physics_newtons_laws",
        "message": "Create 2 practice questions for my level on Newton's Laws.",
        "session_id": "test_session_verify_1",
        "student_id": "student_001"
    }
    res = client.post("/api/agent/chat", json=quiz_payload)
    assert res.status_code == 200
    quiz_res = res.get_json()
    tools = [t["name"] for t in quiz_res.get("tools_called", [])]
    print("Tools called for quiz:", tools)
    action = quiz_res.get("action_payload")
    print("Action payload:", action.get("type") if action else None)
    assert len(quiz_res.get("reply", "")) > 50
    print("✅ Practice question generation succeeded.")

    # 5. Agent Chat - Pace Adjustment Tool
    print("\n--- Test 5: Pace Adjustment Tool ---")
    pace_payload = {
        "chapter_id": "physics_newtons_laws",
        "message": "Please adjust my learning pace to casual.",
        "session_id": "test_session_verify_1",
        "student_id": "student_001"
    }
    res = client.post("/api/agent/chat", json=pace_payload)
    assert res.status_code == 200
    pace_res = res.get_json()
    print("Tools called for pace adjustment:", [t["name"] for t in pace_res.get("tools_called", [])])
    updated_profile = pace_res.get("student_profile", {})
    print("Updated student pace:", updated_profile.get("preferred_pace"))
    assert updated_profile.get("preferred_pace") == "casual"
    print("✅ Learning pace adjusted to 'casual' and persisted in profile.")

    # 6. Reset Session
    print("\n--- Test 6: Reset Session ---")
    reset_res = client.post("/api/agent/reset-session", json={"session_id": "test_session_verify_1"})
    assert reset_res.status_code == 200
    print("Reset response:", reset_res.get_json())
    print("✅ Session reset successfully.")

    print("\n==================================================")
    print("🎉 ALL 6 GOOGLE ADK INTEGRATION TESTS PASSED! 🎉")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
