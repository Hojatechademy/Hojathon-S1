import { useState } from 'react'
import { createSession, getPractice, getProgress, submitDiagnostic, submitPractice } from './api'
import './App.css'

const journey = [
  { id: 'goal', label: 'Student goal', short: '01' },
  { id: 'plan', label: 'Study plan', short: '02' },
  { id: 'quiz', label: 'Diagnostic quiz', short: '03' },
  { id: 'evaluate', label: 'Evaluation', short: '04' },
  { id: 'weak', label: 'Weak topics', short: '05' },
  { id: 'adapt', label: 'Adaptive plan', short: '06' },
  { id: 'practice', label: 'Targeted practice', short: '07' },
  { id: 'progress', label: 'Progress update', short: '08' },
]

const actionLabels = {
  create_study_plan: 'BUILT STUDY PLAN',
  generate_diagnostic_quiz: 'GENERATED DIAGNOSTIC',
  evaluate_quiz: 'EVALUATED PERFORMANCE',
  identify_weak_topics: 'DETECTED WEAK TOPICS',
  adapt_study_plan: 'ADAPTED STUDY PLAN',
  generate_targeted_practice: 'TARGETED PRACTICE READY',
  evaluate_practice: 'EVALUATED PRACTICE',
  update_progress: 'UPDATED PROGRESS',
}

function getCurrentStep({ session, evaluation, loading, practice }) {
  if (loading) return evaluation ? 5 : 2
  if (practice.length > 0) return 6
  if (evaluation) return 5
  if (session) return 2
  return 0
}

function App() {
  const [goal, setGoal] = useState('Operating Systems exam in 3 days')
  const [days, setDays] = useState('3')
  const [hoursPerDay, setHoursPerDay] = useState('2')
  const [sessionId, setSessionId] = useState(null)
  const [session, setSession] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [practice, setPractice] = useState([])
  const [progress, setProgress] = useState(null)
  const [answers, setAnswers] = useState({})
  const [selectedTopic, setSelectedTopic] = useState('')
  const [practiceOpen, setPracticeOpen] = useState(false)
  const [practiceAnswers, setPracticeAnswers] = useState({})
  const [practiceEvaluation, setPracticeEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const quiz = session?.diagnostic_quiz ?? []
  const plan = evaluation?.adapted_plan ?? session?.study_plan ?? []
  const topicResults = evaluation?.topic_results ?? []
  const weakTopicNames = evaluation?.weak_topics ?? []
  const agentDecisions = evaluation?.agent_decisions ?? session?.agent_decisions ?? []
  const selectedWeakTopic = selectedTopic || weakTopicNames[0] || ''
  const currentStep = getCurrentStep({ session, evaluation, loading, practice })
  const answeredCount = Object.keys(answers).length
  const diagnosticReady = quiz.length > 0 && answeredCount === quiz.length
  const scorePercent = progress?.overall_score == null ? null : Math.round(progress.overall_score * 100)
  const aiMode = evaluation?.ai_mode ?? session?.ai_mode ?? 'fallback'
  const selectedExplanation = evaluation?.topic_explanations?.find((item) => item.topic === selectedWeakTopic)

  const handleStart = async () => {
    setLoading(true)
    setError('')
    setEvaluation(null)
    setPractice([])
    setProgress(null)
    setAnswers({})
    setPracticeOpen(false)
    setPracticeAnswers({})
    setPracticeEvaluation(null)
    try {
      const response = await createSession(goal, Number(days), Number(hoursPerDay))
      setSessionId(response.session_id)
      setSession(response)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePracticeAnswer = (practiceId, answerIndex) => {
    setPracticeAnswers((current) => ({ ...current, [practiceId]: answerIndex }))
  }

  const handleSubmitPractice = async () => {
    if (!sessionId || !practice.length || Object.keys(practiceAnswers).length !== practice.length) return
    setLoading(true)
    setError('')
    try {
      const response = await submitPractice(sessionId, practice.map((item) => ({ practice_id: item.id, answer_index: practiceAnswers[item.id] })))
      setPracticeEvaluation(response)
      setProgress(response.progress)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId, answerIndex) => {
    setAnswers((current) => ({ ...current, [questionId]: answerIndex }))
  }

  const handleSubmitQuiz = async () => {
    if (!sessionId || !diagnosticReady) return
    setLoading(true)
    setError('')
    try {
      const answerList = quiz.map((question) => ({
        question_id: question.id,
        answer_index: answers[question.id],
      }))
      const response = await submitDiagnostic(sessionId, answerList)
      setEvaluation(response)
      setProgress(response.progress)
      setSelectedTopic(response.weak_topics[0] || '')
      const [practiceResponse, progressResponse] = await Promise.all([
        getPractice(sessionId),
        getProgress(sessionId),
      ])
      setPractice(practiceResponse)
      setProgress(progressResponse)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#top" aria-label="StudyPilot home"><span className="brand-mark">✦</span><span>StudyPilot</span><span className="brand-dot" /></a>
        <div className="topbar-center">Agentic study coach <span>/</span> workspace 001</div>
        <div className="topbar-actions"><span className={`status-pill ${loading ? 'working' : ''} ${aiMode === 'ai' ? 'ai-mode' : 'fallback-mode'}`}><i /> {loading ? 'agent working' : aiMode === 'ai' ? 'ai mode' : 'fallback mode'}</span><button className="icon-button" type="button" aria-label="Open settings">⚙</button></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy"><p className="kicker">your next best study move</p><h1>Make the<br /><span>hard stuff</span><br />click.</h1><p className="hero-note">A study plan that notices what you know, finds the gaps, and changes with you.</p><div className="hero-stamp">STUDY<br />SMART<br /><b>↗</b></div></div>
        <div className="goal-board paper-shadow"><div className="board-tape" /><div className="paper-meta"><span>STUDY BRIEF / 01</span><span>12 SEP 2026</span></div><label htmlFor="goal">What are you trying to learn?</label><textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} rows="2" /><div className="goal-details"><label className="detail-input"><span>days</span><input type="number" min="1" max="365" value={days} onChange={(event) => setDays(event.target.value)} /></label><label className="detail-input"><span>hours / day</span><input type="number" min="0.25" max="24" step="0.25" value={hoursPerDay} onChange={(event) => setHoursPerDay(event.target.value)} /></label><span className="detail-tag">⌁ exam mode</span></div><button className="start-button" type="button" onClick={handleStart} disabled={loading || !goal.trim()}><span>{loading ? 'BUILDING SESSION...' : sessionId ? 'RESTART SESSION' : 'START STUDY SESSION'}</span><b>↗</b></button><p className={`board-foot ${error ? 'error-copy' : ''}`}>{error || (sessionId ? `Session ${sessionId.slice(0, 8)} is active.` : 'Tell the agent what success looks like.')}</p></div>
        <div className="floating-note note-yellow"><span className="pin" /><strong>MEMO</strong><p>Small steps<br />compound.</p><small>— future you</small></div>
        <div className="floating-note note-pink"><span className="pin" /><strong>FOCUS</strong><p>Find the gap.<br />Close the gap.</p></div>
      </section>

      <section className="journey-section"><div className="section-label"><span>01—08</span><h2>Learning journey</h2><span className="line" /></div><div className="journey-track" aria-label="Study journey progress">{journey.map((step, index) => <button className={`journey-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'complete' : ''}`} key={step.id} type="button" onClick={() => document.getElementById(`${step.id}-stage`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} aria-current={index === currentStep ? 'step' : undefined}><span className="step-number">{index < currentStep ? '✓' : step.short}</span><span className="step-label">{step.label}</span>{index < journey.length - 1 && <span className="step-arrow">→</span>}</button>)}</div></section>

      <section className="workspace-grid">
        <div className="plan-panel notebook paper-shadow" id="plan-stage"><div className="spiral spiral-left"><i /><i /><i /><i /><i /></div><div className="panel-heading"><div><span className="micro-label">TODAY / {hoursPerDay || '—'}H 00M</span><h2>{evaluation ? 'Adaptive plan' : 'Study plan'}</h2></div><span className="page-number">p. 01</span></div><div className="plan-progress"><span style={{ width: `${evaluation ? 100 : session ? 28 : 0}%` }} /></div><p className="plan-caption">{session ? evaluation ? 'Recalibrated after your diagnostic.' : 'A flexible route to exam-ready confidence.' : 'Start a session to map your route to exam-ready confidence.'}</p>{plan.length ? plan.map((item, index) => <div className={`plan-item ${item.status === 'priority' ? 'current' : ''}`} key={`${item.topic}-${index}`}><span className="check">{item.status === 'priority' ? '↑' : String(index + 1).padStart(2, '0')}</span><div><b>{item.title}</b><small>{item.reason || (item.status === 'priority' ? 'Priority topic from your diagnostic' : item.status === 'review' ? 'Keep this in review' : 'Planned study block')}</small></div><em>{item.minutes}m</em></div>) : <div className="empty-panel">Your first plan will appear here.</div>}{quiz.length > 0 && !evaluation && <DiagnosticQuiz quiz={quiz} answers={answers} answeredCount={answeredCount} loading={loading} onAnswer={handleAnswer} onSubmit={handleSubmitQuiz} />}{evaluation && <EvaluationSummary evaluation={evaluation} scorePercent={scorePercent} />}</div>

        <AgentActivity decisions={agentDecisions} loading={loading} sessionId={sessionId} evaluation={evaluation} progress={progress} error={error} />

        <div className="weak-panel paper-shadow" id="weak-stage"><div className="panel-heading"><div><span className="micro-label">{evaluation ? 'SIGNAL DETECTED' : 'AWAITING SIGNAL'}</span><h2>Weak topics</h2></div><span className="warning-mark">!</span></div><p className="panel-intro">{evaluation ? `${weakTopicNames.length} topic${weakTopicNames.length === 1 ? '' : 's'} flagged by your diagnostic.` : 'Your diagnostic results will reveal where to focus.'}</p><div className="topic-list">{topicResults.length ? topicResults.filter((topic) => weakTopicNames.includes(topic.topic)).map((topic, index) => <button className={`topic-card topic-${index % 3} ${selectedWeakTopic === topic.topic ? 'selected' : ''}`} key={topic.topic} type="button" onClick={() => setSelectedTopic(topic.topic)}><span className="topic-score">{Math.round(topic.score * 100)}<small>%</small></span><span><b>{topic.topic}</b><small>{selectedWeakTopic === topic.topic ? 'Selected for practice' : 'Weak topic detected'}</small></span><span className="topic-arrow">↗</span></button>) : <div className="empty-panel">Weak topics will appear after evaluation.</div>}</div>{selectedWeakTopic && <div className="next-action"><span className="next-icon">✦</span><div><small>NEXT BEST ACTION</small><b>{practiceEvaluation ? practiceEvaluation.next_action : `Learn ${selectedWeakTopic}`}</b></div><span>→</span></div>}{selectedExplanation && <ExplanationPanel explanation={selectedExplanation} onUnderstand={() => setPracticeOpen(true)} />}{practice.length > 0 && <PracticePanel practice={practice} open={practiceOpen} answers={practiceAnswers} evaluation={practiceEvaluation} loading={loading} onAnswer={handlePracticeAnswer} onSubmit={handleSubmitPractice} />}</div>

        <div className="progress-panel" id="progress-stage"><div className="progress-head"><div><span className="micro-label">SIGNAL / {days || '—'} DAYS</span><h2>Learning progress</h2></div><span className="trend">{scorePercent == null ? '—' : `${scorePercent}%`} ↗</span></div>{progress ? <div className="progress-summary"><strong>{scorePercent}%</strong><span>current diagnostic score</span><div className="progress-facts"><span><b>{progress.completed_steps.length}</b> stages complete</span><span><b>{progress.weak_topics.length}</b> weak topics</span></div><small>Next: {progress.next_action}</small></div> : <div className="progress-summary"><strong>—</strong><span>awaiting diagnostic</span><small>Complete a session to track progress.</small></div>}<p className="progress-note"><b>{progress ? 'The route is adapting.' : 'You are warming up.'}</b> {progress ? 'Keep the next focused sprint small and specific.' : 'Start with one focused sprint today.'}</p></div>
      </section>

      <footer className="site-footer"><span>STUDYPILOT / LEARNING IN MOTION</span><span>BUILT FOR THE CURIOUS <b>✦</b></span></footer>
    </main>
  )
}

function DiagnosticQuiz({ quiz, answers, answeredCount, loading, onAnswer, onSubmit }) {
  return <div className="quiz-block" id="quiz-stage"><div className="quiz-heading"><div><span className="micro-label">DIAGNOSTIC / {String(quiz.length).padStart(2, '0')} QUESTIONS</span><strong>QUESTION SET</strong></div><b>{String(answeredCount).padStart(2, '0')} <span>/ {String(quiz.length).padStart(2, '0')}</span></b></div><div className="quiz-progress" aria-label={`${answeredCount} of ${quiz.length} questions answered`}><span style={{ width: `${(answeredCount / quiz.length) * 100}%` }} /></div>{quiz.map((question, index) => <fieldset className="quiz-question" key={question.id}><legend><span>QUESTION {String(index + 1).padStart(2, '0')} / {String(quiz.length).padStart(2, '0')}</span>{question.prompt}</legend>{question.options.map((option, optionIndex) => <label className={`quiz-option ${answers[question.id] === optionIndex ? 'chosen' : ''}`} key={option}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => onAnswer(question.id, optionIndex)} />{option}</label>)}</fieldset>)}<button className="quiz-submit" type="button" onClick={onSubmit} disabled={loading || answeredCount !== quiz.length}>{loading ? 'EVALUATING...' : 'SUBMIT DIAGNOSTIC'}<span>↗</span></button></div>
}

function EvaluationSummary({ evaluation, scorePercent }) {
  return <div className="evaluation-summary" id="evaluate-stage"><div className="evaluation-top"><div><span className="micro-label">DIAGNOSTIC COMPLETE</span><strong>{scorePercent}%</strong><small>DIAGNOSTIC SCORE</small></div><div className="weak-count"><b>{evaluation.weak_topics.length}</b><span>WEAK TOPIC{evaluation.weak_topics.length === 1 ? '' : 'S'} DETECTED</span></div></div><div className="flag-list">{evaluation.weak_topics.map((topic) => <span key={topic}>⚠ {topic}</span>)}</div><div className="evaluation-state"><span>⚡ PERFORMANCE ANALYZED</span><span>↻ STUDY PLAN RECALIBRATED</span></div></div>
}

function AgentActivity({ decisions, loading, sessionId, evaluation, progress, error }) {
  const latestStep = decisions.length
  return <div className="activity-panel" id="activity-stage"><div className="computer-shell"><div className="computer-top"><span>STUDYPILOT_OS / AGENT ACTIVITY</span><span>● REC</span></div><div className="computer-screen"><div className="screen-header"><span>LIVE TRACE / OBSERVABLE ACTIONS</span><span>{decisions.length ? `${decisions.length} STEPS` : 'WAITING'}</span></div><div className="agent-orbit"><div className="orbit-core">AI</div><i /><i /><i /></div><div className="agent-status"><span className={`pulse ${loading ? 'is-working' : ''}`} /> <b>{loading ? 'DECIDING NEXT ACTION' : evaluation ? 'PLAN RECALIBRATED' : sessionId ? 'DIAGNOSTIC READY' : 'READY TO STUDY'}</b></div><p className="agent-thought">{error || (evaluation ? 'The observable workflow moved from performance to targeted action.' : sessionId ? 'The diagnostic is ready. Show me what you know.' : 'Give me a goal and I will map your first move.')}</p><div className="trace-list">{decisions.length ? decisions.map((item, index) => <div className={`trace-row ${index === latestStep - 1 && loading ? 'active' : ''}`} key={`${item.step}-${item.tool}`}><span>{index === latestStep - 1 && loading ? '⚡ NOW' : '✓ STEP ' + String(item.step).padStart(2, '0')}</span><div><b>{actionLabels[item.tool] || item.tool}</b><small>{item.observation}</small></div></div>) : <div className="empty-trace">No agent decisions yet.</div>}{loading && <div className="trace-row active"><span>⚡ NOW</span><div><b>{evaluation ? 'ADAPTING STUDY PLAN' : 'UNDERSTANDING GOAL'}</b><small>Agent is working from the latest tool result.</small></div></div>}</div></div><div className="computer-controls"><span>▣ MEMORY {progress ? progress.completed_steps.length : 0}</span><span>◉ BOUNDED LOOP</span><span>⌁ V.1.0</span></div></div></div>
}

function ExplanationPanel({ explanation, onUnderstand }) {
  const takeaways = (explanation.key_takeaways || explanation.key_concepts || []).slice(0, 4)
  return <div className="explanation-panel"><div className="explanation-heading"><span className="micro-label">LEARN / {explanation.title || explanation.topic}</span><span className="learn-mark">✦</span></div><p className="explanation-core">{explanation.simple_explanation || explanation.what_it_means}</p><div className="explanation-section"><small>KEY CONCEPTS</small><ul>{takeaways.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="explanation-detail"><small>CONCRETE EXAMPLE</small><p>{explanation.concrete_example || explanation.simple_example}</p></div><div className="explanation-detail misconception"><small>COMMON MISCONCEPTION</small><p>{explanation.common_misconception || explanation.common_mistake}</p></div><div className="explanation-detail"><small>TAKEAWAY</small><p>{explanation.recommended_next_practice || explanation.next_step}</p></div><button className="learn-cta" type="button" onClick={onUnderstand}>I UNDERSTAND <span>→ PRACTICE</span></button></div>
}

function PracticePanel({ practice, open, answers, evaluation, loading, onAnswer, onSubmit }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const practiceItems = Array.isArray(practice) ? practice : []
  const answerState = answers && typeof answers === 'object' ? answers : {}
  const currentItem = practiceItems[currentQuestion] || null
  const options = currentItem && Array.isArray(currentItem.options) ? currentItem.options : []
  const isLastQuestion = currentQuestion === practiceItems.length - 1
  const canAdvance = currentItem && answerState[currentItem.id] !== undefined
  const advance = () => { if (isLastQuestion) onSubmit(); else setCurrentQuestion((index) => index + 1) }
  return <div className="practice-list"><div className="practice-head"><span className="micro-label">TARGETED PRACTICE / {practiceItems.length} QUESTIONS</span></div>{open && !evaluation && (currentItem ? <><div className="practice-progress"><span>QUESTION {String(currentQuestion + 1).padStart(2, '0')} / {String(practiceItems.length).padStart(2, '0')}</span><i><b style={{ width: `${((currentQuestion + 1) / practiceItems.length) * 100}%` }} /></i></div><article className="practice-question"><span>FOCUS / {currentItem.topic}</span><b>{currentItem.question || currentItem.prompt || 'Practice question unavailable.'}</b>{options.length > 0 ? options.map((option, optionIndex) => <label className={answerState[currentItem.id] === optionIndex ? 'chosen' : ''} key={option}><input type="radio" name={currentItem.id} checked={answerState[currentItem.id] === optionIndex} onChange={() => onAnswer(currentItem.id, optionIndex)} />{option}</label>) : <small className="practice-empty">No answer options are available for this question.</small>}</article><button className="quiz-submit" type="button" onClick={advance} disabled={loading || !canAdvance}>{loading ? 'EVALUATING...' : isLastQuestion ? 'CHECK ANSWERS' : 'NEXT QUESTION'}<span>↗</span></button></> : <div className="empty-panel">No targeted practice is available yet.</div>)}{evaluation && <div className="practice-result"><span className="micro-label">✓ PRACTICE COMPLETE</span><strong>{Math.round(evaluation.score * 100)}%</strong><p>Score: {evaluation.results.filter((item) => item.correct).length}/{evaluation.results.length}</p><b>Topic status: {evaluation.topic_status.toUpperCase()}</b><small>Next best action: {evaluation.next_action}</small><div className="practice-feedback">{evaluation.results.map((result) => <p key={result.practice_id}><b>{result.correct ? '✓ Correct' : '↻ Review'}</b> {result.explanation}</p>)}</div></div>}</div>
}

export default App
