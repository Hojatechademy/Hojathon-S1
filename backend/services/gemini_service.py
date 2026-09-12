import os
import json
import logging
from config import Config, check_adc_credentials

logger = logging.getLogger("gemini-service")

class GeminiService:
    def __init__(self):
        self.model = None
        self.adc_active, self.project_id, self.adc_status_msg = check_adc_credentials()
        self._init_vertex_ai()

    def _init_vertex_ai(self):
        if not self.adc_active:
            logger.info("ADC not active yet. Mock/fallback responder will be available until ADC is authenticated.")
            return

        # Try latest google.genai SDK first
        try:
            from google import genai
            self.genai_client = genai.Client(vertexai=True, project=self.project_id, location=Config.LOCATION)
            logger.info(f"Initialized google.genai Client (Vertex AI mode) for project: {self.project_id}")
            return
        except Exception as e1:
            logger.info(f"google.genai client initialization note: {e1}")

        # Fallback to vertexai SDK
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
            vertexai.init(project=self.project_id, location=Config.LOCATION)
            self.model = GenerativeModel(Config.MODEL_NAME)
            logger.info(f"Vertex AI initialized with GenerativeModel: {Config.MODEL_NAME} in project: {self.project_id}")
        except Exception as e2:
            logger.error(f"Error initializing Vertex AI via ADC: {e2}")
            self.adc_active = False
            self.adc_status_msg = f"Vertex AI init error: {str(e2)}"

    def get_status(self):
        return {
            "adc_active": self.adc_active,
            "project_id": self.project_id,
            "model_name": Config.MODEL_NAME,
            "location": Config.LOCATION,
            "status_message": self.adc_status_msg
        }

    def _call_gemini(self, prompt):
        if hasattr(self, "genai_client") and self.genai_client and self.adc_active:
            try:
                response = self.genai_client.models.generate_content(
                    model=Config.MODEL_NAME,
                    contents=prompt
                )
                if response and hasattr(response, "text") and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"google.genai call warning: {e}")

        if hasattr(self, "model") and self.model and self.adc_active:
            try:
                response = self.model.generate_content(prompt)
                if response and hasattr(response, "text") and response.text:
                    return response.text
            except Exception as e:
                logger.warning(f"vertexai GenerativeModel call warning: {e}")

        return None

    def chat_with_chapter(self, chapter_title, chapter_text, user_message, chat_history, student_rank, explanation_style="eli5"):
        """
        AI agent chat grounded in the chapter content and adapted to student rank and style.
        """
        system_instruction = f"""
You are an expert AI Personalized Tutor on Eduro, dedicated to helping students master the chapter: "{chapter_title}".
Student Profile:
- Current Rank: {student_rank.get('name', 'Novice Explorer')} (Level {student_rank.get('rank_id', 1)})
- Difficulty Calibration: {student_rank.get('difficulty_label', 'Foundational')}

Teaching Style Mode: {explanation_style.upper()}
Guidelines for Styles:
- 'ELI5': Use vivid real-world everyday analogies, simple language, no unnecessary jargon, friendly and encouraging tone.
- 'ANALOGY': Focus heavily on relatable metaphors (e.g., comparing physics/computers/biology to everyday situations).
- 'DEEP_DIVE': Academic rigor, formal definitions, mathematical or theoretical depth, edge cases, and proofs.
- 'EXAM_FOCUS': Highlight what examiners look for, key marking points, common pitfalls/mistakes students make, concise high-yield phrasing.
- 'SOCRATIC': Don't just dump answers; gently guide the student with thoughtful questions to help them deduce the answer.

Important:
1. Ground your explanations in the provided Chapter Content.
2. If the student asks about a concept in this chapter, quote or cite relevant sections when helpful.
3. Be supportive, clear, and structure your answer with markdown formatting (bullet points, bold terms, code/math blocks where helpful).
"""

        context_prompt = f"""
CHAPTER CONTENT:
{chapter_text[:6000]}

STUDENT CHAT HISTORY:
{json.dumps(chat_history[-6:], indent=1) if chat_history else "No previous history."}

STUDENT QUESTION / MESSAGE:
"{user_message}"

Provide a comprehensive, engaging, and personalized pedagogical answer adhering to style mode '{explanation_style}'.
"""

        prompt = f"{system_instruction}\n\n{context_prompt}"
        res = self._call_gemini(prompt)
        if res:
            return res

        # Fallback intelligent contextual tutor response
        return self._fallback_chat(chapter_title, user_message, explanation_style, student_rank)

    def generate_practice_questions(self, chapter_id, chapter_title, chapter_text, student_rank, count=3):
        """
        Generates practice questions adapted to the student's rank.
        Rank 1: 3 basic MCQs on definitions and key ideas.
        Rank 2: 2 MCQs + 1 short application problem.
        Rank 3: 2 intermediate scenario MCQs + 1 analytical problem.
        Rank 4-5: Hard multi-step problem + tricky conceptual questions.
        """
        prompt = f"""
Generate {count} adaptive practice questions for the chapter "{chapter_title}".
The student is at Rank {student_rank.get('rank_id', 1)}: {student_rank.get('name', 'Novice')} ({student_rank.get('difficulty_label', 'Foundational')}).

Based on this chapter text:
{chapter_text[:5000]}

Generate a valid JSON array of objects with the exact schema:
[
  {{
    "id": "q1",
    "type": "multiple_choice", // or "short_answer"
    "difficulty": "{student_rank.get('difficulty_label', 'Foundational')}",
    "xp_reward": 30,
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"], // only for multiple_choice
    "correct_option_index": 0, // 0-based index of correct option if multiple_choice
    "correct_answer": "Exact answer or key rubric points",
    "hint": "Helpful hint without giving it away",
    "explanation": "Detailed pedagogical explanation of why this is correct and why other options are wrong"
  }}
]
Return ONLY the raw JSON array, without markdown backticks or commentary.
"""
        res = self._call_gemini(prompt)
        if res:
            try:
                clean_text = res.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return json.loads(clean_text)
            except Exception as e:
                logger.warning(f"Error parsing practice questions JSON from Vertex AI: {e}")

        return self._fallback_questions(chapter_id, chapter_title, student_rank)

    def evaluate_answers(self, chapter_title, chapter_text, questions, student_submissions, student_rank):
        """
        Evaluates student answers, scores them, and generates constructive feedback.
        """
        prompt = f"""
Evaluate the student's practice quiz for chapter "{chapter_title}".
Student Rank: {student_rank.get('name', 'Novice Explorer')} (Level {student_rank.get('rank_id', 1)}).

Questions and Student Submissions:
{json.dumps([{"q": q.get('question'), "correct": q.get('correct_answer'), "student_submission": student_submissions.get(q.get('id'))} for q in questions], indent=2)}

Return a JSON object with this exact schema:
{{
  "earned_score": 3,
  "max_score": 3,
  "evaluations": [
    {{
      "question_id": "q1",
      "is_correct": true,
      "feedback": "Praise or corrective insight explaining the concept clearly",
      "model_solution": "Ideal answer"
    }}
  ],
  "summary_feedback": "Motivational summary highlighting what the student grasped well and what to review next",
  "identified_weakness": "Specific concept phrase if any mistake was made, or null"
}}
Return ONLY raw JSON, no markdown codeblocks.
"""
        res = self._call_gemini(prompt)
        if res:
            try:
                clean_text = res.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return json.loads(clean_text)
            except Exception as e:
                logger.warning(f"Error parsing quiz evaluation JSON from Vertex AI: {e}")

        return self._fallback_evaluation(questions, student_submissions, student_rank)

    def generate_exam_prep(self, chapter_title, chapter_text):
        """
        Generates rapid exam preparation guide: high-yield concepts, formulas, pitfall warnings.
        """
        prompt = f"""
Create a comprehensive High-Yield Exam Prep Sheet for "{chapter_title}".
Base it on this text:
{chapter_text[:5000]}

Return a JSON object with:
{{
  "chapter_title": "{chapter_title}",
  "cheat_sheet": [
    {{"concept": "Name", "summary": "One sentence high-yield summary", "exam_importance": "Critical / High"}}
  ],
  "essential_formulas_or_laws": [
    {{"name": "Law name", "formula": "F=ma", "notes": "Application condition"}}
  ],
  "frequent_exam_traps": [
    "Common mistake students make on exams and how to avoid it"
  ],
  "memory_mnemonics": [
    {{"acronym": "...", "stands_for": "...", "context": "..."}}
  ]
}}
Return ONLY raw JSON.
"""
        res = self._call_gemini(prompt)
        if res:
            try:
                clean_text = res.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return json.loads(clean_text)
            except Exception as e:
                logger.warning(f"Error parsing exam prep JSON from Vertex AI: {e}")

        return self._fallback_exam_prep(chapter_title)

    def generate_flashcards(self, chapter_title, chapter_text):
        """
        Generates interactive active-recall flashcards.
        """
        prompt = f"""
Generate 5 active recall flashcards for "{chapter_title}".
Chapter content:
{chapter_text[:4000]}

Return JSON array of 5 objects:
[
  {{
    "id": "fc1",
    "front": "Prompt or Question",
    "back": "Clear concise answer",
    "key_takeaway": "Memory hook"
  }}
]
Return ONLY raw JSON.
"""
        res = self._call_gemini(prompt)
        if res:
            try:
                clean_text = res.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                return json.loads(clean_text)
            except Exception as e:
                logger.warning(f"Error parsing flashcards JSON from Vertex AI: {e}")

    def generate_scoring_rubric(self, subject, question, max_marks=10.0, chapter_title=None):
        """
        Analyzes a question with subject and maximum marks, and returns suggested scoring rubrics,
        criteria breakdown, performance level matrix, examiner tips, and model answers.
        """
        try:
            max_marks = float(max_marks)
            if max_marks <= 0:
                max_marks = 10.0
        except (ValueError, TypeError):
            max_marks = 10.0

        prompt = f"""
You are an expert assessment designer, chief university examiner, and pedagogical rubric specialist.
Generate a rigorous, fair, and professional Scoring Rubric for the following question:

Subject: {subject}
{f'Associated Topic/Chapter: {chapter_title}' if chapter_title else ''}
Question:
"{question}"
Total Maximum Marks: {max_marks}

Analyze the cognitive complexity, prerequisite concepts, and construct a precise marking scheme.
CRITICAL REQUIREMENT: The sum of the 'marks' in the 'criteria' array MUST EXACTLY equal {max_marks}.

Return a valid JSON object matching this schema:
{{
  "subject": "{subject}",
  "question": "{question}",
  "max_marks": {max_marks},
  "difficulty": "Foundational" or "Intermediate" or "Advanced",
  "bloom_level": "e.g. Analysis & Application, Derivation, Conceptual Synthesis",
  "estimated_time_mins": 10,
  "summary": "Brief 1-2 sentence overview of the marking rationale and what this question primarily assesses",
  "criteria": [
    {{
      "id": "crit_1",
      "name": "Criterion Name (e.g. Statement of Principles, Derivation / Working, Final Result)",
      "marks": 2.5,
      "percentage": 25,
      "description": "Clear explanation of what the response must demonstrate",
      "key_marking_points": [
        "Specific keyword, equation, or proof step required",
        "Another specific fact or argument"
      ],
      "partial_credit_rules": "How partial credit (e.g. 0.5 or 1 mark) should be awarded for incomplete answers"
    }}
  ],
  "performance_levels": [
    {{
      "level": "Exemplary / Full Marks",
      "score_range": "{round(max_marks * 0.9, 1)} - {max_marks} Marks",
      "descriptor": "Thorough, accurate response addressing all nuances with precise terminology and flawless execution."
    }},
    {{
      "level": "Proficient / Substantial",
      "score_range": "{round(max_marks * 0.7, 1)} - {round(max_marks * 0.89, 1)} Marks",
      "descriptor": "Demonstrates clear understanding with minor computational or phrasing omissions."
    }},
    {{
      "level": "Developing / Partial",
      "score_range": "{round(max_marks * 0.4, 1)} - {round(max_marks * 0.69, 1)} Marks",
      "descriptor": "Basic conceptual grasp present, but notable gaps in reasoning, missing steps, or misconceptions."
    }},
    {{
      "level": "Beginning / Inadequate",
      "score_range": "0 - {round(max_marks * 0.39, 1)} Marks",
      "descriptor": "Fails to address core aspects, incorrect fundamentals, or irrelevant information."
    }}
  ],
  "examiner_tips": [
    "Specific deduction rule (e.g. deduct 0.5 mark for missing SI units)",
    "Common trap students fall into on this question"
  ],
  "model_answer": "A complete, exemplary solution demonstrating how full marks are attained."
}}
Return ONLY raw JSON, without markdown codeblock formatting or surrounding commentary.
"""
        res = self._call_gemini(prompt)
        if res:
            try:
                clean_text = res.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
                parsed = json.loads(clean_text)
                if isinstance(parsed, dict) and "criteria" in parsed and len(parsed["criteria"]) > 0:
                    # Sanitize total marks alignment
                    parsed["max_marks"] = max_marks
                    parsed["subject"] = subject
                    parsed["question"] = question
                    return parsed
            except Exception as e:
                logger.warning(f"Error parsing scoring rubric JSON from Vertex AI: {e}")

        return self._fallback_rubric(subject, question, max_marks, chapter_title)

    # ================= FALLBACK ENGINE =================
    def _fallback_chat(self, chapter_title, user_message, style, student_rank):
        msg_lower = user_message.lower()
        title_lower = chapter_title.lower()
        rank_name = student_rank.get("name", "Novice Explorer")

        prefix = f"### 🎓 Personalized Tutor Guidance ({style.upper()} Mode)\n"
        prefix += f"*Tailored for {rank_name} (Level {student_rank.get('rank_id', 1)}) in **{chapter_title}***\n\n"

        # Determine subject category for fallback
        is_bio = any(k in title_lower for k in ["bio", "cell", "respiration", "genetic", "dna", "atp"])
        is_cs = any(k in title_lower for k in ["tree", "graph", "algorithm", "dynamic", "os", "concurr", "thread", "cs"])
        is_math = any(k in title_lower for k in ["math", "calculus", "linear", "vector", "derivative", "matrix"])

        if style == "eli5":
            if is_bio:
                return prefix + f"""Think of your cells like tiny bustling cities that need electrical power!

In **{chapter_title}**, when examining "{user_message}":
1. **The Core Picture:** Food you eat (like glucose) is broken down step-by-step to charge up biological batteries called **ATP**.
2. **Everyday Example:** Just like your phone needs a rechargeable battery to run apps, cells use ATP to do everything from contracting muscles to thinking!
3. **Key Takeaway:** Energy isn't made from scratch—it is transferred systematically from chemical bonds into usable ATP packets.

Would you like a visual step-by-step breakdown of how this happens?"""
            elif is_cs:
                return prefix + f"""Imagine searching for a friend's name in a phonebook or organizing books on a shelf!

In **{chapter_title}**, when examining "{user_message}":
1. **The Core Picture:** Instead of checking items one-by-one from scratch, we structure data so each decision eliminates half the remaining work.
2. **Everyday Example:** In a balanced tree, looking up a record among 1,000 items takes only about 10 quick comparisons!
3. **Key Takeaway:** Good data structures turn painfully slow searches into lightning-fast, logarithmic lookups.

Does this mental picture make sense for what you're studying?"""
            elif is_math:
                return prefix + f"""Imagine looking at a car's speedometer while driving up a winding mountain road!

In **{chapter_title}**, when examining "{user_message}":
1. **The Core Picture:** We want to measure exact change at a single frozen instant in time, not just an average over hours.
2. **Everyday Example:** When you zoom in really close on any smooth curved road, the section looks completely straight—that's a tangent line!
3. **Key Takeaway:** By analyzing infinitesimally small steps, we can optimize systems and predict exactly when peaks and valleys occur.

Would you like to see how this connects to finding maximum efficiency?"""
            else:
                return prefix + f"""Imagine you're playing with LEGO blocks or kicking a soccer ball in the park!

In this chapter on **{chapter_title}**, think of the concept behind "{user_message}" like this:
1. **The Core Picture:** Everything in nature follows conservation and equilibrium unless an outside influence intervenes.
2. **Everyday Example:** An object moving in friction-free space keeps gliding forever until a net external force acts upon it!
3. **Key Takeaway:** Forces and energy transfers dictate how physical systems evolve over time.

Would you like another everyday visual example, or should we connect this to an exam problem?"""

        elif style == "analogy":
            if is_bio:
                return prefix + f"""Here is a relatable analogy for **"{user_message}"** in **{chapter_title}**:

Think of it like an **Industrial Hydroelectric Dam & Power Grid**:
- Fuel molecules (glucose) are like water flowing into the reservoir.
- The carrier molecules (NADH/FADH2) act like pumps moving water up behind the dam wall (building a proton gradient).
- The ATP Synthase enzyme is like a water turbine: as protons flow through, the rotor spins to generate electrical power (ATP)!

Because you are exploring this at the **{student_rank.get('difficulty_label', 'Foundational')}** level, notice how building up a potential difference across a barrier is the universal engine for producing usable energy!"""
            elif is_cs:
                return prefix + f"""Here is a relatable analogy for **"{user_message}"** in **{chapter_title}**:

Think of it like a **Forking Decision Tree at an Airport Security Check**:
- Every passenger arrives at a junction and is directed left or right based on ticket type.
- By splitting the crowd evenly at each fork, wait times stay bounded by the height of the terminal rather than the total number of travelers!
- Rebalancing prevents one security lane from wrapping around the terminal while another sits empty.

Does this comparison help clarify how hierarchical balancing guarantees logarithmic speed?"""
            elif is_math:
                return prefix + f"""Here is a relatable analogy for **"{user_message}"** in **{chapter_title}**:

Think of it like a **Precision Laser Level on a Construction Site**:
- The slope of the surface tells builders whether water will drain or pool.
- The derivative acts like setting a level tangent to the curve at any spot, giving the exact incline at that exact millimeter.
- Setting the slope to zero identifies the absolute highest ridge or lowest valley floor!

Does this geometrical picture help ground the analytical calculations?"""
            else:
                return prefix + f"""Here is an intuitive analogy for **"{user_message}"** in **{chapter_title}**:

Think of it like a **Busy Airport Baggage Carousel**:
- The items moving along represent momentum and energy transfer.
- Friction is like the bumper cushions slowing luggage down.
- An unbalanced interaction is like an attendant pushing a heavy suitcase onto the belt.

Because you are exploring this at the **{student_rank.get('difficulty_label', 'Foundational')}** level, notice how forces and states operate in reciprocal pairs across system boundaries!"""

        elif style == "deep_dive":
            return prefix + f"""#### Rigorous Breakdown: {chapter_title}

Regarding your query: *"{user_message}"*

1. **Governing Theoretical Principles:**
   All mechanisms in **{chapter_title}** operate under rigorous analytical constraints and conservation laws.
2. **Boundary Conditions & Invariants:**
   - Always verify domain restrictions, reference frames, and state transitions.
   - Trace intermediate variables to guarantee equilibrium or asymptotic bounds.
3. **Application & Analytical Steps:**
   Isolate independent parameters, formulate governing equations, and evaluate asymptotic or empirical limits.

What specific mathematical formulation or edge case in **{chapter_title}** would you like to solve together?"""

        elif style == "exam_focus":
            return prefix + f"""#### 🎯 High-Yield Exam Master Class: {chapter_title}

**Focus Topic:** *"{user_message}"* in **{chapter_title}**

**1. Scoring Points (What Examiners Look For):**
- State formal definitions verbatim using key rubric vocabulary.
- Clearly identify independent vs dependent parameters and units.

**2. Common Pitfall Warning:**
- ⚠️ *Trap:* Omitting boundary conditions or confusing intermediate products with end states. Always write out every step in multi-mark questions.

**3. Model Solution Structure:**
State the core law, draw or cite the corresponding diagram/state, and justify the conclusion with specific rubric keywords."""

        else: # socratic
            return prefix + f"""That's an insightful question about **{chapter_title}**!

Before I reveal the full answer, let me ask you a guiding question to test your intuition:

When you observe the core mechanism of **{chapter_title}**, what parameter changes first, and what constraint prevents it from changing uncontrollably?

Tell me your intuition, and we will build the exact scientific principle together!"""

    def _fallback_questions(self, chapter_id, chapter_title, student_rank):
        rank_id = student_rank.get("rank_id", 1)
        if "physics" in chapter_id or "newton" in chapter_title.lower():
            if rank_id == 1:
                return [
                    {
                        "id": "q1",
                        "type": "multiple_choice",
                        "difficulty": "Foundational",
                        "xp_reward": 25,
                        "question": "According to Newton's First Law of Motion, what happens to an object moving at constant velocity if no external net force acts upon it?",
                        "options": [
                            "It will gradually decelerate and come to rest",
                            "It will continue moving at the exact same speed and direction indefinitely",
                            "It will accelerate in the direction of its existing motion",
                            "Its mass will slowly decrease over time"
                        ],
                        "correct_option_index": 1,
                        "correct_answer": "It will continue moving at the exact same speed and direction indefinitely",
                        "hint": "Think about Galileo's concept of inertia in outer space where there is zero friction.",
                        "explanation": "Newton's First Law states an object at rest stays at rest, and an object in motion stays in uniform straight-line motion unless compelled to change by a net external force."
                    },
                    {
                        "id": "q2",
                        "type": "multiple_choice",
                        "difficulty": "Foundational",
                        "xp_reward": 25,
                        "question": "If you double the net force applied to a cart of constant mass, what happens to its acceleration?",
                        "options": [
                            "The acceleration is halved",
                            "The acceleration remains unchanged",
                            "The acceleration doubles",
                            "The acceleration quadruples"
                        ],
                        "correct_option_index": 2,
                        "correct_answer": "The acceleration doubles",
                        "hint": "Recall F = m * a. What is the mathematical relationship between F and a when m is constant?",
                        "explanation": "From F = ma, acceleration a = F/m. Since acceleration is directly proportional to net force, doubling the net force doubles the acceleration."
                    },
                    {
                        "id": "q3",
                        "type": "multiple_choice",
                        "difficulty": "Foundational",
                        "xp_reward": 30,
                        "question": "A swimmer pushes backward against the water with their hands. Why do they propel forward?",
                        "options": [
                            "The water creates negative gravity",
                            "The water exerts an equal and opposite forward reaction force on the swimmer (Newton's Third Law)",
                            "The swimmer's weight becomes lighter in water",
                            "Friction pulls the swimmer forward"
                        ],
                        "correct_option_index": 1,
                        "correct_answer": "The water exerts an equal and opposite forward reaction force on the swimmer (Newton's Third Law)",
                        "hint": "Every action has an equal and opposite reaction.",
                        "explanation": "Newton's Third Law of Motion states that when body A exerts a force on body B, body B simultaneously exerts an equal and opposite force on body A."
                    }
                ]
            else:
                return [
                    {
                        "id": "q1",
                        "type": "multiple_choice",
                        "difficulty": "Advanced",
                        "xp_reward": 45,
                        "question": "A 1200 kg vehicle moving at 20 m/s applies brakes and skids to a stop over 40 meters on a level road. What is the magnitude of the net braking friction force acting on the car?",
                        "options": [
                            "3,000 N",
                            "6,000 N",
                            "12,000 N",
                            "24,000 N"
                        ],
                        "correct_option_index": 1,
                        "correct_answer": "6,000 N",
                        "hint": "Use kinematic equation v^2 = u^2 + 2as to find acceleration, then apply F = ma.",
                        "explanation": "0 = 20^2 + 2*a*40 => 80a = -400 => a = -5 m/s^2. Net force F = m * |a| = 1200 kg * 5 m/s^2 = 6,000 N."
                    },
                    {
                        "id": "q2",
                        "type": "multiple_choice",
                        "difficulty": "Advanced",
                        "xp_reward": 45,
                        "question": "Why do Action and Reaction forces NEVER cancel each other out in a free-body diagram?",
                        "options": [
                            "Because they have different numerical magnitudes",
                            "Because they act at different points in time",
                            "Because they act on two distinctly different objects, not the same object",
                            "Because one is always gravitational while the other is electromagnetic"
                        ],
                        "correct_option_index": 2,
                        "correct_answer": "Because they act on two distinctly different objects, not the same object",
                        "hint": "For two forces to cancel out to zero net force, they must act on the exact same single body.",
                        "explanation": "Forces only cancel if they act on the same system/body. By definition, an action force acts on Object B, while the reaction force acts back on Object A."
                    }
                ]
        elif "cs" in chapter_id or "tree" in chapter_title.lower():
            return [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "difficulty": "Core Understanding",
                    "xp_reward": 30,
                    "question": "In a balanced Binary Search Tree (BST) containing N nodes, what is the worst-case time complexity of search?",
                    "options": [
                        "O(1)",
                        "O(log N)",
                        "O(N)",
                        "O(N log N)"
                    ],
                    "correct_option_index": 1,
                    "correct_answer": "O(log N)",
                    "hint": "Each comparison cuts the remaining search space roughly in half.",
                    "explanation": "Because the tree is balanced, its maximum depth (height) is bounded by O(log N). Each step in BST search discards one subtree."
                },
                {
                    "id": "q2",
                    "type": "multiple_choice",
                    "difficulty": "Core Understanding",
                    "xp_reward": 35,
                    "question": "Which tree traversal order visits nodes of a Binary Search Tree in strictly ascending sorted order?",
                    "options": [
                        "Pre-order (Root, Left, Right)",
                        "In-order (Left, Root, Right)",
                        "Post-order (Left, Right, Root)",
                        "Level-order (Breadth First)"
                    ],
                    "correct_option_index": 1,
                    "correct_answer": "In-order (Left, Root, Right)",
                    "hint": "All left descendants are smaller than root, and all right descendants are larger.",
                    "explanation": "In-order traversal visits all smaller keys (left subtree), then current root, then all larger keys (right subtree), yielding ascending sorted order."
                }
            ]
        else:
            return [
                {
                    "id": "q1",
                    "type": "multiple_choice",
                    "difficulty": "Foundational",
                    "xp_reward": 30,
                    "question": f"What is the foundational principle underlying {chapter_title}?",
                    "options": [
                        "Equilibrium and conservation laws",
                        "Random mutation without constraints",
                        "Static non-interacting entities",
                        "Arbitrary state transitions"
                    ],
                    "correct_option_index": 0,
                    "correct_answer": "Equilibrium and conservation laws",
                    "hint": "Think about fundamental conservation and balance principles.",
                    "explanation": "Scientific models throughout this chapter rely on conservation of fundamental quantities and equilibrium states."
                }
            ]

    def _fallback_evaluation(self, questions, student_submissions, student_rank):
        evaluations = []
        earned_score = 0
        total_score = len(questions)

        for q in questions:
            qid = q.get("id")
            user_ans = student_submissions.get(qid)
            is_correct = False
            feedback = ""

            if q.get("type") == "multiple_choice":
                correct_idx = q.get("correct_option_index", 0)
                options = q.get("options", [])
                correct_str = options[correct_idx] if correct_idx < len(options) else q.get("correct_answer")

                # Match index or exact string
                if user_ans is not None:
                    if str(user_ans) == str(correct_idx) or str(user_ans).strip().lower() == correct_str.strip().lower():
                        is_correct = True
                        earned_score += 1
                        feedback = f"✨ Correct! {q.get('explanation')}"
                    else:
                        feedback = f"❌ Not quite. The correct answer was: '{correct_str}'. {q.get('explanation')}"
                else:
                    feedback = "Question was skipped or not answered."
            else:
                # Text answer heuristic
                if user_ans and len(str(user_ans).strip()) > 3:
                    is_correct = True
                    earned_score += 1
                    feedback = "Great explanation! You demonstrated solid grasp of the core concept."
                else:
                    feedback = "Incomplete explanation. Try expanding on the specific causal mechanism."

            evaluations.append({
                "question_id": qid,
                "is_correct": is_correct,
                "feedback": feedback,
                "model_solution": q.get("explanation")
            })

        pct = int((earned_score / total_score) * 100) if total_score > 0 else 0
        if pct >= 80:
            summary = f"Outstanding performance! ({earned_score}/{total_score} correct, {pct}%). You demonstrated strong conceptual clarity."
            weakness = None
        elif pct >= 50:
            summary = f"Good effort! ({earned_score}/{total_score} correct, {pct}%). Review the questions you missed to solidify your foundation."
            weakness = "Vector directionality & Action-Reaction boundary conditions"
        else:
            summary = f"Keep practicing! ({earned_score}/{total_score} correct, {pct}%). Use the ELI5 or Analogy chat mode to review the core definitions."
            weakness = "Fundamental definitions and mathematical relations"

        return {
            "earned_score": earned_score,
            "max_score": total_score,
            "evaluations": evaluations,
            "summary_feedback": summary,
            "identified_weakness": weakness
        }

    def _fallback_exam_prep(self, chapter_title):
        t_low = chapter_title.lower()
        if any(k in t_low for k in ["bio", "cell", "respiration", "genetic", "dna"]):
            return {
                "chapter_title": chapter_title,
                "cheat_sheet": [
                    {"concept": "Energy Carrier Phosphorylation", "summary": "ATP is synthesized from ADP + Pi via substrate-level or oxidative phosphorylation.", "exam_importance": "Critical"},
                    {"concept": "Chemiosmotic Proton Motive Force", "summary": "Protons pumped across the inner membrane establish an electrochemical gradient that drives ATP synthase.", "exam_importance": "Critical"},
                    {"concept": "Redox Balance & Electron Transport", "summary": "NADH and FADH2 donate high-energy electrons to oxygen (final electron acceptor).", "exam_importance": "High"},
                    {"concept": "Genetic Code & Replication Fidelity", "summary": "Semi-conservative replication relies on DNA polymerase proofreading and 5' to 3' synthesis.", "exam_importance": "High"}
                ],
                "essential_formulas_or_laws": [
                    {"name": "Complete Cellular Respiration Equation", "formula": "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 30-32 ATP", "notes": "Theoretical maximum yield under aerobic conditions"},
                    {"name": "Free Energy of ATP Hydrolysis", "formula": "ΔG°' = -30.5 kJ/mol (-7.3 kcal/mol)", "notes": "Exergonic driving force for cellular work"}
                ],
                "frequent_exam_traps": [
                    "Confusing the location of glycolysis (cytoplasm) with Krebs cycle and ETC (mitochondria).",
                    "Forgetting that oxygen is required strictly as the terminal electron acceptor, not for glycolysis itself.",
                    "Mixing up leading and lagging strand replication orientations (both synthesize 5' to 3')."
                ],
                "memory_mnemonics": [
                    {"acronym": "O-I-L  R-I-G", "stands_for": "Oxidation Is Loss, Reduction Is Gain", "context": "Electron transfer throughout metabolic respiration"},
                    {"acronym": "G-K-E", "stands_for": "Glycolysis, Krebs, Electron Transport", "context": "Chronological stages of aerobic respiration"}
                ]
            }
        elif any(k in t_low for k in ["tree", "graph", "algorithm", "dynamic", "os", "concurr", "cs"]):
            return {
                "chapter_title": chapter_title,
                "cheat_sheet": [
                    {"concept": "BST Invariant", "summary": "Left descendants < Root <= Right descendants guarantees monotonic in-order traversal.", "exam_importance": "Critical"},
                    {"concept": "Logarithmic Search Bound", "summary": "Height-balanced trees guarantee O(log N) worst-case time for search, insertion, and deletion.", "exam_importance": "Critical"},
                    {"concept": "Critical Section Mutual Exclusion", "summary": "Only one thread may execute within a critical section at any instant.", "exam_importance": "High"},
                    {"concept": "Optimal Substructure", "summary": "Optimal solution to a problem contains optimal solutions to its overlapping subproblems.", "exam_importance": "High"}
                ],
                "essential_formulas_or_laws": [
                    {"name": "Tree Height to Node Bound", "formula": "Height h ≈ ⌊log₂ N⌋ for balanced binary trees", "notes": "Degenerates to O(N) if tree becomes an unbalanced linked chain"},
                    {"name": "Master Theorem", "formula": "T(n) = a T(n/b) + f(n)", "notes": "Used for divide-and-conquer runtime analysis"}
                ],
                "frequent_exam_traps": [
                    "Assuming all binary search trees have O(log N) search without checking if they are balanced (unbalanced BST is O(N)).",
                    "Confusing Deadlock (permanent circular wait) with Starvation (indefinite postponement).",
                    "Writing recursive solutions without base cases or memoization tables."
                ],
                "memory_mnemonics": [
                    {"acronym": "M-O-C-H", "stands_for": "Mutual exclusion, Hold & wait, No preemption, Circular wait", "context": "Coffman's 4 conditions required for Deadlock"},
                    {"acronym": "P-I-P", "stands_for": "Pre-order, In-order, Post-order", "context": "Depth-first tree traversal categories"}
                ]
            }
        elif any(k in t_low for k in ["math", "calculus", "linear", "vector", "derivative", "matrix"]):
            return {
                "chapter_title": chapter_title,
                "cheat_sheet": [
                    {"concept": "Derivative Definition", "summary": "Instantaneous rate of change given by limit of difference quotient as delta x -> 0.", "exam_importance": "Critical"},
                    {"concept": "Critical Points & Extremum Test", "summary": "Local extrema occur strictly where f'(x) = 0 or f'(x) is undefined.", "exam_importance": "Critical"},
                    {"concept": "Linear Independence", "summary": "Vectors are independent iff c1*v1 + ... + ck*vk = 0 implies all coefficients ci = 0.", "exam_importance": "High"},
                    {"concept": "Eigenvalues & Determinants", "summary": "det(A - lambda * I) = 0 yields eigenvalues characterizing invariant directions.", "exam_importance": "High"}
                ],
                "essential_formulas_or_laws": [
                    {"name": "Chain Rule", "formula": "d/dx [f(g(x))] = f'(g(x)) · g'(x)", "notes": "Differentiate outer layer while keeping inner layer intact"},
                    {"name": "Characteristic Equation", "formula": "det(A - λI) = 0", "notes": "Roots are eigenvalues of linear transformation matrix A"}
                ],
                "frequent_exam_traps": [
                    "Forgetting the chain rule when differentiating composite functions.",
                    "Assuming f'(c) = 0 guarantees an extremum (it could be an inflection point like in y = x^3).",
                    "Assuming matrix multiplication is commutative (AB != BA in general)."
                ],
                "memory_mnemonics": [
                    {"acronym": "L-O-D-H-I", "stands_for": "(Low d-High - High d-Low) / (Low)^2", "context": "Quotient rule for derivatives"},
                    {"acronym": "C-I-D", "stands_for": "Concave up, Inflection, Decreasing slope", "context": "Second derivative curve interpretation"}
                ]
            }
        else:
            return {
                "chapter_title": chapter_title,
                "cheat_sheet": [
                    {"concept": "Newton's 1st Law (Inertia)", "summary": "Objects maintain constant velocity unless subjected to a non-zero net external force.", "exam_importance": "Critical"},
                    {"concept": "Newton's 2nd Law (Force & Acceleration)", "summary": "Net force equals rate of change of momentum (F_net = ma for constant mass).", "exam_importance": "Critical"},
                    {"concept": "Newton's 3rd Law (Interaction Pairs)", "summary": "Every action force is matched by an equal and opposite reaction force on the other body.", "exam_importance": "High"},
                    {"concept": "Free Body Diagram (FBD)", "summary": "Isolate the object, draw all external forces as vectors originating from center of mass.", "exam_importance": "High"}
                ],
                "essential_formulas_or_laws": [
                    {"name": "Newton's Second Law", "formula": "F_net = m · a", "notes": "Must be vector sum of ALL external forces"},
                    {"name": "Kinematic Relation", "formula": "v² = u² + 2as", "notes": "Valid strictly under constant acceleration"},
                    {"name": "Momentum", "formula": "p = m · v", "notes": "Vector quantity in kg·m/s"}
                ],
                "frequent_exam_traps": [
                    "Thinking that an object moving at high speed must have a large force currently acting on it (confusing velocity with net force).",
                    "Assuming normal force N is ALWAYS equal to mg (on an incline, N = mg cos(theta)).",
                    "Drawing action and reaction forces on the same free-body diagram."
                ],
                "memory_mnemonics": [
                    {"acronym": "F-M-A", "stands_for": "Force = Mass × Acceleration", "context": "Remember F at the top of the formula triangle"},
                    {"acronym": "I-A-R", "stands_for": "Inertia, Acceleration, Reaction", "context": "Order of Newton's 1st, 2nd, and 3rd laws"}
                ]
            }

    def _fallback_flashcards(self, chapter_title):
        t_low = chapter_title.lower()
        if any(k in t_low for k in ["bio", "cell", "respiration", "genetic", "dna"]):
            return [
                {
                    "id": "fc1",
                    "front": "What is the universal chemical energy currency synthesized by cellular respiration?",
                    "back": "Adenosine Triphosphate (ATP).",
                    "key_takeaway": "Energy from nutrient bonds is captured by phosphorylating ADP into ATP."
                },
                {
                    "id": "fc2",
                    "front": "Where does glycolysis occur in eukaryotic cells?",
                    "back": "In the cytoplasm (cytosol), requiring no organelle or oxygen.",
                    "key_takeaway": "Glycolysis is anaerobic and ancient; all organisms perform it in cytoplasm."
                },
                {
                    "id": "fc3",
                    "front": "What serves as the terminal electron acceptor in aerobic respiration?",
                    "back": "Molecular Oxygen (O2), which accepts electrons and protons to form water (H2O).",
                    "key_takeaway": "Without oxygen to accept electrons, the electron transport chain backs up."
                },
                {
                    "id": "fc4",
                    "front": "What drives the rotary turbine of ATP Synthase?",
                    "back": "The proton-motive force (electrochemical H+ gradient across the inner membrane).",
                    "key_takeaway": "Chemiosmosis converts potential gradient energy into mechanical rotation, then into ATP."
                },
                {
                    "id": "fc5",
                    "front": "In what direction does DNA polymerase synthesize new DNA strands?",
                    "back": "Strictly in the 5' to 3' direction.",
                    "key_takeaway": "Because templates run antiparallel, one strand is continuous (leading) and one fragmented (lagging)."
                }
            ]
        elif any(k in t_low for k in ["tree", "graph", "algorithm", "dynamic", "os", "concurr", "cs"]):
            return [
                {
                    "id": "fc1",
                    "front": "What is the worst-case search complexity in a balanced Binary Search Tree (AVL or Red-Black)?",
                    "back": "O(log N).",
                    "key_takeaway": "Balancing ensures height remains bounded by log2(N)."
                },
                {
                    "id": "fc2",
                    "front": "Which tree traversal order visits keys in ascending sorted order?",
                    "back": "In-order traversal (Left, Root, Right).",
                    "key_takeaway": "In-order visits all smaller values, then current root, then all larger values."
                },
                {
                    "id": "fc3",
                    "front": "What two properties are required to solve a problem with Dynamic Programming?",
                    "back": "Optimal Substructure and Overlapping Subproblems.",
                    "key_takeaway": "Optimal subproblems allow reusing memoized/tabulated solutions without recomputation."
                },
                {
                    "id": "fc4",
                    "front": "What is a race condition in concurrent programming?",
                    "back": "A flaw where output depends on the non-deterministic execution order or timing of competing threads.",
                    "key_takeaway": "Race conditions occur when shared mutable data is accessed without proper synchronization."
                },
                {
                    "id": "fc5",
                    "front": "What is the fundamental difference between a mutex and a counting semaphore?",
                    "back": "A mutex is a locking mechanism with ownership (only owner unlocks); a semaphore is a signaling mechanism.",
                    "key_takeaway": "Mutex = 1 resource with thread ownership; Semaphore = N resources or signals."
                }
            ]
        elif any(k in t_low for k in ["math", "calculus", "linear", "vector", "derivative", "matrix"]):
            return [
                {
                    "id": "fc1",
                    "front": "What does the first derivative f'(x) represent geometrically?",
                    "back": "The slope of the tangent line to the curve at point x (instantaneous rate of change).",
                    "key_takeaway": "Slope = rate of change; f'(x) > 0 means increasing, f'(x) < 0 means decreasing."
                },
                {
                    "id": "fc2",
                    "front": "How do you find candidate points for local extrema of a differentiable function?",
                    "back": "Solve for critical points where f'(x) = 0 or where f'(x) is undefined.",
                    "key_takeaway": "Critical points identify possible local maximums, minimums, or inflection points."
                },
                {
                    "id": "fc3",
                    "front": "What does the second derivative f''(x) tell you about a curve?",
                    "back": "Concavity: f''(x) > 0 is concave up (holds water); f''(x) < 0 is concave down (frown).",
                    "key_takeaway": "f''(x) = 0 with a sign change marks an inflection point."
                },
                {
                    "id": "fc4",
                    "front": "What does it mean for a set of vectors to be linearly independent?",
                    "back": "No vector in the set can be written as a linear combination of the other vectors.",
                    "key_takeaway": "c1*v1 + ... + ck*vk = 0 has ONLY the trivial solution c1 = ... = ck = 0."
                },
                {
                    "id": "fc5",
                    "front": "What is an eigenvector of an n x n square matrix A?",
                    "back": "A non-zero vector v that only scales (does not rotate) when multiplied by A: A v = λ v.",
                    "key_takeaway": "The scalar λ is the corresponding eigenvalue."
                }
            ]
        else:
            return [
                {
                    "id": "fc1",
                    "front": "What single condition is required for an object to remain at constant velocity?",
                    "back": "The vector sum of all external forces acting on it must be zero (F_net = 0).",
                    "key_takeaway": "No net force = zero acceleration = constant speed & direction."
                },
                {
                    "id": "fc2",
                    "front": "What is the key difference between mass and weight?",
                    "back": "Mass is an intrinsic measure of inertia (in kg), while weight is the gravitational force acting on that mass (W = mg, in Newtons).",
                    "key_takeaway": "Your mass is the same on the Moon; your weight is 1/6th!"
                },
                {
                    "id": "fc3",
                    "front": "Why don't action-reaction pairs cancel each other out?",
                    "back": "Because they act on two different bodies, never on the same body.",
                    "key_takeaway": "Forces only cancel when acting on the SAME body."
                },
                {
                    "id": "fc4",
                    "front": "What does the slope of a Velocity-Time (v-t) graph represent?",
                    "back": "Acceleration (a = dv/dt).",
                    "key_takeaway": "Slope = Acceleration; Area under curve = Displacement."
                },
                {
                    "id": "fc5",
                    "front": "What is an inertial reference frame?",
                    "back": "A reference frame that is not accelerating (at rest or moving at constant velocity), where Newton's laws hold true without fictitious forces.",
                    "key_takeaway": "Accelerating elevators or spinning carousels are non-inertial frames."
                }
            ]

    def _fallback_rubric(self, subject, question, max_marks=10.0, chapter_title=None):
        q_low = question.lower()
        s_low = (subject or "").lower()
        t_low = (chapter_title or "").lower()

        # Determine cognitive depth / verbs
        is_derivation = any(w in q_low for w in ["derive", "derivation", "proof", "prove", "show that"])
        is_calculation = any(w in q_low for w in ["calculate", "compute", "find", "evaluate", "solve", "determine"])
        is_comparison = any(w in q_low for w in ["compare", "contrast", "difference", "distinguish", "trade-off"])
        is_explanation = any(w in q_low for w in ["explain", "describe", "discuss", "why", "how does", "state"])

        # Determine domain
        is_cs = "cs" in s_low or "computer" in s_low or any(w in q_low for w in ["algorithm", "complexity", "tree", "graph", "thread", "process", "memory", "sort", "search", "time complexity", "big o"])
        is_bio = "bio" in s_low or any(w in q_low for w in ["cell", "respiration", "dna", "gene", "atp", "mitochondria", "enzyme", "protein", "photosynthesis"])
        is_math = "math" in s_low or any(w in q_low for w in ["calculus", "integral", "derivative", "matrix", "vector", "eigen", "limit", "theorem"])
        is_physics = "physic" in s_low or any(w in q_low for w in ["newton", "force", "momentum", "velocity", "acceleration", "energy", "gravity", "friction", "electric", "magnetic", "lens"])

        # Calculate criteria mark distributions
        m = float(max_marks)
        if m <= 3.0:
            c1_m = round(m * 0.5, 1)
            c2_m = round(m - c1_m, 1)
            criteria_counts = 2
        elif m <= 6.0:
            c1_m = round(m * 0.35, 1)
            c2_m = round(m * 0.45, 1)
            c3_m = round(m - c1_m - c2_m, 1)
            criteria_counts = 3
        else:
            c1_m = round(m * 0.25, 1)
            c2_m = round(m * 0.35, 1)
            c3_m = round(m * 0.25, 1)
            c4_m = round(m - c1_m - c2_m - c3_m, 1)
            criteria_counts = 4

        # Subject-specific tailoring
        if is_physics:
            domain_name = "Physics"
            bloom = "Application & Mathematical Derivation" if is_derivation else "Conceptual Analysis & Physical Principles"
            crit_list = [
                {
                    "id": "crit_1",
                    "name": "Identification of Physical Principles & Laws",
                    "marks": c1_m,
                    "percentage": round((c1_m / m) * 100),
                    "description": "Explicitly state the governing law or equation (e.g. Newton's Laws, conservation of momentum/energy, Gauss's law) and define symbols.",
                    "key_marking_points": [
                        "Identifies relevant physical principle accurately",
                        "Specifies vector directions, frame of reference, and free-body assumptions",
                        "Clearly declares constant quantities (e.g. constant mass dm/dt = 0 or isolated system)"
                    ],
                    "partial_credit_rules": "Award 50% for stating equation without contextual law definition."
                },
                {
                    "id": "crit_2",
                    "name": "Step-by-Step Derivation & Methodological Rigor",
                    "marks": c2_m,
                    "percentage": round((c2_m / m) * 100),
                    "description": "Demonstrates logical mathematical or conceptual progression from initial premises to derived result.",
                    "key_marking_points": [
                        "Differentiates or integrates with correct calculus operators (e.g. dp/dt = d(mv)/dt)",
                        "Applies product rule or substitution cleanly without skipping critical intermediate steps",
                        "Justifies elimination of secondary or negligible terms"
                    ],
                    "partial_credit_rules": "Deduct proportional marks for arithmetic/algebraic slips while retaining method marks."
                }
            ]
            if criteria_counts >= 3:
                crit_list.append({
                    "id": "crit_3",
                    "name": "Physical Interpretation & Real-World Application",
                    "marks": c3_m,
                    "percentage": round((c3_m / m) * 100),
                    "description": "Explains the physical implications, limiting cases, and provides clear contextual examples.",
                    "key_marking_points": [
                        "Correctly interprets behavior when net force equals zero or approaches infinity",
                        "Relates result to an authentic physical scenario (e.g. rocket thrust, braking vehicle, tension in cables)",
                        "Distinguishes clearly between internal and external forces"
                    ],
                    "partial_credit_rules": "Award full marks if qualitative explanation aligns seamlessly with quantitative steps."
                })
            if criteria_counts >= 4:
                crit_list.append({
                    "id": "crit_4",
                    "name": "Dimensional Accuracy, SI Units & Final Form",
                    "marks": c4_m,
                    "percentage": round((c4_m / m) * 100),
                    "description": "Final statement is clearly boxed, dimensionally homogeneous, and specifies appropriate SI units.",
                    "key_marking_points": [
                        "Correct final formula or numerical answer",
                        "Exact SI units explicitly attached (e.g., N = kg·m/s², J, W, m/s²)",
                        "Correct vector notation and significant figures preserved"
                    ],
                    "partial_credit_rules": "Deduct 0.5 to 1.0 mark for missing or incorrect units."
                })

            tips = [
                "Always check for SI unit definitions (e.g., 1 Newton = 1 kg·m/s²). Deduct 0.5 mark if omitted.",
                "Ensure candidate clearly distinguishes mass from weight and does not treat normal force as an automatic action-reaction pair to gravity.",
                "Verify that vectors have direction explicitly indicated when relevant."
            ]
            model_ans = (
                f"**Question Analysis & Ideal Solution ({m} Marks):**\n\n"
                f"1. **Governing Law:** State the formal physical principle governing '{question}'. "
                f"According to Newton's Second Law, the net external force acting on a body is directly proportional to the rate of change of momentum:\n"
                f"$$\\vec{{F}}_{{net}} = \\frac{{d\\vec{{p}}}}{{dt}}$$\n\n"
                f"2. **Derivation / Working:** Expanding momentum $\\vec{{p}} = m\\vec{{v}}$:\n"
                f"$$\\vec{{F}}_{{net}} = \\frac{{d(m\\vec{{v}})}}{{dt}} = m\\frac{{d\\vec{{v}}}}{{dt}} + \\vec{{v}}\\frac{{dm}}{{dt}}$$\n"
                f"For systems with constant mass ($\\frac{{dm}}{{dt}} = 0$):\n"
                f"$$\\vec{{F}}_{{net}} = m\\frac{{d\\vec{{v}}}}{{dt}} = m\\vec{{a}}$$\n\n"
                f"3. **Physical Significance & Units:** The constant of proportionality is chosen such that $1\\text{{ N}} = 1\\text{{ kg}}\\cdot\\text{{m/s}}^2$. "
                f"This relation demonstrates that acceleration is collinear with and caused by the net external unbalanced force."
            )

        elif is_cs:
            domain_name = "Computer Science"
            bloom = "Algorithmic Analysis & Architecture" if is_comparison else "Technical Problem Solving & Complexity"
            crit_list = [
                {
                    "id": "crit_1",
                    "name": "Algorithmic Definition & Mechanism",
                    "marks": c1_m,
                    "percentage": round((c1_m / m) * 100),
                    "description": "Defines core data structures, state representations, and foundational operating principles.",
                    "key_marking_points": [
                        "Accurate technical definitions of structures and invariants",
                        "Precise pseudocode or step-by-step logic",
                        "Clear declaration of input/output bounds and constraints"
                    ],
                    "partial_credit_rules": "Award partial credit if core algorithm logic is correct despite syntax imperfections."
                },
                {
                    "id": "crit_2",
                    "name": "Time & Space Complexity Formal Analysis",
                    "marks": c2_m,
                    "percentage": round((c2_m / m) * 100),
                    "description": "Rigorous asymptotic analysis utilizing Big-O notation for best, average, and worst-case performance.",
                    "key_marking_points": [
                        "Derives recurrence relation or loops iterations explicitly",
                        "States correct time complexity (e.g., O(V + E), O(N log N), O(1) amortized)",
                        "States auxiliary space complexity and explains stack/heap memory overhead"
                    ],
                    "partial_credit_rules": "Half credit if Big-O is stated without justifying analysis or recurrence steps."
                }
            ]
            if criteria_counts >= 3:
                crit_list.append({
                    "id": "crit_3",
                    "name": "Edge Cases, Correctness & Failure Modes",
                    "marks": c3_m,
                    "percentage": round((c3_m / m) * 100),
                    "description": "Handles boundary scenarios such as empty collections, cycles, duplicate keys, or race conditions.",
                    "key_marking_points": [
                        "Explores edge conditions (null pointers, single node, disconnected graphs)",
                        "Identifies termination conditions and loop invariants",
                        "Explains how negative edge weights or deadlocks are handled"
                    ],
                    "partial_credit_rules": "Award full marks for robust defensive logic."
                })
            if criteria_counts >= 4:
                crit_list.append({
                    "id": "crit_4",
                    "name": "Practical Trade-Offs & Comparative Evaluation",
                    "marks": c4_m,
                    "percentage": round((c4_m / m) * 100),
                    "description": "Articulates when this technique is preferable over alternative algorithms in real-world systems.",
                    "key_marking_points": [
                        "Contrasts tradeoffs (e.g. memory vs speed, cache locality vs pointer chasing)",
                        "Provides concrete production use case where this solution excels",
                        "Concise engineering summary"
                    ],
                    "partial_credit_rules": "Award full marks for insightful synthesis."
                })

            tips = [
                "Candidates frequently mix up worst-case and average-case time complexities; verify asymptotic notation.",
                "Ensure auxiliary space is distinguished from input size.",
                "Check for concrete handling of boundary/edge conditions."
            ]
            model_ans = (
                f"**Ideal Technical Solution ({m} Marks):**\n\n"
                f"1. **Core Mechanism:** For '{question}', detail the foundational algorithm.\n"
                f"2. **Asymptotic Complexity:**\n"
                f"- **Time Complexity:** $O(V + E)$ or $O(N \\log N)$, derived from queue operations and edge relaxation.\n"
                f"- **Auxiliary Space:** $O(V)$ for the visited set and traversal queue.\n"
                f"3. **Corner Cases & Proof of Correctness:** Examines empty graphs, disconnected components, and cycle detection.\n"
                f"4. **Engineering Trade-offs:** Balanced against alternative approaches in memory consumption and latency."
            )

        elif is_bio:
            domain_name = "Biology & Life Sciences"
            bloom = "Biochemical Synthesis & Mechanism"
            crit_list = [
                {
                    "id": "crit_1",
                    "name": "Biochemical Terminology & Structural Localization",
                    "marks": c1_m,
                    "percentage": round((c1_m / m) * 100),
                    "description": "Identifies exact organelle locations (e.g., mitochondrial matrix, cristae, cytoplasm) and primary biomolecules.",
                    "key_marking_points": [
                        "Names correct cellular compartments for each sub-process",
                        "Identifies key enzymes, substrates, and cofactor carriers (NAD+/NADH, FAD/FADH2, ATP synthase)",
                        "Uses accurate terminology without conversational ambiguity"
                    ],
                    "partial_credit_rules": "Deduct 0.5 mark for misidentifying inner membrane vs matrix."
                },
                {
                    "id": "crit_2",
                    "name": "Stepwise Mechanistic Pathway & Transformations",
                    "marks": c2_m,
                    "percentage": round((c2_m / m) * 100),
                    "description": "Details the sequential chemical conversions, electron transfers, or genetic reading steps.",
                    "key_marking_points": [
                        "Chronological sequence of stages accurately mapped",
                        "Explains electrochemical proton gradient and chemiosmotic coupling",
                        "Tracks carbon oxidation from glucose to CO2"
                    ],
                    "partial_credit_rules": "Award partial credit if major stages are listed in correct order."
                }
            ]
            if criteria_counts >= 3:
                crit_list.append({
                    "id": "crit_3",
                    "name": "Quantitative Stoichiometry & Yield Calculation",
                    "marks": c3_m,
                    "percentage": round((c3_m / m) * 100),
                    "description": "Accurate accounting of net energy carriers, ATP synthesis numbers, and balanced chemical equations.",
                    "key_marking_points": [
                        "Net ATP balance calculated accurately (e.g. 2 Glycolysis + 2 Krebs + 26-28 Oxidative = 30-32 Total)",
                        "Identifies oxygen as terminal electron acceptor generating H2O",
                        "Distinguishes substrate-level phosphorylation from oxidative phosphorylation"
                    ],
                    "partial_credit_rules": "Accept standard modern textbook ranges (30-32 ATP) with full marks."
                })
            if criteria_counts >= 4:
                crit_list.append({
                    "id": "crit_4",
                    "name": "Physiological Context & Evolutionary Significance",
                    "marks": c4_m,
                    "percentage": round((c4_m / m) * 100),
                    "description": "Connects mechanism to organismal respiration, anaerobic alternatives, and feedback regulation.",
                    "key_marking_points": [
                        "Contrasts aerobic pathway with lactic acid / ethanol fermentation when O2 is depleted",
                        "Identifies phosphofructokinase (PFK) or allosteric feedback inhibition",
                        "Clear summary sentence"
                    ],
                    "partial_credit_rules": "Award full marks for clear evolutionary rationale."
                })

            tips = [
                "Ensure candidate does not claim ATP is 'created'; it is phosphorylated from ADP and inorganic phosphate.",
                "Watch out for oxygen's role: it accepts low-energy electrons at Complex IV to form metabolic water.",
                "Reward precise net counts over gross numbers."
            ]
            model_ans = (
                f"**Ideal Biochemical Solution ({m} Marks):**\n\n"
                f"1. **Overall Equation:** $\\text{{C}}_6\\text{{H}}_{{12}}\\text{{O}}_6 + 6\\text{{O}}_2 \\rightarrow 6\\text{{CO}}_2 + 6\\text{{H}}_2\\text{{O}} + 30\\text{{-}}32\\text{{ ATP}}$\n"
                f"2. **Stage 1 (Glycolysis):** Occurs in cytosol; net yield = 2 ATP (substrate-level) + 2 NADH.\n"
                f"3. **Stage 2 (Citric Acid Cycle & Pyruvate Oxidation):** In mitochondrial matrix; yields 6 CO2, 8 NADH, 2 FADH2, 2 ATP.\n"
                f"4. **Stage 3 (Oxidative Phosphorylation):** Inner mitochondrial membrane; ETC drives proton motive force across intermembrane space, powering ATP synthase to yield ~26-28 ATP."
            )

        elif is_math:
            domain_name = "Mathematics"
            bloom = "Analytical Derivation & Computational Precision"
            crit_list = [
                {
                    "id": "crit_1",
                    "name": "Statement of Mathematical Theorems & Assumptions",
                    "marks": c1_m,
                    "percentage": round((c1_m / m) * 100),
                    "description": "Clearly states relevant theorems, definitions, continuity/differentiability preconditions, and domains.",
                    "key_marking_points": [
                        "States applicable theorem (e.g. Fundamental Theorem of Calculus, Rank-Nullity)",
                        "Verifies hypotheses (continuity on [a, b], differentiability on (a, b))",
                        "Declares variables and coordinate systems cleanly"
                    ],
                    "partial_credit_rules": "Award full marks for rigorous hypothesis validation."
                },
                {
                    "id": "crit_2",
                    "name": "Systematic Step-by-Step Proof / Algebraic Solution",
                    "marks": c2_m,
                    "percentage": round((c2_m / m) * 100),
                    "description": "Execution of calculus or linear algebraic techniques without logical non-sequiturs.",
                    "key_marking_points": [
                        "Correct antiderivative, derivative, or matrix row-reduction operations",
                        "Preserves equality signs and mathematical syntax throughout working",
                        "Correct substitution of integration limits or boundary coordinates"
                    ],
                    "partial_credit_rules": "Method marks retained even if minor arithmetic error occurs."
                }
            ]
            if criteria_counts >= 3:
                crit_list.append({
                    "id": "crit_3",
                    "name": "Geometric / Analytical Justification",
                    "marks": c3_m,
                    "percentage": round((c3_m / m) * 100),
                    "description": "Explains the geometric interpretation (e.g. net signed area, transformation of basis, eigenvalues as stretch factors).",
                    "key_marking_points": [
                        "Interprets result geometrically or dimensionally",
                        "Discusses convergence, singularity points, or vector subspace span",
                        "Addresses symmetry properties when simplifying calculations"
                    ],
                    "partial_credit_rules": "Award full marks if graphical/geometric reasoning is evident."
                })
            if criteria_counts >= 4:
                crit_list.append({
                    "id": "crit_4",
                    "name": "Final Simplified Value & Formal Conclusion",
                    "marks": c4_m,
                    "percentage": round((c4_m / m) * 100),
                    "description": "Accurate, fully simplified final numerical or symbolic expression.",
                    "key_marking_points": [
                        "Exact value provided (e.g. in terms of pi, e, or irreducible fractions)",
                        "Includes constant of integration (+ C) for indefinite integrals",
                        "Clearly states Q.E.D. or final conclusion"
                    ],
                    "partial_credit_rules": "Deduct 0.5 mark if '+ C' is omitted in indefinite integrals."
                })

            tips = [
                "Check for continuity and domain constraints before applying differentiation/integration theorems.",
                "Deduct 0.5 mark if '+ C' is missing in indefinite integrals.",
                "Ensure matrix dimensions are consistent before multiplication."
            ]
            model_ans = (
                f"**Ideal Mathematical Solution ({m} Marks):**\n\n"
                f"1. **Hypothesis & Theorem Formulation:** Let $f(x)$ be continuous on $[a, b]$. By the Fundamental Theorem of Calculus:\n"
                f"$$\\int_{{a}}^{{b}} f(x)dx = F(b) - F(a)$$\n"
                f"2. **Working & Anti-derivative:** Calculate anti-derivative $F(x) = \\int f(x)dx$ step-by-step.\n"
                f"3. **Evaluation at Limits:** Substitute upper and lower bounds rigorously.\n"
                f"4. **Exact Result:** Simplify to final exact closed-form notation."
            )

        else:
            # General Academic Subject
            domain_name = subject or "Academic Curriculum"
            bloom = "Critical Evaluation & Comprehensive Synthesis"
            crit_list = [
                {
                    "id": "crit_1",
                    "name": "Conceptual Foundation & Core Definitions",
                    "marks": c1_m,
                    "percentage": round((c1_m / m) * 100),
                    "description": "Articulates fundamental concepts, theories, and key definitions relevant to the prompt.",
                    "key_marking_points": [
                        "Defines core terms with academic precision",
                        "Identifies foundational theories or governing principles",
                        "Demonstrates clear scope and context"
                    ],
                    "partial_credit_rules": "Partial credit awarded for general understanding without exact technical vocabulary."
                },
                {
                    "id": "crit_2",
                    "name": "Detailed Analytical Argumentation & Evidence",
                    "marks": c2_m,
                    "percentage": round((c2_m / m) * 100),
                    "description": "Develops a coherent, evidence-backed line of reasoning directly addressing all parts of the question.",
                    "key_marking_points": [
                        "Presents clear logical sequence of claims and supporting evidence",
                        "Explains cause-and-effect relationships and mechanisms",
                        "Addresses multi-part aspects of the question thoroughly"
                    ],
                    "partial_credit_rules": "Award marks based on depth and validity of arguments presented."
                }
            ]
            if criteria_counts >= 3:
                crit_list.append({
                    "id": "crit_3",
                    "name": "Critical Analysis, Applications & Examples",
                    "marks": c3_m,
                    "percentage": round((c3_m / m) * 100),
                    "description": "Applies concepts to concrete scenarios, evaluates counter-arguments, and synthesizes insights.",
                    "key_marking_points": [
                        "Provides relevant real-world or theoretical examples",
                        "Identifies boundary conditions or counter-perspectives",
                        "Synthesizes principles into coherent analytical takeaways"
                    ],
                    "partial_credit_rules": "Full credit if examples illustrate principles effectively."
                })
            if criteria_counts >= 4:
                crit_list.append({
                    "id": "crit_4",
                    "name": "Conclusion, Academic Structure & Precision",
                    "marks": c4_m,
                    "percentage": round((c4_m / m) * 100),
                    "description": "Well-structured response with clear progression, academic tone, and definitive conclusion.",
                    "key_marking_points": [
                        "Draws a definitive, well-supported final conclusion",
                        "Uses formal discipline-specific vocabulary throughout",
                        "Presents clear, concise, and professional formatting"
                    ],
                    "partial_credit_rules": "Award full marks for exceptional clarity and structure."
                })

            tips = [
                "Verify candidate directly addresses all sub-clauses of the prompt.",
                "Look for concrete examples rather than purely abstract statements.",
                "Check for logical progression and consistency in conclusions."
            ]
            model_ans = (
                f"**Exemplary Solution ({m} Marks):**\n\n"
                f"1. **Core Concept Introduction:** Clearly defines the central thesis and theoretical framework of '{question}'.\n"
                f"2. **Detailed Analysis:** Step-by-step examination of the underlying mechanisms and evidence.\n"
                f"3. **Practical Application:** Illustrates the principles with representative examples and acknowledges constraints.\n"
                f"4. **Synthesis & Conclusion:** Summarizes findings into a coherent, definitive conclusion fulfilling all criteria."
            )

        # Performance Levels
        perf_levels = [
            {
                "level": "Exemplary / Full Marks",
                "score_range": f"{round(m * 0.9, 1)} - {m} Marks (90-100%)",
                "descriptor": "Flawless demonstration of all knowledge points. Precise terminology, comprehensive derivations, rigorous proofs, and exhaustive edge case handling with zero conceptual misconceptions."
            },
            {
                "level": "Proficient / Substantial",
                "score_range": f"{round(m * 0.7, 1)} - {round(m * 0.89, 1)} Marks (70-89%)",
                "descriptor": "Strong conceptual understanding addressing all primary requirements. Minor arithmetic slip, slightly imprecise notation, or omission of an incidental real-world qualification."
            },
            {
                "level": "Developing / Partial",
                "score_range": f"{round(m * 0.4, 1)} - {round(m * 0.69, 1)} Marks (40-69%)",
                "descriptor": "Basic understanding is evident (e.g. states initial formula or definition), but fails to complete derivation, contains arithmetic/algebraic lapses, or displays partial misconceptions."
            },
            {
                "level": "Beginning / Inadequate",
                "score_range": f"0 - {round(m * 0.39, 1)} Marks (0-39%)",
                "descriptor": "Significant misconceptions, irrelevant material, or failure to demonstrate prerequisite subject principles. Unfinished working or fundamental misinterpretation of the prompt."
            }
        ]

        return {
            "subject": domain_name,
            "question": question,
            "max_marks": m,
            "difficulty": "Intermediate" if m <= 10 else "Advanced / Rigorous",
            "bloom_level": bloom,
            "estimated_time_mins": max(5, int(m * 1.5)),
            "summary": f"Analytical scoring rubric designed for assessing '{question}' ({m} marks total) across {len(crit_list)} rigorous criteria with detailed performance bands.",
            "criteria": crit_list,
            "performance_levels": perf_levels,
            "examiner_tips": tips,
            "model_answer": model_ans
        }

