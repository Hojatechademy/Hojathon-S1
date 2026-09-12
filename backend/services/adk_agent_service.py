import os
import json
import logging
from typing import Dict, Any, List, Optional

from config import Config

# Ensure Google GenAI Vertex AI environment configuration
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "true")
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", Config.PROJECT_ID)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", Config.LOCATION)

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.memory.memory_entry import MemoryEntry
from google.adk.tools import ToolContext, load_memory
from google.genai import types

logger = logging.getLogger("adk-agent-service")


class ADKAgentService:
    """
    Personalized Learning Agent Service powered by Google ADK (Agent Development Kit).
    Addresses problem statement:
    "An agent that makes learning more personalized. They can explain topics in different ways,
    create practice questions, help with exam preparation, and adjust to a student's learning pace
    and level."
    """

    def __init__(self, pdf_service, adaptive_engine, gemini_service):
        self.pdf_service = pdf_service
        self.adaptive_engine = adaptive_engine
        self.gemini_service = gemini_service
        self.app_name = "eduro_learning_agent"

        # Initialize ADK memory and session services
        self.session_service = InMemorySessionService()
        self.memory_service = InMemoryMemoryService()

        # Seed initial memory for student
        self._seed_initial_student_memory()

        # Build tools and agent
        self.tools = self._build_tools()
        self.agent = self._build_agent()
        self.runner = Runner(
            app_name=self.app_name,
            agent=self.agent,
            session_service=self.session_service,
            memory_service=self.memory_service,
            auto_create_session=True
        )

        logger.info("Google ADK Agent Service initialized successfully with memory and interaction tools.")

    def _seed_initial_student_memory(self):
        """Pre-seeds learner profile facts into ADK memory."""
        try:
            profile = self.adaptive_engine.get_profile()
            student_id = profile.get("student_id", "student_001")
            name = profile.get("name", "Alex Rivera")
            rank = profile.get("rank", {})
            weak_spots = profile.get("weak_spots", [])
            pace = profile.get("preferred_pace", "balanced")

            seed_text = (
                f"Student profile for {name} ({student_id}): "
                f"Rank Level {rank.get('rank_id', 1)} ({rank.get('name', 'Novice Explorer')}), "
                f"Preferred Pace: {pace}. "
                f"Known struggle areas: {', '.join(weak_spots) if weak_spots else 'None identified yet'}."
            )

            import asyncio
            from google.adk.events import Event
            event = Event(
                content=types.Content(role="user", parts=[types.Part(text=seed_text)]),
                custom_metadata={"type": "student_profile_seed", "student_id": student_id}
            )
            asyncio.run(self.memory_service.add_events_to_memory(
                app_name=self.app_name,
                user_id=student_id,
                events=[event]
            ))
        except Exception as e:
            logger.warning(f"Note on seeding initial student memory: {e}")

    def _build_tools(self) -> List[Any]:
        """Constructs basic interaction tools for personalized learning interaction."""

        def search_chapter_content(query: str, page_number: Optional[int] = None, tool_context: ToolContext = None) -> str:
            """
            Search and retrieve relevant textbook excerpts, formulas, and page-specific facts from the active chapter PDF.
            Always use this tool to ground explanations and answer student questions accurately.
            Args:
                query: Search terms, topic keywords, or question to look up in the textbook.
                page_number: Optional specific page number (e.g. 1, 2, 3) to inspect.
            """
            state = tool_context.state if tool_context else {}
            chapter_id = state.get("chapter_id", "")
            chapter_title = state.get("chapter_title", "Current Subject")
            pdf_filename = state.get("pdf_filename", "")

            if not pdf_filename and chapter_id:
                pdf_filename = f"{chapter_id}.pdf"

            if not pdf_filename:
                return f"No PDF textbook attached for chapter {chapter_title} ({chapter_id})."

            extracted = self.pdf_service.extract_text(pdf_filename)
            pages = extracted.get("pages", [])
            full_text = extracted.get("full_text", "")
            if not full_text:
                return f"Could not extract text from {pdf_filename}."

            # Check if a specific page number was requested
            target_page = page_number
            if target_page is None and query:
                import re
                page_match = re.search(r'\bpage\s*(\d+)\b', query, re.IGNORECASE)
                if page_match:
                    target_page = int(page_match.group(1))

            if target_page is not None:
                for p in pages:
                    if p.get("page_num") == target_page:
                        return f"--- Content of Page {target_page} of '{chapter_title}' ({pdf_filename}) ---\n{p.get('text', '')}"
                return f"Page {target_page} not found in {pdf_filename}. Total pages available: {len(pages)}."

            # If general query or overview
            q_lower = query.lower().strip() if query else ""
            if any(w in q_lower for w in ["summary", "overview", "what is this chapter", "main concept", "key topic", "all topics"]):
                return f"Textbook Executive Overview for '{chapter_title}' ({pdf_filename}):\n{full_text[:2500]}"

            # Search paragraphs for keyword matches
            paragraphs = [p.strip() for p in full_text.split("\n\n") if len(p.strip()) > 30]
            query_words = [w for w in q_lower.split() if len(w) > 2 and w not in ["the", "and", "for", "with", "this", "that", "from", "what", "how"]]
            if not query_words:
                query_words = q_lower.split()

            matches = [p for p in paragraphs if any(w in p.lower() for w in query_words)]
            if matches:
                selected = "\n---\n".join(matches[:4])
                return f"Found relevant sections in '{chapter_title}' for '{query}':\n{selected[:2500]}"

            return f"Excerpt from textbook for '{chapter_title}' ({pdf_filename}):\n{full_text[:2000]}"

        def explain_concept(concept: str, angle: str, target_level: str, tool_context: ToolContext) -> str:
            """
            Explain a topic or concept using a specific personalized pedagogical angle.
            Args:
                concept: The core concept (e.g. "Newton's Third Law", "Binary Search Trees").
                angle: The explanation angle: "everyday_analogy", "eli5", "mathematical_rigor", "exam_scoring_traps", or "socratic_hints".
                target_level: The student's comprehension level (e.g. "Novice", "Apprentice", "Master").
            """
            state = tool_context.state
            chapter_title = state.get("chapter_title", "Current Subject")
            return f"Concept: {concept} in {chapter_title}. Angle applied: {angle}. Calibration: {target_level}."

        def create_practice_questions(topic: str, difficulty: str, count: int, tool_context: ToolContext) -> Dict[str, Any]:
            """
            Create tailored adaptive practice questions for the student on a topic from this chapter.
            Args:
                topic: The subject matter or section to quiz.
                difficulty: "Foundational", "Core Understanding", or "Advanced".
                count: Number of questions (default 2 or 3).
            """
            state = tool_context.state
            chapter_id = state.get("chapter_id", "")
            chapter_title = state.get("chapter_title", topic)
            profile = self.adaptive_engine.get_profile()
            student_rank = profile.get("rank", {})

            # Generate questions via gemini_service
            pdf_filename = state.get("pdf_filename", "")
            extracted = self.pdf_service.extract_text(pdf_filename) if pdf_filename else {}
            chapter_text = extracted.get("full_text", "")

            questions = self.gemini_service.generate_practice_questions(
                chapter_id=chapter_id,
                chapter_title=chapter_title,
                chapter_text=chapter_text,
                student_rank=student_rank,
                count=count or 2
            )

            # Store in state so UI knows an interactive action occurred
            tool_context.state["action_payload"] = {
                "type": "practice",
                "chapter_id": chapter_id,
                "chapter_title": chapter_title,
                "questions": questions
            }

            return {
                "status": "success",
                "question_count": len(questions),
                "topic": topic,
                "difficulty": difficulty,
                "questions": questions
            }

        def get_exam_prep_summary(focus_topic: str, tool_context: ToolContext) -> Dict[str, Any]:
            """
            Generate high-yield exam preparation guidance: scoring keywords, essential formulas, frequent traps, and memory mnemonics.
            Args:
                focus_topic: Specific focus area or whole chapter.
            """
            state = tool_context.state
            chapter_title = state.get("chapter_title", focus_topic)
            pdf_filename = state.get("pdf_filename", "")
            extracted = self.pdf_service.extract_text(pdf_filename) if pdf_filename else {}
            chapter_text = extracted.get("full_text", "")

            prep_data = self.gemini_service.generate_exam_prep(
                chapter_title=chapter_title,
                chapter_text=chapter_text
            )

            tool_context.state["action_payload"] = {
                "type": "exam_prep",
                "chapter_title": chapter_title,
                "prep_data": prep_data
            }

            return prep_data

        def get_student_learning_profile(tool_context: ToolContext) -> Dict[str, Any]:
            """
            Inspect the student's current learning profile: current rank, XP, topic mastery %, identified weak spots, and preferred pace.
            Use this to adjust explanations to the student's exact level.
            """
            profile = self.adaptive_engine.get_profile()
            state = tool_context.state
            chapter_id = state.get("chapter_id", "")
            mastery = profile.get("topic_mastery", {}).get(chapter_id, 0)

            return {
                "name": profile.get("name"),
                "student_id": profile.get("student_id"),
                "rank": profile.get("rank"),
                "preferred_pace": profile.get("preferred_pace", "balanced"),
                "chapter_mastery_pct": mastery,
                "weak_spots": profile.get("weak_spots", [])
            }

        async def adjust_student_learning_pace(new_pace: str, reason: str, tool_context: ToolContext) -> Dict[str, Any]:
            """
            Adjust the student's learning pace to better fit their current speed and comprehension.
            Args:
                new_pace: Must be one of "casual", "balanced", or "intensive".
                reason: Why this adjustment is being made based on student feedback or performance.
            """
            clean_pace = new_pace.lower().strip()
            if clean_pace not in ["casual", "balanced", "intensive"]:
                clean_pace = "balanced"

            profile = self.adaptive_engine.get_profile()
            old_pace = profile.get("preferred_pace", "balanced")
            profile["preferred_pace"] = clean_pace
            self.adaptive_engine._save_profile(profile)

            # Record in ADK memory
            student_id = profile.get("student_id", "student_001")
            mem_text = f"Pace adjustment: changed from {old_pace} to {clean_pace}. Reason: {reason}"
            from google.adk.events import Event
            event = Event(
                content=types.Content(role="user", parts=[types.Part(text=mem_text)]),
                custom_metadata={"type": "pace_change", "old_pace": old_pace, "new_pace": clean_pace}
            )
            await self.memory_service.add_events_to_memory(
                app_name=self.app_name,
                user_id=student_id,
                events=[event]
            )

            tool_context.state["action_payload"] = {
                "type": "pace_change",
                "old_pace": old_pace,
                "new_pace": clean_pace,
                "reason": reason
            }

            return {
                "success": True,
                "old_pace": old_pace,
                "new_pace": clean_pace,
                "reason": reason
            }

        async def record_student_learning_note(key_insight: str, student_weakness: Optional[str], tool_context: ToolContext) -> str:
            """
            Record a learning milestone, student insight, or identified weak spot into long-term memory.
            Args:
                key_insight: The concept note or learning preference to remember.
                student_weakness: Optional concept phrase if a struggle area was identified.
            """
            profile = self.adaptive_engine.get_profile()
            student_id = profile.get("student_id", "student_001")

            if student_weakness:
                weak_spots = profile.get("weak_spots", [])
                if student_weakness not in weak_spots:
                    weak_spots.append(student_weakness)
                    profile["weak_spots"] = weak_spots[-5:]
                    self.adaptive_engine._save_profile(profile)

            from google.adk.events import Event
            event = Event(
                content=types.Content(role="user", parts=[types.Part(text=f"Learning Note: {key_insight}. Weakness: {student_weakness or 'None'}")]),
                custom_metadata={"type": "learning_note"}
            )
            await self.memory_service.add_events_to_memory(
                app_name=self.app_name,
                user_id=student_id,
                events=[event]
            )

            return "Insight recorded successfully in learner memory."

        def generate_scoring_rubric(question: str, max_marks: float, subject: Optional[str] = None, tool_context: ToolContext = None) -> Dict[str, Any]:
            """
            Analyze an exam question with subject and maximum marks, and generate suggested scoring rubrics,
            criteria breakdown, performance level matrix, examiner tips, and model answers.
            Args:
                question: The specific exam question or prompt to analyze.
                max_marks: The total maximum score/marks for the question (e.g. 5, 10, 15).
                subject: The academic subject (e.g. "Physics", "Computer Science", "Biology", "Mathematics").
            """
            state = tool_context.state if tool_context else {}
            subj = subject or state.get("subject_name") or "General Academic"
            chapter_title = state.get("chapter_title", "")

            rubric = self.gemini_service.generate_scoring_rubric(
                subject=subj,
                question=question,
                max_marks=float(max_marks) if max_marks else 10.0,
                chapter_title=chapter_title
            )

            if tool_context and hasattr(tool_context, "state"):
                tool_context.state["action_payload"] = {
                    "type": "rubric",
                    "rubric": rubric
                }

            return rubric

        return [
            search_chapter_content,
            explain_concept,
            create_practice_questions,
            get_exam_prep_summary,
            get_student_learning_profile,
            adjust_student_learning_pace,
            record_student_learning_note,
            generate_scoring_rubric,
            load_memory
        ]

    def _build_agent(self) -> Agent:
        """Constructs the LLM Agent instance with dynamic chapter context and personalized tutoring instructions."""

        def get_instruction(ctx: ReadonlyContext) -> str:
            state = ctx.state or {}
            chapter_title = state.get("chapter_title") or "General Subject Study"
            subject_name = state.get("subject_name") or "Academic Curriculum"
            difficulty = state.get("difficulty") or "Standard"
            chapter_summary = state.get("chapter_summary") or "Curriculum study and textbook review."
            key_topics = state.get("key_topics") or []
            if isinstance(key_topics, list):
                key_topics_str = ", ".join(key_topics) if key_topics else "Core concepts and problem solving"
            else:
                key_topics_str = str(key_topics)

            chapter_text_preview = state.get("chapter_text_preview") or ""
            student_name = state.get("student_name") or "Alex Rivera"
            rank_name = state.get("student_rank_name") or "Novice Explorer"
            rank_level = state.get("student_rank_level") or 1
            pace = state.get("preferred_pace") or "balanced"
            weak_spots = state.get("weak_spots") or []
            weak_spots_str = ", ".join(weak_spots) if weak_spots else "None identified yet"
            mastery = state.get("chapter_mastery", 0)

            return f"""You are the Personalized AI Learning Agent on Eduro, powered by Google ADK.
You are the dedicated, personal AI tutor for {student_name} for the active chapter: "{chapter_title}".

=== ACTIVE CHAPTER CONTEXT ===
- Subject: {subject_name}
- Chapter Title: "{chapter_title}" (Difficulty: {difficulty})
- Chapter Summary: {chapter_summary}
- Curriculum Key Topics: {key_topics_str}
- Student's Current Mastery in this Chapter: {mastery}%

=== TEXTBOOK REFERENCE EXCERPT ===
{chapter_text_preview[:3000] if chapter_text_preview else 'Call search_chapter_content to retrieve textbook sections and specific pages.'}

=== STUDENT PROFILE & ADAPTIVE CALIBRATION ===
- Student: {student_name}
- Current Level / Rank: Level {rank_level} ({rank_name})
- Learning Pace: {pace}
- Known Struggle Areas / Weak Spots: {weak_spots_str}

=== AGENT CAPABILITIES & BEHAVIORAL INSTRUCTIONS ===
1. GROUNDING IN THIS CHAPTER:
   - Always anchor your answers, analogies, examples, and questions specifically in "{chapter_title}".
   - When the student asks "Explain this", "Give me an analogy", "Summarize this chapter", "What are the key concepts?", or asks about a page/section, interpret "this" as referring directly to "{chapter_title}".
   - Use `search_chapter_content` to retrieve detailed textbook excerpts and page-specific details from the textbook PDF.

2. EXPLAIN TOPICS IN DIFFERENT WAYS (ADAPTIVE PEDAGOGY):
   - Adapt your tone and depth to the student's level ({rank_name}) and pace ({pace}).
   - Use vivid everyday analogies tailored to "{chapter_title}" when requested.
   - For simple intuitive explanations (ELI5), eliminate dense jargon and explain concepts using intuitive mental models.
   - For rigorous or mathematical queries, provide precise equations, definitions, and boundary conditions.
   - Use Socratic guidance: pose thoughtful questions to help the student reach the solution.
   - Use markdown formatting (bold terms, bullet points, formula code blocks).

3. CREATE ADAPTIVE PRACTICE QUESTIONS:
   - When the student asks for practice, test questions, or a quiz on "{chapter_title}", call `create_practice_questions`.
   - The questions should test the concepts in "{chapter_title}" calibrated to Level {rank_level}.

4. HELP WITH EXAM PREPARATION:
   - When asked about exams, tests, revision, or formulas for "{chapter_title}", call `get_exam_prep_summary`.
   - Highlight high-yield scoring keywords, formulas, and pitfalls specific to "{chapter_title}".

5. ADJUST TO STUDENT'S LEARNING PACE & LEVEL:
   - Check the student's profile with `get_student_learning_profile` or long-term memory with `load_memory`.
   - Recalibrate pace if requested using `adjust_student_learning_pace`.
   - Record newly discovered weak spots or student insights into memory using `record_student_learning_note`.

6. SUGGESTED SCORING RUBRICS & QUESTION ANALYSIS:
   - When a student asks for a scoring rubric, marking scheme, grading criteria, mark breakdown, or evaluation standards for a question with a given mark, call `generate_scoring_rubric`.
   - Provide the subject, maximum mark, and question to give structured, transparent criteria and model solutions.
"""

        model_name = os.environ.get("GEMINI_MODEL") or Config.MODEL_NAME
        # Prefer gemini-2.5-flash for speed and tool-calling compatibility
        if "3.7" in model_name:
            model_name = "gemini-2.5-flash"

        return Agent(
            name="eduro_personalized_tutor",
            model=model_name,
            instruction=get_instruction,
            tools=self.tools
        )

    def run_chat_turn(
        self,
        chapter_id: str,
        chapter_title: str,
        pdf_filename: str,
        user_message: str,
        session_id: str,
        student_id: str = "student_001",
        subject_name: str = "",
        chapter_summary: str = "",
        key_topics: Optional[List[str]] = None,
        difficulty: str = "Standard",
        chapter_text_preview: str = ""
    ) -> Dict[str, Any]:
        """
        Executes a single conversational turn with the Google ADK Agent.
        Returns the agent reply, tools called, memory state, and any interactive payloads.
        """
        profile = self.adaptive_engine.get_profile()
        rank = profile.get("rank", {})
        weak_spots = profile.get("weak_spots", [])
        preferred_pace = profile.get("preferred_pace", "balanced")
        chapter_mastery = profile.get("topic_mastery", {}).get(chapter_id, 0)

        # Ensure chapter_text_preview is available from the textbook PDF
        if not chapter_text_preview and pdf_filename:
            extracted = self.pdf_service.extract_text(pdf_filename)
            chapter_text_preview = extracted.get("full_text", "")[:3500]

        state_delta = {
            "chapter_id": chapter_id,
            "chapter_title": chapter_title,
            "subject_name": subject_name,
            "pdf_filename": pdf_filename,
            "chapter_summary": chapter_summary,
            "key_topics": key_topics or [],
            "difficulty": difficulty,
            "chapter_text_preview": chapter_text_preview,
            "student_id": student_id,
            "student_name": profile.get("name", "Alex Rivera"),
            "student_rank_name": rank.get("name", "Novice Explorer"),
            "student_rank_level": rank.get("rank_id", 1),
            "preferred_pace": preferred_pace,
            "weak_spots": weak_spots,
            "chapter_mastery": chapter_mastery,
            "action_payload": None
        }

        # Format user message content with explicit chapter context anchor
        context_prefix = f"[Active Study Context: Chapter \"{chapter_title}\" in {subject_name or 'Curriculum'}]\n"
        new_content = types.Content(
            role="user",
            parts=[types.Part(text=f"{context_prefix}{user_message}")]
        )

        tools_called = []
        reply_text = ""
        action_payload = None

        try:
            events = self.runner.run(
                user_id=student_id,
                session_id=session_id,
                new_message=new_content,
                state_delta=state_delta
            )

            for event in events:
                # Capture tool calls
                if hasattr(event, "content") and event.content and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, "function_call") and part.function_call:
                            fc = part.function_call
                            tools_called.append({
                                "id": getattr(fc, "id", f"call_{len(tools_called)}"),
                                "name": getattr(fc, "name", "unknown_tool"),
                                "args": getattr(fc, "args", {})
                            })
                        if hasattr(part, "function_response") and part.function_response:
                            fr = part.function_response
                            # Match with previous tool call to attach summary
                            name = getattr(fr, "name", "")
                            resp = getattr(fr, "response", {})
                            for tc in reversed(tools_called):
                                if tc["name"] == name and "result_summary" not in tc:
                                    tc["result_summary"] = str(resp)[:200]
                                    break
                        if hasattr(part, "text") and part.text:
                            reply_text += part.text

            # Check if an action payload was set in state
            try:
                import asyncio
                session = asyncio.run(self.session_service.get_session(
                    app_name=self.app_name,
                    user_id=student_id,
                    session_id=session_id
                ))
                if session and hasattr(session, "state"):
                    action_payload = session.state.get("action_payload")
            except Exception:
                pass

        except Exception as e:
            logger.warning(f"ADK Runner execution note: {e}. Generating fallback adaptive response.")
            return self._fallback_adk_turn(
                chapter_id=chapter_id,
                chapter_title=chapter_title,
                pdf_filename=pdf_filename,
                user_message=user_message,
                student_id=student_id,
                subject_name=subject_name,
                chapter_summary=chapter_summary,
                key_topics=key_topics
            )

        if not reply_text:
            reply_text = f"I've analyzed your question regarding **{chapter_title}** and grounded the response in your textbook material. How would you like to explore this further?"

        # Fetch latest student profile
        current_profile = self.adaptive_engine.get_profile()

        return {
            "reply": reply_text,
            "tools_called": tools_called,
            "memory_used": len(tools_called) > 0 or "memory" in [t["name"] for t in tools_called],
            "student_profile": current_profile,
            "action_payload": action_payload
        }

    def _fallback_adk_turn(
        self,
        chapter_id: str,
        chapter_title: str,
        pdf_filename: str,
        user_message: str,
        student_id: str,
        subject_name: str = "",
        chapter_summary: str = "",
        key_topics: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Graceful local fallback if cloud LLM encounters quota or connectivity constraints.
        Dynamically grounds all explanations, practice questions, and exam tips in the active chapter.
        """
        msg_lower = user_message.lower()
        profile = self.adaptive_engine.get_profile()
        rank = profile.get("rank", {})
        pace = profile.get("preferred_pace", "balanced")
        tools_called = []
        action_payload = None

        extracted = self.pdf_service.extract_text(pdf_filename) if pdf_filename else {}
        full_text = extracted.get("full_text", "")

        # 1. Check if user wants practice questions
        if any(w in msg_lower for w in ["practice", "quiz", "question", "test me"]):
            tools_called.append({
                "name": "create_practice_questions",
                "args": {"topic": chapter_title, "difficulty": rank.get("difficulty_label", "Foundational"), "count": 2},
                "result_summary": f"Generated 2 adaptive practice questions for {chapter_title}."
            })
            questions = self.gemini_service.generate_practice_questions(
                chapter_id=chapter_id,
                chapter_title=chapter_title,
                chapter_text=full_text,
                student_rank=rank,
                count=2
            )
            action_payload = {
                "type": "practice",
                "chapter_id": chapter_id,
                "chapter_title": chapter_title,
                "questions": questions
            }
            reply = (
                f"### 📝 Personalized Practice Quiz: {chapter_title}\n\n"
                f"I've generated **2 adaptive practice questions** calibrated for your **{rank.get('name', 'Novice')}** level "
                f"at a **{pace}** pace.\n\n"
                f"Topics evaluated: {', '.join(key_topics[:3]) if key_topics else chapter_title}.\n\n"
                f"You can review and answer them directly using the practice drawer card below!"
            )

        # 2. Check if user wants exam preparation
        elif any(w in msg_lower for w in ["exam", "prep", "cheat sheet", "pitfall", "trap", "formula", "revision"]):
            tools_called.append({
                "name": "get_exam_prep_summary",
                "args": {"focus_topic": chapter_title},
                "result_summary": f"Extracted key formulas, pitfall traps, and memory mnemonics for {chapter_title}."
            })
            prep_data = self.gemini_service.generate_exam_prep(
                chapter_title=chapter_title,
                chapter_text=full_text
            )
            action_payload = {
                "type": "exam_prep",
                "chapter_title": chapter_title,
                "prep_data": prep_data
            }
            cheat_items = prep_data.get("cheat_sheet", [])
            summary_bullet = cheat_items[0].get("summary") if cheat_items else (chapter_summary or "Master foundational definitions and problem-solving steps.")
            reply = (
                f"### 🎯 High-Yield Exam Preparation: {chapter_title}\n\n"
                f"I synthesized the critical exam formulas, marking points, and frequent pitfalls for **{chapter_title}** ({subject_name or 'Curriculum'}).\n\n"
                f"**Core Focus:** {summary_bullet}\n\n"
                f"Click the card below to open the complete interactive Exam Prep Sheet!"
            )

        # 3. Check if user wants pace adjustment
        elif any(w in msg_lower for w in ["pace", "slow down", "speed up", "casual", "intensive"]):
            new_pace = "casual" if "slow" in msg_lower or "casual" in msg_lower else "intensive"
            tools_called.append({
                "name": "adjust_student_learning_pace",
                "args": {"new_pace": new_pace, "reason": "Student requested pace recalibration."},
                "result_summary": f"Updated student pace from {pace} to {new_pace}."
            })
            profile["preferred_pace"] = new_pace
            self.adaptive_engine._save_profile(profile)
            action_payload = {
                "type": "pace_change",
                "old_pace": pace,
                "new_pace": new_pace
            }
            reply = (
                f"### ⏱️ Learning Pace Calibrated\n\n"
                f"I have adjusted your learning pace from **{pace.title()}** to **{new_pace.title()}**! "
                f"I will tailor the depth of future explanations and question cadence in **{chapter_title}** accordingly."
            )

        # 4. Check if user asks what agent remembers
        elif any(w in msg_lower for w in ["remember", "memory", "weakness", "struggle", "progress"]):
            tools_called.append({
                "name": "load_memory",
                "args": {"query": "student weaknesses and preferences"},
                "result_summary": f"Recalled {len(profile.get('weak_spots', []))} weak spots and {pace} pace."
            })
            weaknesses = profile.get("weak_spots", [])
            reply = (
                f"### 🧠 Student Memory Recall\n\n"
                f"Here is what I currently have in my learner memory for **{profile.get('name', 'Alex Rivera')}**:\n\n"
                f"- **Current Rank:** Level {rank.get('rank_id', 1)} ({rank.get('name', 'Novice Explorer')}) with **{profile.get('xp', 0)} XP**.\n"
                f"- **Current Pace:** **{pace.title()}**.\n"
                f"- **Chapter Mastery:** **{profile.get('topic_mastery', {}).get(chapter_id, 0)}%** in {chapter_title}.\n"
                f"- **Identified Focus Areas:** {', '.join(weaknesses) if weaknesses else 'Solid fundamentals recorded so far!'}\n\n"
                f"What concept in **{chapter_title}** would you like to explore next?"
            )

        # 5. Check if user wants a scoring rubric / marking scheme
        elif any(w in msg_lower for w in ["rubric", "marking scheme", "grading criteria", "scoring scheme", "mark breakdown", "marking rubric"]):
            import re
            marks_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:marks?|pts?|points?)', msg_lower)
            extracted_marks = float(marks_match.group(1)) if marks_match else 10.0

            clean_q = user_message
            for prefix_phrase in ["create a rubric for", "generate a rubric for", "scoring rubric for", "rubric for", "mark rubric for", "rubric:"]:
                if prefix_phrase in clean_q.lower():
                    clean_q = clean_q[clean_q.lower().find(prefix_phrase) + len(prefix_phrase):].strip(" :?")
                    break

            if not clean_q or len(clean_q) < 5:
                clean_q = f"Key comprehensive examination problem for {chapter_title}"

            rubric = self.gemini_service.generate_scoring_rubric(
                subject=subject_name or "Academic Curriculum",
                question=clean_q,
                max_marks=extracted_marks,
                chapter_title=chapter_title
            )
            tools_called.append({
                "name": "generate_scoring_rubric",
                "args": {"question": clean_q, "max_marks": extracted_marks, "subject": subject_name or "Academic Curriculum"},
                "result_summary": f"Generated {extracted_marks}-mark scoring rubric for '{clean_q[:40]}...' across {len(rubric.get('criteria', []))} criteria."
            })
            action_payload = {
                "type": "rubric",
                "rubric": rubric
            }
            reply = (
                f"### 📋 Suggested Scoring Rubric ({extracted_marks} Marks)\n\n"
                f"I've generated a comprehensive, criteria-based **Scoring Rubric** for this question in **{subject_name or chapter_title}**:\n\n"
                f"> *\"{clean_q}\"*\n\n"
                f"- **Total Marks:** {extracted_marks}\n"
                f"- **Cognitive Level:** {rubric.get('bloom_level', 'Application & Analysis')}\n"
                f"- **Criteria Count:** {len(rubric.get('criteria', []))} marking bands\n\n"
                f"Review the full criteria breakdown, performance level matrix, and ideal model solution in the rubric panel below!"
            )

        # 6. Default: Personalized explanation with grounded textbook search
        else:
            tools_called.append({
                "name": "search_chapter_content",
                "args": {"query": user_message},
                "result_summary": f"Retrieved textbook context from {pdf_filename or chapter_id}."
            })
            tools_called.append({
                "name": "get_student_learning_profile",
                "args": {},
                "result_summary": f"Rank: {rank.get('name')}, Pace: {pace}."
            })

            # Check if student asked for specific page
            import re
            page_match = re.search(r'\bpage\s*(\d+)\b', msg_lower)
            page_context_str = ""
            if page_match and extracted.get("pages"):
                req_page = int(page_match.group(1))
                for p in extracted.get("pages", []):
                    if p.get("page_num") == req_page:
                        page_context_str = f"\n\n**Page {req_page} Key Insights:**\n{p.get('text')[:600]}...\n"
                        break

            # Build intelligent, subject-tailored explanation for the active chapter
            topics_summary = ", ".join(key_topics[:4]) if key_topics else "the foundational principles of this topic"
            summary_text = chapter_summary or (full_text[:400] if full_text else f"Understanding the core mechanisms of {chapter_title}.")

            is_analogy = "analogy" in msg_lower
            is_eli5 = "eli5" in msg_lower or "5" in msg_lower or "simple" in msg_lower

            if is_analogy:
                # Custom analogy anchored in this chapter
                if "bio" in chapter_id or "respiration" in chapter_title.lower() or "dna" in chapter_title.lower():
                    analogy_body = (
                        f"Think of **{chapter_title}** like an **Automated High-Efficiency Power Plant**:\n"
                        f"- The incoming nutrients (like glucose) are raw fuel supplies delivered to the refinery.\n"
                        f"- The biochemical stages process and strip electrons step-by-step, transferring power across carrier molecules.\n"
                        f"- The gradient acts like a hydroelectric dam, allowing synthase turbines to generate universal cellular currency (ATP)!\n\n"
                        f"**Key Rule for your level ({rank.get('name', 'Novice Explorer')}):** Energy is neither created nor destroyed, but systematically converted into transportable packets."
                    )
                elif "cs" in chapter_id or "tree" in chapter_title.lower() or "algorithm" in chapter_title.lower() or "os" in chapter_title.lower():
                    analogy_body = (
                        f"Think of **{chapter_title}** like an **Organized Hierarchical Library System**:\n"
                        f"- Data elements are placed with strict invariants (e.g. smaller keys to the left, larger to the right) so every query eliminates half the remaining shelves.\n"
                        f"- Balancing acts like a librarian reorganizing crowded aisles to ensure no path takes more than logarithmic steps to navigate!\n\n"
                        f"**Key Rule for your level ({rank.get('name', 'Novice Explorer')}):** Structure dictates performance—well-balanced models prevent worst-case linear bottlenecks."
                    )
                elif "math" in chapter_id or "calculus" in chapter_title.lower() or "linear" in chapter_title.lower():
                    analogy_body = (
                        f"Think of **{chapter_title}** like a **High-Resolution Drone Tracking Real-Time Motion**:\n"
                        f"- The function represents the drone's position over time.\n"
                        f"- Examining infinitesimally small intervals lets us zoom in until a curved path looks completely straight, revealing instantaneous rate of change!\n\n"
                        f"**Key Rule for your level ({rank.get('name', 'Novice Explorer')}):** Continuous change can be captured analytically by examining limits and linear approximations."
                    )
                else:
                    analogy_body = (
                        f"Think of **{chapter_title}** like a **Well-Calibrated System of Interlocking Gears**:\n"
                        f"- Each concept ({topics_summary}) meshes directly with the next to ensure equilibrium and consistent behavior.\n"
                        f"- When an external input is applied, the system responds predictably according to fundamental governing laws.\n\n"
                        f"**Takeaway:** Isolate the individual components first, then trace how energy and states flow between them."
                    )
            elif is_eli5:
                analogy_body = (
                    f"Let's break down **{chapter_title}** into 3 simple, intuitive pieces:\n"
                    f"1. **The Big Idea:** {summary_text}\n"
                    f"2. **Why it matters:** It gives us the exact rules to predict how systems in {subject_name or 'this field'} behave.\n"
                    f"3. **What to remember:** Focus on the main topics: **{topics_summary}**.\n\n"
                    f"You don't need complicated jargon—just remember that each step builds on the previous one!"
                )
            else:
                analogy_body = (
                    f"In this chapter on **{chapter_title}**, we focus on:\n"
                    f"- **Core Overview:** {summary_text}\n"
                    f"- **Key Curriculum Topics:** {topics_summary}.\n"
                    f"- **Textbook Anchor:** Verified against the assigned reading ({pdf_filename or 'Textbook PDF'}).\n"
                    f"{page_context_str}\n"
                    f"**Next Step:** Would you like me to create an adaptive practice question on this, or walk through a specific formula step-by-step?"
                )

            reply = (
                f"### 💡 Personalized Learning Guidance: {chapter_title}\n\n"
                f"{analogy_body}"
            )

        return {
            "reply": reply,
            "tools_called": tools_called,
            "memory_used": True,
            "student_profile": self.adaptive_engine.get_profile(),
            "action_payload": action_payload
        }

    def get_memory_summary(self, student_id: str = "student_001") -> Dict[str, Any]:
        """Returns the current student memory state."""
        profile = self.adaptive_engine.get_profile()
        return {
            "student_id": student_id,
            "student_name": profile.get("name"),
            "rank": profile.get("rank"),
            "preferred_pace": profile.get("preferred_pace"),
            "weak_spots": profile.get("weak_spots", []),
            "topic_mastery": profile.get("topic_mastery", {}),
            "app_name": self.app_name
        }

    def reset_session(self, session_id: str):
        """Resets the conversation session in InMemorySessionService."""
        # InMemorySessionService stores sessions in self.sessions or creates on demand
        try:
            if hasattr(self.session_service, "sessions") and session_id in self.session_service.sessions:
                del self.session_service.sessions[session_id]
        except Exception as e:
            logger.info(f"Session reset note: {e}")
