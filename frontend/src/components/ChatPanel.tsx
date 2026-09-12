'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  RankInfo,
  ProfileUpdateResult,
  AgentToolCall
} from '@/lib/types';
import { sendAgentChatMessage, resetAgentSession, fetchAgentMemory } from '@/lib/api';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Lightbulb,
  GraduationCap,
  Award,
  Brain,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  BookOpen,
  HelpCircle,
  ClipboardCheck
} from 'lucide-react';

interface ChatPanelProps {
  chapterId: string;
  chapterTitle: string;
  studentRank?: RankInfo;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenPractice?: () => void;
  onOpenExamPrep?: () => void;
  onOpenRubric?: () => void;
  onProfileUpdated?: (update: ProfileUpdateResult) => void;
}

export default function ChatPanel({
  chapterId,
  chapterTitle,
  studentRank,
  initialPrompt,
  onClearInitialPrompt,
  onOpenPractice,
  onOpenExamPrep,
  onOpenRubric,
  onProfileUpdated
}: ChatPanelProps) {
  const sessionId = `session_student_001_${chapterId}`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your **Personalized AI Tutor** for **${chapterTitle}**, powered by **Google ADK**.\n\nI dynamically adjust to your learning pace and rank (${studentRank?.name || 'Novice Explorer'}), explain concepts from multiple angles (analogies, ELI5, mathematical depth), create practice questions, and help with exam prep.\n\nAsk me anything, or tap one of the personalized agent actions below!`,
      timestamp: 'Just now',
      memory_used: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<string | null>(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [isMemoryLoading, setIsMemoryLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([
      {
        id: `welcome-${chapterId}`,
        role: 'assistant',
        content: `👋 Hi! I'm your **Personalized AI Tutor** for **${chapterTitle}**, powered by **Google ADK**.\n\nI am fully grounded in this chapter's textbook material and dynamically adjust to your learning pace and rank (${studentRank?.name || 'Novice Explorer'}).\n\nAsk me anything about **${chapterTitle}**, request analogies, generate practice questions, or prepare high-yield exam sheets!`,
        timestamp: 'Just now',
        memory_used: true
      }
    ]);
  }, [chapterId, chapterTitle, studentRank?.name]);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendAgentChatMessage(chapterId, query, sessionId, undefined, chapterTitle);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tools_called: response.tools_called,
        memory_used: response.memory_used,
        action_payload: response.action_payload
      };

      setMessages((prev) => [...prev, botMsg]);

      // If student profile was updated by a tool (e.g. pace change or quiz evaluation)
      if (response.student_profile && onProfileUpdated) {
        // Trigger parent state refresh
        onProfileUpdated({
          xp_gained: 0,
          total_xp: response.student_profile.xp,
          score_pct: 0,
          old_rank: response.student_profile.rank,
          new_rank: response.student_profile.rank,
          ranked_up: false,
          chapter_mastery: response.student_profile.topic_mastery?.[chapterId] || 0
        });
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an issue connecting to the ADK agent service: ${err.message}. Please try again.`,
        timestamp: 'Error'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = async () => {
    try {
      await resetAgentSession(sessionId);
    } catch (e) {
      // Ignore reset failure
    }
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content: `Session refreshed. My ADK memory and tools are ready. What topic in **${chapterTitle}** shall we tackle next?`,
        timestamp: 'Just now',
        memory_used: true
      }
    ]);
  };

  const handleOpenMemoryModal = async () => {
    setIsMemoryModalOpen(true);
    setIsMemoryLoading(true);
    try {
      const data = await fetchAgentMemory('student_001');
      setMemoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMemoryLoading(false);
    }
  };

  const shortChapterTitle = chapterTitle.split(':')[0].trim();
  const quickPrompts = [
    `💡 Explain ${shortChapterTitle} with an intuitive analogy`,
    `📋 Generate a 5-mark scoring rubric for ${shortChapterTitle}`,
    `🎯 Create 2 practice questions on ${shortChapterTitle}`,
    `📚 High-yield exam traps & formulas for this chapter`,
    `⏱️ Adjust my learning pace to casual`,
    `🧠 What do you remember about my learning weaknesses?`
  ];

  const getToolDisplayName = (name: string) => {
    switch (name) {
      case 'search_chapter_content':
        return 'Textbook Search';
      case 'explain_concept':
        return 'Multi-Angle Explanation';
      case 'create_practice_questions':
        return 'Generate Practice Quiz';
      case 'get_exam_prep_summary':
        return 'Exam Strategy Prep';
      case 'generate_scoring_rubric':
        return 'Scoring Rubric Analysis';
      case 'get_student_learning_profile':
        return 'Calibrate Level & Pace';
      case 'adjust_student_learning_pace':
        return 'Adjust Learning Pace';
      case 'record_student_learning_note':
        return 'Record Learner Memory';
      case 'load_memory':
        return 'Recall Learner Memory';
      default:
        return name.replace(/_/g, ' ');
    }
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'search_chapter_content':
        return <BookOpen className="w-3 h-3 text-sky-500" />;
      case 'explain_concept':
        return <Lightbulb className="w-3 h-3 text-amber-500" />;
      case 'create_practice_questions':
        return <Award className="w-3 h-3 text-emerald-500" />;
      case 'get_exam_prep_summary':
        return <GraduationCap className="w-3 h-3 text-indigo-500" />;
      case 'generate_scoring_rubric':
        return <ClipboardCheck className="w-3 h-3 text-rose-500" />;
      case 'adjust_student_learning_pace':
        return <Clock className="w-3 h-3 text-violet-500" />;
      case 'load_memory':
      case 'record_student_learning_note':
      case 'get_student_learning_profile':
        return <Brain className="w-3 h-3 text-pink-500" />;
      default:
        return <Zap className="w-3 h-3 text-indigo-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
      {/* ADK Agent Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Google ADK Agent
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Active
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Personalized Tutor • Grounded in {chapterTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Memory Button */}
            <button
              onClick={handleOpenMemoryModal}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/50 dark:hover:bg-pink-900/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60 text-[11px] font-medium transition active:scale-95"
              title="Inspect ADK Learner Memory"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Memory</span>
            </button>

            {studentRank && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Lvl {studentRank.rank_id} {studentRank.name.split(' ')[0]}
              </span>
            )}

            <button
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Reset Conversation Session"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Agent Capabilities Status Ribbon */}
        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Multi-Angle Explanations
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              <Award className="w-3 h-3 text-amber-500" />
              Practice Generator
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              <GraduationCap className="w-3 h-3 text-blue-500" />
              Exam Prep
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
              <Clock className="w-3 h-3 text-purple-500" />
              Adaptive Pace
            </span>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          const hasTools = msg.tools_called && msg.tools_called.length > 0;
          const isToolsExpanded = expandedToolMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isBot
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[85%] group relative ${isBot ? 'text-slate-800 dark:text-slate-200' : 'text-white'}`}>
                {/* Agent Tool Execution Badges */}
                {isBot && hasTools && (
                  <div className="mb-2">
                    <button
                      onClick={() => setExpandedToolMsgId(isToolsExpanded ? null : msg.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50/70 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/60 text-[10px] text-indigo-700 dark:text-indigo-300 transition"
                    >
                      <Zap className="w-3 h-3 text-indigo-500" />
                      <span className="font-semibold">ADK Tools Executed:</span>
                      <span className="font-medium">
                        {msg.tools_called!.map((t) => getToolDisplayName(t.name)).join(', ')}
                      </span>
                      {isToolsExpanded ? (
                        <ChevronUp className="w-3 h-3 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      )}
                    </button>

                    {/* Collapsible Details on Tools */}
                    {isToolsExpanded && (
                      <div className="mt-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] space-y-1.5 animate-fadeIn">
                        {msg.tools_called!.map((t, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                            <span className="mt-0.5">{getToolIcon(t.name)}</span>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {getToolDisplayName(t.name)}
                              </span>
                              {t.args && Object.keys(t.args).length > 0 && (
                                <p className="text-[9px] text-slate-400 font-mono">
                                  {JSON.stringify(t.args)}
                                </p>
                              )}
                              {t.result_summary && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic">
                                  &quot;{t.result_summary}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl shadow-sm ${
                    isBot
                      ? 'bg-slate-100/95 dark:bg-slate-800/95 border border-slate-200/70 dark:border-slate-700/70'
                      : 'bg-indigo-600 rounded-tr-none text-white'
                  }`}
                >
                  <div className="prose prose-xs dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>
                </div>

                {/* Interactive Tool Action Cards */}
                {isBot && msg.action_payload && (
                  <div className="mt-2.5">
                    {msg.action_payload.type === 'practice' && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Practice Questions Ready
                            </p>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                              Calibrated for your level ({msg.action_payload.questions?.length || 2} questions)
                            </p>
                          </div>
                        </div>
                        {onOpenPractice && (
                          <button
                            onClick={onOpenPractice}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95 shrink-0"
                          >
                            Open Quiz
                          </button>
                        )}
                      </div>
                    )}

                    {msg.action_payload.type === 'exam_prep' && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                              High-Yield Exam Prep Sheet
                            </p>
                            <p className="text-[10px] text-blue-700 dark:text-blue-400">
                              Essential formulas, pitfalls, and memory mnemonics
                            </p>
                          </div>
                        </div>
                        {onOpenExamPrep && (
                          <button
                            onClick={onOpenExamPrep}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95 shrink-0"
                          >
                            View Sheet
                          </button>
                        )}
                      </div>
                    )}

                    {msg.action_payload.type === 'rubric' && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                              Suggested Scoring Rubric Ready
                            </p>
                            <p className="text-[10px] text-rose-700 dark:text-rose-400">
                              {msg.action_payload.rubric?.max_marks || 5} Marks • {msg.action_payload.rubric?.criteria?.length || 3} Marking Criteria Bands
                            </p>
                          </div>
                        </div>
                        {onOpenRubric && (
                          <button
                            onClick={onOpenRubric}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95 shrink-0"
                          >
                            Open Rubric
                          </button>
                        )}
                      </div>
                    )}

                    {msg.action_payload.type === 'pace_change' && (
                      <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-2 text-[11px] text-purple-800 dark:text-purple-300">
                        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>
                          Pace recalibrated to <strong>{msg.action_payload.new_pace}</strong>. Future questions and explanations will match this speed!
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isBot && (
                  <button
                    onClick={() => copyToClipboard(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 shadow-sm"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-500 font-medium ml-1">
                Google ADK Agent reasoning & executing tools...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium shrink-0 transition"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${chapterTitle} (ADK agent will personalize & execute tools)...`}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium shadow-md shadow-indigo-500/20 transition active:scale-95"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* ADK Learner Memory Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Google ADK Learner Memory
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Session & Long-term Context Bank
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 text-xs space-y-3.5">
              {isMemoryLoading ? (
                <div className="py-8 text-center text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-pink-500 animate-ping mr-2" />
                  Loading learner memory...
                </div>
              ) : memoryData ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Student</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                        {memoryData.student_name || 'Alex Rivera'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Rank</p>
                      <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        Level {memoryData.rank?.rank_id || 1}: {memoryData.rank?.name || 'Novice'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Adaptive Pace</p>
                      <p className="font-bold text-violet-600 dark:text-violet-400 mt-0.5 capitalize">
                        {memoryData.preferred_pace || 'Balanced'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Chapter Mastery</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {memoryData.topic_mastery?.[chapterId] ?? 68}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-pink-500" />
                      Tracked Weak Spots (ADK Memory Bank):
                    </p>
                    {memoryData.weak_spots && memoryData.weak_spots.length > 0 ? (
                      <div className="space-y-1">
                        {memoryData.weak_spots.map((ws: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-pink-50/70 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900/60 text-[11px] text-pink-800 dark:text-pink-300"
                          >
                            • {ws}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No specific weak spots recorded yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-400">Could not load memory.</p>
              )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-right">
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
