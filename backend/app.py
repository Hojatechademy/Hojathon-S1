import os
import json
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import Config
from services.pdf_service import PDFService
from services.adaptive_engine import AdaptiveEngine
from services.gemini_service import GeminiService
from services.adk_agent_service import ADKAgentService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eduro-api")

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/api/*": {"origins": "*"}})

pdf_service = PDFService(Config.PDFS_DIR)
adaptive_engine = AdaptiveEngine(Config.STUDENT_FILE)
gemini_service = GeminiService()
adk_agent_service = ADKAgentService(pdf_service, adaptive_engine, gemini_service)

def load_subjects():
    if os.path.exists(Config.SUBJECTS_FILE):
        with open(Config.SUBJECTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def find_chapter_by_id(chapter_id):
    if not chapter_id:
        return None, None
    subjects = load_subjects()
    # 1. Exact match on id
    for sub in subjects:
        for ch in sub.get("chapters", []):
            if ch.get("id") == chapter_id:
                return sub, ch

    # 2. Match on pdf_filename with or without .pdf
    cid_clean = str(chapter_id).lower().removesuffix(".pdf")
    for sub in subjects:
        for ch in sub.get("chapters", []):
            pdf_stem = ch.get("pdf_filename", "").lower().removesuffix(".pdf")
            if pdf_stem and (pdf_stem == cid_clean or cid_clean in pdf_stem or pdf_stem in cid_clean):
                return sub, ch

    # 3. Match on title or id substring
    for sub in subjects:
        for ch in sub.get("chapters", []):
            if cid_clean in ch.get("id", "").lower() or cid_clean in ch.get("title", "").lower():
                return sub, ch

    return None, None

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Eduro AI Education Platform",
        "gcp_adc": gemini_service.get_status(),
        "adk_agent": {
            "status": "active",
            "app_name": adk_agent_service.app_name,
            "tools_count": len(adk_agent_service.tools)
        }
    })

@app.route("/api/subjects", methods=["GET"])
def get_subjects():
    subjects = load_subjects()
    profile = adaptive_engine.get_profile()
    mastery_map = profile.get("topic_mastery", {})
    completed_set = set(profile.get("completed_chapters", []))

    # Enrich chapters with student mastery data
    for sub in subjects:
        for ch in sub.get("chapters", []):
            cid = ch.get("id")
            ch["student_mastery"] = mastery_map.get(cid, 0)
            ch["is_completed"] = cid in completed_set

    return jsonify({
        "subjects": subjects,
        "student": profile
    })

@app.route("/api/chapters/<chapter_id>", methods=["GET"])
def get_chapter(chapter_id):
    sub, ch = find_chapter_by_id(chapter_id)
    if not ch:
        return jsonify({"error": "Chapter not found"}), 404

    profile = adaptive_engine.get_profile()
    cid = ch.get("id")
    ch_data = {
        **ch,
        "subject_id": sub.get("id"),
        "subject_name": sub.get("name"),
        "student_mastery": profile.get("topic_mastery", {}).get(cid, 0),
        "is_completed": cid in profile.get("completed_chapters", [])
    }
    return jsonify({
        "chapter": ch_data,
        "student": profile
    })

@app.route("/api/pdf/<path:filename>", methods=["GET"])
def serve_pdf(filename):
    # Support accessing by chapter_id or direct filename
    if not filename.endswith(".pdf"):
        _, ch = find_chapter_by_id(filename)
        if ch and "pdf_filename" in ch:
            filename = ch["pdf_filename"]
        else:
            filename = f"{filename}.pdf"

    safe_name = os.path.basename(filename)
    file_path = os.path.join(Config.PDFS_DIR, safe_name)
    if not os.path.exists(file_path):
        return jsonify({"error": f"PDF '{safe_name}' not found"}), 404

    response = send_from_directory(
        Config.PDFS_DIR,
        safe_name,
        mimetype="application/pdf"
    )
    # Inline viewing header
    response.headers["Content-Disposition"] = f"inline; filename={safe_name}"
    return response

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    chapter_id = data.get("chapter_id")
    user_message = data.get("message", "").strip()
    chat_history = data.get("chat_history", [])
    explanation_style = data.get("explanation_style", "eli5").lower()

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    sub, ch = find_chapter_by_id(chapter_id)
    chapter_title = ch.get("title", "General Subject Study") if ch else "General Subject Study"
    pdf_filename = ch.get("pdf_filename") if ch else None

    chapter_text = ""
    if pdf_filename:
        extracted = pdf_service.extract_text(pdf_filename)
        chapter_text = extracted.get("full_text", "")

    profile = adaptive_engine.get_profile()
    student_rank = profile.get("rank", {})

    reply = gemini_service.chat_with_chapter(
        chapter_title=chapter_title,
        chapter_text=chapter_text,
        user_message=user_message,
        chat_history=chat_history,
        student_rank=student_rank,
        explanation_style=explanation_style
    )

    return jsonify({
        "reply": reply,
        "style": explanation_style,
        "student_rank": student_rank
    })

@app.route("/api/agent/chat", methods=["POST"])
def agent_chat():
    data = request.get_json() or {}
    chapter_id = data.get("chapter_id")
    user_message = data.get("message", "").strip()
    session_id = data.get("session_id")
    student_id = data.get("student_id", "student_001")

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    sub, ch = find_chapter_by_id(chapter_id)
    provided_title = data.get("chapter_title")
    chapter_title = (ch.get("title") if ch else None) or provided_title or "General Subject Study"
    pdf_filename = ch.get("pdf_filename") if ch else None
    subject_name = sub.get("name", "") if sub else ""
    chapter_summary = ch.get("summary", "") if ch else ""
    key_topics = ch.get("key_topics", []) if ch else []
    difficulty = ch.get("difficulty", "Standard") if ch else "Standard"

    chapter_text_preview = ""
    if pdf_filename:
        extracted = pdf_service.extract_text(pdf_filename)
        chapter_text_preview = extracted.get("full_text", "")[:3500]

    if not session_id:
        session_id = f"session_{student_id}_{chapter_id or 'general'}"

    result = adk_agent_service.run_chat_turn(
        chapter_id=chapter_id or "",
        chapter_title=chapter_title,
        pdf_filename=pdf_filename or "",
        user_message=user_message,
        session_id=session_id,
        student_id=student_id,
        subject_name=subject_name,
        chapter_summary=chapter_summary,
        key_topics=key_topics,
        difficulty=difficulty,
        chapter_text_preview=chapter_text_preview
    )

    return jsonify(result)

@app.route("/api/agent/memory", methods=["GET"])
@app.route("/api/agent/memory/<student_id>", methods=["GET"])
def agent_memory(student_id="student_001"):
    summary = adk_agent_service.get_memory_summary(student_id)
    return jsonify(summary)

@app.route("/api/agent/reset-session", methods=["POST"])
def agent_reset_session():
    data = request.get_json() or {}
    session_id = data.get("session_id", "default_session")
    adk_agent_service.reset_session(session_id)
    return jsonify({"status": "session_reset", "session_id": session_id})

@app.route("/api/practice/generate", methods=["POST"])
def generate_practice():
    data = request.get_json() or {}
    chapter_id = data.get("chapter_id")
    count = data.get("count", 3)

    sub, ch = find_chapter_by_id(chapter_id)
    if not ch:
        return jsonify({"error": "Chapter not found"}), 404

    pdf_filename = ch.get("pdf_filename")
    extracted = pdf_service.extract_text(pdf_filename)
    chapter_text = extracted.get("full_text", "")

    profile = adaptive_engine.get_profile()
    student_rank = profile.get("rank", {})

    questions = gemini_service.generate_practice_questions(
        chapter_id=chapter_id,
        chapter_title=ch.get("title"),
        chapter_text=chapter_text,
        student_rank=student_rank,
        count=count
    )

    return jsonify({
        "chapter_id": chapter_id,
        "chapter_title": ch.get("title"),
        "student_rank": student_rank,
        "questions": questions
    })

@app.route("/api/practice/evaluate", methods=["POST"])
def evaluate_practice():
    data = request.get_json() or {}
    chapter_id = data.get("chapter_id")
    questions = data.get("questions", [])
    submissions = data.get("submissions", {})

    if not chapter_id or not questions:
        return jsonify({"error": "chapter_id and questions are required"}), 400

    sub, ch = find_chapter_by_id(chapter_id)
    chapter_title = ch.get("title", "") if ch else ""
    pdf_filename = ch.get("pdf_filename") if ch else None
    extracted = pdf_service.extract_text(pdf_filename) if pdf_filename else {}
    chapter_text = extracted.get("full_text", "")

    profile = adaptive_engine.get_profile()
    student_rank = profile.get("rank", {})

    eval_result = gemini_service.evaluate_answers(
        chapter_title=chapter_title,
        chapter_text=chapter_text,
        questions=questions,
        student_submissions=submissions,
        student_rank=student_rank
    )

    # Update student rank and profile in adaptive engine
    profile_update = adaptive_engine.update_after_quiz(
        chapter_id=chapter_id,
        earned_score=eval_result.get("earned_score", 0),
        max_score=eval_result.get("max_score", len(questions)),
        feedback_summary=eval_result.get("summary_feedback", ""),
        identified_weakness=eval_result.get("identified_weakness")
    )

    return jsonify({
        "evaluation": eval_result,
        "profile_update": profile_update,
        "current_profile": adaptive_engine.get_profile()
    })

@app.route("/api/exam-prep", methods=["POST"])
def exam_prep():
    data = request.get_json() or {}
    chapter_id = data.get("chapter_id")

    sub, ch = find_chapter_by_id(chapter_id)
    if not ch:
        return jsonify({"error": "Chapter not found"}), 404

    pdf_filename = ch.get("pdf_filename")
    extracted = pdf_service.extract_text(pdf_filename)
    chapter_text = extracted.get("full_text", "")

    prep_data = gemini_service.generate_exam_prep(
        chapter_title=ch.get("title"),
        chapter_text=chapter_text
    )

    return jsonify(prep_data)

@app.route("/api/flashcards", methods=["POST"])
def flashcards():
    data = request.get_json() or {}
    chapter_id = data.get("chapter_id")

    sub, ch = find_chapter_by_id(chapter_id)
    if not ch:
        return jsonify({"error": "Chapter not found"}), 404

    pdf_filename = ch.get("pdf_filename")
    extracted = pdf_service.extract_text(pdf_filename)
    chapter_text = extracted.get("full_text", "")

    cards = gemini_service.generate_flashcards(
        chapter_title=ch.get("title"),
        chapter_text=chapter_text
    )

    return jsonify({"flashcards": cards})

@app.route("/api/rubric/generate", methods=["POST"])
def generate_rubric():
    data = request.get_json() or {}
    subject = data.get("subject", "General Academic")
    question = data.get("question", "").strip()
    max_marks = data.get("max_marks", 10)
    chapter_id = data.get("chapter_id")
    chapter_title = data.get("chapter_title")

    if not question:
        return jsonify({"error": "Question text is required to generate a scoring rubric"}), 400

    if not chapter_title and chapter_id:
        sub, ch = find_chapter_by_id(chapter_id)
        if ch:
            chapter_title = ch.get("title")
        if sub and not data.get("subject"):
            subject = sub.get("name")

    try:
        max_marks = float(max_marks)
        if max_marks <= 0:
            max_marks = 10.0
    except (ValueError, TypeError):
        max_marks = 10.0

    rubric = gemini_service.generate_scoring_rubric(
        subject=subject,
        question=question,
        max_marks=max_marks,
        chapter_title=chapter_title
    )

    return jsonify(rubric)

@app.route("/api/student/profile", methods=["GET", "POST"])
def student_profile():
    if request.method == "POST":
        data = request.get_json() or {}
        profile = adaptive_engine.get_profile()
        if "preferred_pace" in data:
            profile["preferred_pace"] = data["preferred_pace"]
        if "name" in data:
            profile["name"] = data["name"]
        adaptive_engine._save_profile(profile)
        return jsonify(adaptive_engine.get_profile())

    return jsonify(adaptive_engine.get_profile())

@app.route("/api/student/reset", methods=["POST"])
def reset_student():
    return jsonify(adaptive_engine.reset_profile())

@app.route("/api/upload", methods=["POST"])
def upload_custom_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    subject_id = request.form.get("subject_id", "custom")
    chapter_title = request.form.get("title") or file.filename.rsplit(".", 1)[0].replace("_", " ").title()

    safe_name = secure_filename(file.filename)
    target_path = os.path.join(Config.PDFS_DIR, safe_name)
    file.save(target_path)

    # Add to subjects.json
    subjects = load_subjects()
    target_sub = next((s for s in subjects if s["id"] == subject_id), None)
    new_chapter_id = f"{subject_id}_{safe_name.rsplit('.', 1)[0].lower()}"

    new_chapter = {
        "id": new_chapter_id,
        "title": chapter_title,
        "chapter_number": len(target_sub["chapters"]) + 1 if target_sub else 1,
        "estimated_mins": 20,
        "difficulty": "Custom Upload",
        "pdf_filename": safe_name,
        "summary": f"Uploaded textbook PDF: {chapter_title}",
        "key_topics": ["User Uploaded Material", "Interactive AI Tutoring"]
    }

    if target_sub:
        target_sub["chapters"].append(new_chapter)
    else:
        subjects.append({
            "id": subject_id,
            "name": subject_id.title(),
            "icon": "BookOpen",
            "color": "from-gray-700 to-slate-900",
            "accent_bg": "bg-slate-50 text-slate-700 border-slate-200",
            "description": "User uploaded course materials and textbooks.",
            "chapters": [new_chapter]
        })

    with open(Config.SUBJECTS_FILE, "w", encoding="utf-8") as f:
        json.dump(subjects, f, indent=2)

    return jsonify({
        "message": "PDF uploaded successfully",
        "chapter": new_chapter
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    logger.info(f"Starting Eduro backend on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False)
