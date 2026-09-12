from dataclasses import dataclass, field
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from .llm import llm_service
except ImportError:
    from llm import llm_service

app = FastAPI(title="StudyPilot API")

MAX_AGENT_STEPS = 8
WEAK_TOPIC_THRESHOLD = 0.7
APPROVED_TOOLS = {
    "create_study_plan",
    "generate_diagnostic_quiz",
    "evaluate_quiz",
    "identify_weak_topics",
    "adapt_study_plan",
    "generate_targeted_practice",
    "evaluate_practice",
    "update_progress",
    "get_progress",
    "get_topic_explanation",
}


class StudyGoalRequest(BaseModel):
    goal: str = Field(min_length=3, max_length=200)
    days: int = Field(ge=1, le=365)
    hours_per_day: float = Field(gt=0, le=24)


class PlanItem(BaseModel):
    topic: str
    title: str
    minutes: int = Field(gt=0)
    status: str = "planned"
    reason: str = ""


class QuizQuestion(BaseModel):
    id: str
    topic: str
    prompt: str
    options: list[str]
    difficulty: str = "medium"


class QuizAnswer(BaseModel):
    question_id: str
    answer_index: int = Field(ge=0)


class SubmitQuizRequest(BaseModel):
    answers: list[QuizAnswer] = Field(min_length=1)


class PracticeAnswer(BaseModel):
    practice_id: str
    answer_index: int = Field(ge=0)


class SubmitPracticeRequest(BaseModel):
    answers: list[PracticeAnswer] = Field(min_length=1)


class TopicResult(BaseModel):
    topic: str
    correct: int
    total: int
    score: float


class QuestionResult(BaseModel):
    question_id: str
    topic: str
    correct: bool
    expected_answer: int
    submitted_answer: int | None


class PracticeItem(BaseModel):
    id: str
    topic: str
    question: str
    prompt: str = ""
    question_type: str = "multiple_choice"
    options: list[str] = Field(default_factory=list)
    objective: str
    difficulty: str = "medium"
    task_type: str = "short answer"


class TopicExplanation(BaseModel):
    topic: str
    title: str = ""
    simple_explanation: str = ""
    concrete_example: str = ""
    common_misconception: str = ""
    key_takeaways: list[str] = Field(default_factory=list)
    recommended_next_practice: str = ""
    what_it_means: str
    key_concepts: list[str]
    simple_example: str
    common_mistake: str
    next_step: str


class AgentDecision(BaseModel):
    step: int
    decision: str
    tool: str
    observation: str


class ProgressResponse(BaseModel):
    session_id: str
    status: str
    completed_steps: list[str]
    weak_topics: list[str]
    overall_score: float | None
    next_action: str
    practice_score: float | None = None
    topic_status: dict[str, str] = Field(default_factory=dict)
    practice_history: list[dict] = Field(default_factory=list)


class SessionResponse(BaseModel):
    session_id: str
    goal: StudyGoalRequest
    study_plan: list[PlanItem]
    diagnostic_quiz: list[QuizQuestion]
    progress: ProgressResponse
    agent_decisions: list[AgentDecision]
    subject: str = ""
    ai_mode: str = "fallback"


class EvaluationResponse(BaseModel):
    session_id: str
    question_results: list[QuestionResult]
    topic_results: list[TopicResult]
    overall_score: float
    weak_topics: list[str]
    adapted_plan: list[PlanItem]
    targeted_practice: list[PracticeItem]
    progress: ProgressResponse
    agent_decisions: list[AgentDecision]
    topic_explanations: list[TopicExplanation] = Field(default_factory=list)
    subject: str = ""
    ai_mode: str = "fallback"


class PracticeQuestionResult(BaseModel):
    practice_id: str
    topic: str
    correct: bool
    submitted_answer: int | None
    explanation: str


class PracticeEvaluationResponse(BaseModel):
    session_id: str
    results: list[PracticeQuestionResult]
    score: float
    topic: str
    previous_score: float | None
    topic_status: str
    adapted_plan: list[PlanItem]
    progress: ProgressResponse
    next_action: str
    agent_decisions: list[AgentDecision]


@dataclass
class SessionState:
    session_id: str
    goal: StudyGoalRequest
    study_plan: list[PlanItem]
    diagnostic_quiz: list[QuizQuestion]
    internal_answers: dict[str, int]
    subject: str = ""
    ai_mode: str = "fallback"
    weak_topics: list[str] = field(default_factory=list)
    overall_score: float | None = None
    targeted_practice: list[PracticeItem] = field(default_factory=list)
    completed_steps: list[str] = field(default_factory=lambda: ["goal", "plan", "diagnostic"])
    next_action: str = "Complete the diagnostic quiz."
    decisions: list[AgentDecision] = field(default_factory=list)
    tool_calls: int = 0
    topic_explanations: list[TopicExplanation] = field(default_factory=list)
    practice_answers: dict[str, int] = field(default_factory=dict)
    practice_explanations: dict[str, str] = field(default_factory=dict)
    practice_score: float | None = None
    topic_status: dict[str, str] = field(default_factory=dict)
    practice_history: list[dict] = field(default_factory=list)
    practice_tool_calls: int = 0


sessions: dict[str, SessionState] = {}


def _require_step(session: SessionState, step: str) -> None:
    if session.tool_calls >= MAX_AGENT_STEPS:
        raise HTTPException(status_code=409, detail="Agent step limit reached for this session.")
    session.tool_calls += 1
    session.decisions.append(
        AgentDecision(
            step=session.tool_calls,
            decision=step,
            tool="pending",
            observation="Tool execution started.",
        )
    )


def _record_tool(session: SessionState, tool: str, observation: str) -> None:
    session.decisions[-1].tool = tool
    session.decisions[-1].observation = observation


def _fallback_subject(goal: str) -> str:
    cleaned = goal.lower()
    for marker in (" exam", " test", " assessment", " certification"):
        if marker in cleaned:
            cleaned = cleaned.split(marker, 1)[0]
    for prefix in ("i have a ", "i have an ", "i need to learn ", "learn "):
        cleaned = cleaned.replace(prefix, "")
    return " ".join(cleaned.split()).strip(" .") or "the requested subject"


def _fallback_topics(subject: str) -> list[str]:
    return [
        f"{subject} foundations",
        f"{subject} core concepts",
        f"{subject} problem solving",
        f"{subject} applied practice",
    ]


def _plan_schema() -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "subject": {"type": "string"},
            "plan": {"type": "array", "minItems": 4, "maxItems": 6, "items": {"type": "object", "additionalProperties": False, "properties": {"topic": {"type": "string"}, "title": {"type": "string"}, "minutes": {"type": "integer"}, "reason": {"type": "string"}}, "required": ["topic", "title", "minutes", "reason"]}},
            "quiz": {"type": "array", "minItems": 4, "maxItems": 4, "items": {"type": "object", "additionalProperties": False, "properties": {"topic": {"type": "string"}, "prompt": {"type": "string"}, "options": {"type": "array", "minItems": 3, "maxItems": 4, "items": {"type": "string"}}, "correct_answer": {"type": "integer"}, "difficulty": {"type": "string"}}, "required": ["topic", "prompt", "options", "correct_answer", "difficulty"]}},
        },
        "required": ["subject", "plan", "quiz"],
    }


def _adaptation_schema() -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "adapted_plan": {"type": "array", "items": {"type": "object", "additionalProperties": False, "properties": {"topic": {"type": "string"}, "title": {"type": "string"}, "minutes": {"type": "integer"}, "reason": {"type": "string"}}, "required": ["topic", "title", "minutes", "reason"]}},
            "practice": {"type": "array", "minItems": 2, "maxItems": 3, "items": {"type": "object", "additionalProperties": False, "properties": {"topic": {"type": "string"}, "question": {"type": "string"}, "question_type": {"type": "string"}, "options": {"type": "array", "minItems": 3, "maxItems": 4, "items": {"type": "string"}}, "correct_answer": {"type": "integer"}, "explanation": {"type": "string"}, "objective": {"type": "string"}, "difficulty": {"type": "string"}, "task_type": {"type": "string"}}, "required": ["topic", "question", "question_type", "options", "correct_answer", "explanation", "objective", "difficulty", "task_type"]}},
            "explanations": {"type": "array", "items": {"type": "object", "additionalProperties": False, "properties": {"topic": {"type": "string"}, "what_it_means": {"type": "string"}, "key_concepts": {"type": "array", "items": {"type": "string"}}, "simple_example": {"type": "string"}, "common_mistake": {"type": "string"}, "next_step": {"type": "string"}}, "required": ["topic", "what_it_means", "key_concepts", "simple_example", "common_mistake", "next_step"]}},
        },
        "required": ["adapted_plan", "practice", "explanations"],
    }


def _normalize_plan(items: list[dict], total_minutes: int) -> list[PlanItem]:
    if not items:
        return []
    bounded = [{**item, "minutes": max(5, int(item.get("minutes", 5)))} for item in items[:6]]
    total = sum(item["minutes"] for item in bounded)
    scale = total_minutes / total if total > total_minutes else 1
    normalized = []
    for item in bounded:
        normalized.append(PlanItem(topic=str(item["topic"]), title=str(item["title"]), minutes=max(5, int(item["minutes"] * scale)), reason=str(item.get("reason", "Scheduled for focused review."))))
    difference = total_minutes - sum(item.minutes for item in normalized)
    normalized[-1] = normalized[-1].model_copy(update={"minutes": max(5, normalized[-1].minutes + difference)})
    return normalized


def create_study_plan(goal: StudyGoalRequest, generated: list[dict] | None = None) -> list[PlanItem]:
    total_minutes = max(30, int(goal.days * goal.hours_per_day * 60))
    if generated:
        return _normalize_plan(generated, total_minutes)
    subject = _fallback_subject(goal.goal)
    topics = _fallback_topics(subject)
    minutes_per_topic = max(5, total_minutes // len(topics))
    return [PlanItem(topic=topic, title=f"Study {topic}", minutes=minutes_per_topic, reason="A compact foundation-to-application sequence for the stated goal.") for topic in topics]


def generate_diagnostic_quiz(goal: StudyGoalRequest, plan: list[PlanItem], generated: list[dict] | None = None) -> tuple[list[QuizQuestion], dict[str, int]]:
    questions: list[QuizQuestion] = []
    answers: dict[str, int] = {}
    if generated and len(generated) >= 4:
        for index, item in enumerate(generated[:4]):
            question_id = f"q{index + 1}"
            options = [str(option) for option in item.get("options", [])]
            if len(options) >= 3 and 0 <= int(item.get("correct_answer", 0)) < len(options):
                questions.append(QuizQuestion(id=question_id, topic=str(item["topic"]), prompt=str(item["prompt"]), options=options, difficulty=str(item.get("difficulty", "medium"))))
                answers[question_id] = int(item["correct_answer"])
        if len(questions) == 4:
            return questions, answers
    prompts = [
        "Which statement best describes the core idea of this topic?",
        "Which action is most useful when applying this topic?",
    ]
    for index, item in enumerate(plan):
        question_id = f"q{index + 1}"
        correct_index = index % 3
        questions.append(
            QuizQuestion(
                id=question_id,
                topic=item.topic,
                prompt=f"{prompts[index % len(prompts)]} ({item.topic})",
                options=[
                    f"A practical explanation of {item.topic}",
                    "A result unrelated to the learning goal",
                    "A memorized answer without context",
                ],
                difficulty="medium",
            )
        )
        answers[question_id] = correct_index
    return questions, answers


def evaluate_quiz(
    quiz: list[QuizQuestion],
    correct_answers: dict[str, int],
    submitted_answers: list[QuizAnswer],
) -> tuple[list[QuestionResult], list[TopicResult], float]:
    submitted = {answer.question_id: answer.answer_index for answer in submitted_answers}
    question_results: list[QuestionResult] = []
    topic_totals: dict[str, list[int]] = {}
    for question in quiz:
        expected = correct_answers[question.id]
        answer = submitted.get(question.id)
        is_correct = answer == expected
        question_results.append(
            QuestionResult(
                question_id=question.id,
                topic=question.topic,
                correct=is_correct,
                expected_answer=expected,
                submitted_answer=answer,
            )
        )
        topic_totals.setdefault(question.topic, [0, 0])
        topic_totals[question.topic][1] += 1
        if is_correct:
            topic_totals[question.topic][0] += 1

    topic_results = [
        TopicResult(topic=topic, correct=values[0], total=values[1], score=round(values[0] / values[1], 2))
        for topic, values in topic_totals.items()
    ]
    overall_score = round(sum(result.correct for result in question_results) / len(quiz), 2)
    return question_results, topic_results, overall_score


def identify_weak_topics(topic_results: list[TopicResult]) -> list[str]:
    return [result.topic for result in topic_results if result.score < WEAK_TOPIC_THRESHOLD]


def adapt_study_plan(plan: list[PlanItem], weak_topics: list[str], total_minutes: int) -> list[PlanItem]:
    if not plan:
        return []
    priority_minutes = max(5, total_minutes // max(1, len(weak_topics) * 2))
    review_minutes = max(5, (total_minutes - priority_minutes * len(weak_topics)) // max(1, len(plan) - len(weak_topics)))
    adapted: list[PlanItem] = []
    for item in plan:
        if item.topic in weak_topics:
            adapted.append(item.model_copy(update={"title": f"Focus sprint: {item.topic}", "minutes": priority_minutes, "status": "priority"}))
        else:
            adapted.append(item.model_copy(update={"status": "review", "minutes": review_minutes}))
    difference = total_minutes - sum(item.minutes for item in adapted)
    adapted[-1] = adapted[-1].model_copy(update={"minutes": max(5, adapted[-1].minutes + difference)})
    return adapted


def generate_targeted_practice(weak_topics: list[str], generated: list[dict] | None = None) -> tuple[list[PracticeItem], dict[str, int], dict[str, str]]:
    topic_set = set(weak_topics)
    if generated:
        items: list[PracticeItem] = []
        answers: dict[str, int] = {}
        explanations: dict[str, str] = {}
        for index, item in enumerate(generated[:3]):
            if item.get("topic") not in topic_set:
                continue
            practice_id = f"practice-{index + 1}"
            options = [str(option) for option in item.get("options", [])]
            correct_answer = int(item.get("correct_answer", 0))
            if len(options) < 3 or not 0 <= correct_answer < len(options):
                continue
            items.append(PracticeItem(id=practice_id, topic=str(item["topic"]), question=str(item["question"]), prompt=str(item["question"]), question_type=str(item.get("question_type", "multiple_choice")), options=options, objective=str(item["objective"]), difficulty=str(item.get("difficulty", "medium")), task_type=str(item.get("task_type", "multiple choice"))))
            answers[practice_id] = correct_answer
            explanations[practice_id] = str(item.get("explanation", "Review the concept and try a similar example."))
        if items:
            return items, answers, explanations
    items = []
    answers = {}
    explanations = {}
    for index, topic in enumerate(weak_topics[:2]):
        practice_id = f"practice-{index + 1}"
        items.append(PracticeItem(id=practice_id, topic=topic, question=f"Which choice best applies the core idea of {topic}?", prompt=f"Which choice best applies the core idea of {topic}?", options=[f"A correct application of {topic}", f"A misconception about {topic}", "An unrelated answer"], objective=f"Apply the core idea of {topic}.", difficulty="medium", task_type="multiple choice"))
        answers[practice_id] = 0
        explanations[practice_id] = f"The first choice applies the core idea of {topic}; the other choices do not address the topic directly."
    return items, answers, explanations


def get_topic_explanation(topic: str, generated: dict | None = None) -> TopicExplanation:
    if generated:
        what_it_means = str(generated.get("what_it_means", "A focused concept from the diagnostic."))
        next_step = str(generated.get("next_step", f"Practice {topic}."))
        return TopicExplanation(topic=topic, title=str(generated.get("title", topic)), simple_explanation=what_it_means, concrete_example=str(generated.get("simple_example", "Apply the concept to one representative problem.")), common_misconception=str(generated.get("common_mistake", "Skipping the underlying definition.")), key_takeaways=[str(item) for item in generated.get("key_concepts", [])][:4], recommended_next_practice=next_step, what_it_means=what_it_means, key_concepts=[str(item) for item in generated.get("key_concepts", [])], simple_example=str(generated.get("simple_example", "Apply the concept to one representative problem.")), common_mistake=str(generated.get("common_mistake", "Skipping the underlying definition.")), next_step=next_step)
    text = f"A focused concept from the {topic} diagnostic."
    next_step = f"Complete a focused practice item for {topic}."
    return TopicExplanation(topic=topic, title=topic, simple_explanation=text, concrete_example=f"Apply {topic} to one representative problem.", common_misconception="Memorizing a result without checking the underlying concept.", key_takeaways=[f"Core ideas in {topic}", f"Applying {topic}"], recommended_next_practice=next_step, what_it_means=text, key_concepts=[f"Core ideas in {topic}", f"Applying {topic}"], simple_example=f"Apply {topic} to one representative problem.", common_mistake="Memorizing a result without checking the underlying concept.", next_step=next_step)


def _execute_approved_tool(tool_name: str, operation):
    if tool_name not in APPROVED_TOOLS:
        raise ValueError(f"Unknown StudyPilot tool: {tool_name}")
    return operation()


def _generate_initial_materials(goal: StudyGoalRequest) -> tuple[str, list[PlanItem], list[QuizQuestion], dict[str, int], str]:
    instruction = f"Create a personalized study roadmap and exactly four diagnostic questions for this student goal: {goal.goal}. They have {goal.days} days and {goal.hours_per_day} hours per day. Cover distinct, important topics for the actual subject. Total plan minutes must fit the available time."
    generated = llm_service.generate_json(instruction, "study_material", _plan_schema())
    if generated:
        plan = create_study_plan(goal, generated.get("plan"))
        quiz, answers = generate_diagnostic_quiz(goal, plan, generated.get("quiz"))
        if len(plan) >= 4 and len(quiz) == 4:
            return str(generated.get("subject") or _fallback_subject(goal.goal)), plan, quiz, answers, "ai"
    plan = create_study_plan(goal)
    quiz, answers = generate_diagnostic_quiz(goal, plan)
    return _fallback_subject(goal.goal), plan, quiz, answers, "fallback"


def _generate_adaptive_materials(session: SessionState, topic_results: list[TopicResult]) -> tuple[list[PlanItem], list[PracticeItem], list[TopicExplanation], dict[str, int], dict[str, str], str]:
    total_minutes = max(30, int(session.goal.days * session.goal.hours_per_day * 60))
    weak_topics = session.weak_topics
    instruction = f"Student goal: {session.goal.goal}. Subject: {session.subject}. Initial plan: {[item.model_dump() for item in session.study_plan]}. Diagnostic results: {[item.model_dump() for item in topic_results]}. Weak topics: {weak_topics}. Return concise targeted practice and explanations."
    generated = llm_service.generate_json(instruction, "adaptive_material", _adaptation_schema())
    practice, practice_answers, practice_explanations = generate_targeted_practice(weak_topics, generated.get("practice") if generated else None)
    explanations = [get_topic_explanation(topic, next((item for item in (generated or {}).get("explanations", []) if item.get("topic") == topic), None)) for topic in weak_topics]
    generated_plan = (generated or {}).get("adapted_plan", [])
    original_topics = {item.topic for item in session.study_plan}
    if generated_plan and {str(item.get("topic")) for item in generated_plan} == original_topics:
        adapted = _normalize_plan(generated_plan, total_minutes)
        adapted = [item.model_copy(update={"status": "priority" if item.topic in weak_topics else "review"}) for item in adapted]
    else:
        adapted = adapt_study_plan(session.study_plan, weak_topics, total_minutes)
    return adapted, practice, explanations, practice_answers, practice_explanations, "ai" if generated else "fallback"


def update_progress(session: SessionState, completed_step: str, next_action: str) -> ProgressResponse:
    if completed_step not in session.completed_steps:
        session.completed_steps.append(completed_step)
    session.next_action = next_action
    return get_progress(session)


def get_progress(session: SessionState) -> ProgressResponse:
    return ProgressResponse(
        session_id=session.session_id,
        status="active" if session.overall_score is None else "diagnostic_evaluated",
        completed_steps=session.completed_steps,
        weak_topics=session.weak_topics,
        overall_score=session.overall_score,
        next_action=session.next_action,
        practice_score=session.practice_score,
        topic_status=session.topic_status,
        practice_history=session.practice_history,
    )


def _session_or_404(session_id: str) -> SessionState:
    session = sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found.")
    return session


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/sessions", response_model=SessionResponse, status_code=201)
def start_session(request: StudyGoalRequest) -> SessionResponse:
    session_id = str(uuid4())
    subject, plan, quiz, answers, ai_mode = _generate_initial_materials(request)
    session = SessionState(
        session_id=session_id,
        goal=request,
        study_plan=plan,
        diagnostic_quiz=quiz,
        internal_answers=answers,
        subject=subject,
        ai_mode=ai_mode,
    )
    session.tool_calls = 2
    session.decisions = [
        AgentDecision(step=1, decision="Understand the student's goal and build a personalized plan.", tool="create_study_plan", observation=f"Mapped {len(plan)} topics for {subject}."),
        AgentDecision(step=2, decision="Generate a subject-relevant diagnostic before adapting the plan.", tool="generate_diagnostic_quiz", observation=f"Generated {len(quiz)} questions."),
    ]
    sessions[session_id] = session
    return SessionResponse(
        session_id=session_id,
        goal=session.goal,
        study_plan=session.study_plan,
        diagnostic_quiz=session.diagnostic_quiz,
        progress=get_progress(session),
        agent_decisions=session.decisions,
        subject=session.subject,
        ai_mode=session.ai_mode,
    )


@app.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(session_id: str) -> SessionResponse:
    session = _session_or_404(session_id)
    return SessionResponse(
        session_id=session.session_id,
        goal=session.goal,
        study_plan=session.study_plan,
        diagnostic_quiz=session.diagnostic_quiz,
        progress=get_progress(session),
        agent_decisions=session.decisions,
        subject=session.subject,
        ai_mode=session.ai_mode,
    )


@app.post("/sessions/{session_id}/diagnostic/submit", response_model=EvaluationResponse)
def submit_diagnostic(session_id: str, request: SubmitQuizRequest) -> EvaluationResponse:
    session = _session_or_404(session_id)
    if session.overall_score is not None:
        raise HTTPException(status_code=409, detail="Diagnostic quiz has already been evaluated.")
    valid_ids = {question.id for question in session.diagnostic_quiz}
    submitted_ids = {answer.question_id for answer in request.answers}
    if not submitted_ids.issubset(valid_ids):
        raise HTTPException(status_code=422, detail="Answers contain an unknown question id.")
    if len(submitted_ids) != len(request.answers):
        raise HTTPException(status_code=422, detail="Each question may only be answered once.")

    _require_step(session, "Evaluate the diagnostic answers.")
    question_results, topic_results, overall_score = evaluate_quiz(session.diagnostic_quiz, session.internal_answers, request.answers)
    _record_tool(session, "evaluate_quiz", f"Scored {round(overall_score * 100)}% overall.")

    _require_step(session, "Identify weak topics from topic scores.")
    session.weak_topics = identify_weak_topics(topic_results)
    _record_tool(session, "identify_weak_topics", f"Found {len(session.weak_topics)} weak topics.")

    _require_step(session, "Explain the weak topics before changing the plan.")
    _record_tool(session, "get_topic_explanation", f"Prepared concise explanations for {len(session.weak_topics)} weak topics.")

    _require_step(session, "Adapt the study plan to the weak topics.")
    session.study_plan, session.targeted_practice, session.topic_explanations, session.practice_answers, session.practice_explanations, adaptation_mode = _generate_adaptive_materials(session, topic_results)
    session.ai_mode = "ai" if session.ai_mode == "ai" or adaptation_mode == "ai" else "fallback"
    _record_tool(session, "adapt_study_plan", "Reallocated the available study time toward diagnostic weaknesses.")

    _require_step(session, "Generate targeted practice for the weakest areas.")
    _record_tool(session, "generate_targeted_practice", f"Created {len(session.targeted_practice)} practice items.")

    session.overall_score = overall_score
    progress = update_progress(session, "evaluation", "Start targeted practice for the weakest topic.")
    _require_step(session, "Store progress and recommend the next action.")
    _record_tool(session, "update_progress", "Saved evaluation, weak topics, and next action in memory.")
    return EvaluationResponse(
        session_id=session.session_id,
        question_results=question_results,
        topic_results=topic_results,
        overall_score=overall_score,
        weak_topics=session.weak_topics,
        adapted_plan=session.study_plan,
        targeted_practice=session.targeted_practice,
        progress=progress,
        agent_decisions=session.decisions,
        topic_explanations=session.topic_explanations,
        subject=session.subject,
        ai_mode=session.ai_mode,
    )


@app.get("/sessions/{session_id}/progress", response_model=ProgressResponse)
def session_progress(session_id: str) -> ProgressResponse:
    return get_progress(_session_or_404(session_id))


@app.get("/sessions/{session_id}/practice", response_model=list[PracticeItem])
def targeted_practice(session_id: str) -> list[PracticeItem]:
    session = _session_or_404(session_id)
    if session.overall_score is None:
        raise HTTPException(status_code=409, detail="Evaluate the diagnostic before requesting targeted practice.")
    return session.targeted_practice


@app.post("/sessions/{session_id}/practice/submit", response_model=PracticeEvaluationResponse)
def submit_practice(session_id: str, request: SubmitPracticeRequest) -> PracticeEvaluationResponse:
    session = _session_or_404(session_id)
    if not session.targeted_practice:
        raise HTTPException(status_code=409, detail="No targeted practice is available for this session.")
    if session.practice_tool_calls >= MAX_AGENT_STEPS:
        raise HTTPException(status_code=409, detail="Practice agent step limit reached for this session.")
    valid_ids = {item.id for item in session.targeted_practice}
    submitted_ids = {answer.practice_id for answer in request.answers}
    if not submitted_ids.issubset(valid_ids) or len(submitted_ids) != len(request.answers):
        raise HTTPException(status_code=422, detail="Practice answers contain an unknown or duplicate question id.")

    session.practice_tool_calls += 1
    topic = session.targeted_practice[0].topic
    previous_score = session.practice_score
    results = []
    correct_count = 0
    for item in session.targeted_practice:
        submitted = next((answer.answer_index for answer in request.answers if answer.practice_id == item.id), None)
        correct = submitted == session.practice_answers.get(item.id)
        correct_count += int(correct)
        results.append(PracticeQuestionResult(practice_id=item.id, topic=item.topic, correct=correct, submitted_answer=submitted, explanation=session.practice_explanations.get(item.id, "Review the concept and try a similar example.")))
    score = round(correct_count / len(session.targeted_practice), 2)
    session.practice_score = score
    if score >= 0.8:
        status = "strong"
        next_action = "Move to the next highest-priority topic."
    elif previous_score is not None and score > previous_score:
        status = "improving"
        next_action = f"Retry {topic} with one more focused practice set."
    else:
        status = "still weak"
        next_action = f"Review the explanation and retry {topic} with easier practice."
    session.topic_status[topic] = status
    session.practice_history.append({"topic": topic, "score": score, "previous_score": previous_score, "status": status})
    session.next_action = next_action
    session.completed_steps = list(dict.fromkeys(session.completed_steps + ["practice", "practice_evaluation", "progress"]))
    session.decisions.append(AgentDecision(step=session.practice_tool_calls, decision="Evaluate targeted practice and choose the next action.", tool="evaluate_practice", observation=f"{correct_count}/{len(session.targeted_practice)} correct; topic is {status}."))
    return PracticeEvaluationResponse(session_id=session.session_id, results=results, score=score, topic=topic, previous_score=previous_score, topic_status=status, adapted_plan=session.study_plan, progress=get_progress(session), next_action=next_action, agent_decisions=session.decisions)


@app.get("/sessions/{session_id}/topics/{topic}/explanation", response_model=TopicExplanation)
def topic_explanation(session_id: str, topic: str) -> TopicExplanation:
    session = _session_or_404(session_id)
    for explanation in session.topic_explanations:
        if explanation.topic == topic:
            return explanation
    if topic not in session.weak_topics:
        raise HTTPException(status_code=404, detail="Topic explanation is not available for this session.")
    return get_topic_explanation(topic)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
