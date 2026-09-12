# StudyPilot Product Requirements

## Problem

Students often prepare with static material and generic practice. Those approaches do not adapt to what a student actually knows, where they are struggling, or how much time remains before a learning goal.

## Target Users

Students preparing for exams or learning a technical or academic subject.

## Goal

Help a student achieve a specific learning goal through an adaptive study workflow.

## Core MVP

The MVP takes a student through this sequence:

**Goal -> initial plan -> diagnostic quiz -> evaluate performance -> identify weak topics -> adapt plan -> targeted practice -> update progress**

The experience should make the agent's decisions and tool use clear enough to demonstrate that this is an agentic workflow rather than a simple chatbot.

## Agent Responsibilities

- Understand the student's learning goal.
- Decide what information is missing.
- Decide which topics and questions to generate.
- Evaluate quiz results and answers.
- Identify weak topics.
- Decide how the study plan should change.
- Decide the next useful learning action.
- Remember relevant progress.

## Planned Tools

These tools are planned interfaces for the agent. They should not be implemented yet:

- `get_topic_content`
- `generate_quiz`
- `evaluate_answer`
- `update_progress`
- `get_progress`
- `update_study_plan`

The tools should remain small, deterministic, and easy to inspect around the primary agent.

## Constraints and Non-Goals

- This is a 6-hour hackathon project.
- Use one primary agent and a small number of tools.
- Keep the architecture simple and avoid unnecessary dependencies.
- Do not add authentication, multi-agent architecture, complex RAG, large external datasets, or unnecessary external APIs.
- Do not add MCP unless a concrete later requirement justifies it.
- Do not add RAG unless it materially improves the selected MVP.
- Prefer reliable deterministic tools around the LLM.
- Do not invent features outside the MVP.
