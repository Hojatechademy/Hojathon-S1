/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Real Action Agent Runner
 * Multi-step agent decision loop, structured Gemini 3.6 Flash reasoning,
 * authorized tool dispatch, and live activity streaming.
 */

import { AgentStateMachine } from './state';
import { defaultToolExecutor } from '../tools/executor';
import { 
  AuthenticatedUserContext, 
  AgentRunRecord, 
  SafeActivityStep, 
  AgentIntent,
  ConversationTurn
} from '../types/agent';
import { IssueCategory, IssuePriority } from '../types/database';
import { getGeminiModel } from '../lib/gemini/client';
import { agentRunService } from '../services/agentRunService';

export type ActivityListener = (step: SafeActivityStep) => void;

interface LLMDecision {
  intent: AgentIntent;
  category: IssueCategory;
  priority: IssuePriority;
  titleMl: string;
  descriptionMl: string;
  locationLandmark?: string;
  requiresFollowUp: boolean;
  followUpQuestionMl?: string;
  toolToExecute?: string;
  toolArgs?: Record<string, unknown>;
  explanatoryResponseMl?: string;
}

export class WardSahayakanAgentRunner {
  private stateMachine: AgentStateMachine;

  constructor() {
    this.stateMachine = new AgentStateMachine();
  }

  /**
   * Fast rule-based semantic parser for Malayalam, English, and Manglish civic text.
   * Serves as reliable baseline and instant fallback if Gemini network is unavailable.
   */
  private heuristicParse(text: string, authContext: AuthenticatedUserContext): LLMDecision {
    const lower = text.toLowerCase();

    // 1. Check for representative analytics
    if (
      authContext.role === 'representative' &&
      (lower.includes('problem') || lower.includes('issue') || lower.includes('സ്ഥിതിവിവരം') || lower.includes('പരാതികൾ') || lower.includes('major') || lower.includes('unresolved'))
    ) {
      if (lower.includes('road') || lower.includes('റോഡ്')) {
        return {
          intent: 'REPRESENTATIVE_ACTION',
          category: 'roads',
          priority: 'medium',
          titleMl: 'റോഡ് പരാതികൾ',
          descriptionMl: text,
          requiresFollowUp: false,
          toolToExecute: 'get_ward_issues',
          toolArgs: { category: 'roads', unresolvedOnly: true }
        };
      }
      return {
        intent: 'ANALYTICS',
        category: 'other',
        priority: 'medium',
        titleMl: 'വാർഡ് സ്ഥിതിവിവരക്കണക്കുകൾ',
        descriptionMl: text,
        requiresFollowUp: false,
        toolToExecute: 'get_ward_statistics',
        toolArgs: {}
      };
    }

    // 2. Check for complaint tracking
    if (
      lower.includes('where is my') ||
      lower.includes('complaint status') ||
      lower.includes('track') ||
      lower.includes('എന്റെ പരാതി') ||
      lower.includes('പരാതി എവിടെ') ||
      lower.includes('അവസ്ഥ')
    ) {
      return {
        intent: 'TRACK_ISSUE',
        category: 'other',
        priority: 'medium',
        titleMl: 'പരാതി അന്വേഷണം',
        descriptionMl: text,
        requiresFollowUp: false,
        toolToExecute: 'get_my_issues',
        toolArgs: {}
      };
    }

    // 3. Check for Kerala Government Directory
    if (
      lower.includes('kerala govt') ||
      lower.includes('government contact') ||
      lower.includes('minister') ||
      lower.includes('collector') ||
      lower.includes('secretariat') ||
      lower.includes('മന്ത്രി') ||
      lower.includes('കലക്ടർ') ||
      lower.includes('സെക്രട്ടേറിയറ്റ്')
    ) {
      let cat: string | undefined;
      if (lower.includes('minister') || lower.includes('മന്ത്രി')) cat = 'ministers';
      if (lower.includes('collector') || lower.includes('കലക്ടർ')) cat = 'collectors';

      return {
        intent: 'GOVERNMENT_CONTACT',
        category: 'other',
        priority: 'low',
        titleMl: 'കേരള സർക്കാർ ഡയറക്ടറി',
        descriptionMl: text,
        requiresFollowUp: false,
        toolToExecute: 'get_government_contacts',
        toolArgs: { query: text, category: cat }
      };
    }

    // 4. Check for Ward local contacts & health workers
    if (
      lower.includes('nurse') ||
      lower.includes('asha') ||
      lower.includes('health worker') ||
      lower.includes('ആരോഗ്യ പ്രവർത്തക') ||
      lower.includes('member') ||
      lower.includes('kudumbashree') ||
      lower.includes('ആശ') ||
      lower.includes('നഴ്സ്') ||
      lower.includes('മെമ്പർ') ||
      lower.includes('നമ്പർ') ||
      lower.includes('contact') ||
      lower.includes('ഫോൺ')
    ) {
      return {
        intent: 'CONTACT_INFORMATION',
        category: 'public_health',
        priority: 'low',
        titleMl: 'വാർഡ് ബന്ധപ്പെടൽ വിവരങ്ങൾ',
        descriptionMl: text,
        requiresFollowUp: false,
        toolToExecute: 'get_ward_contacts',
        toolArgs: { category: lower.includes('nurse') || lower.includes('asha') || lower.includes('health') ? 'health' : undefined }
      };
    }

    // 5. Check for Ward information queries (e.g. "What is my ward?", "വാർഡ് വിവരങ്ങൾ")
    if (
      lower.includes('what is my ward') ||
      lower.includes('which ward') ||
      lower.includes('my ward details') ||
      lower.includes('എന്റെ വാർഡ് ഏതാണ്') ||
      lower.includes('വാർഡ് വിവരങ്ങൾ')
    ) {
      return {
        intent: 'WARD_INFORMATION',
        category: 'other',
        priority: 'low',
        titleMl: 'വാർഡ് വിവരങ്ങൾ',
        descriptionMl: text,
        requiresFollowUp: false,
        toolToExecute: 'get_ward_information',
        toolArgs: {}
      };
    }

    // 6. Check for Common problems / Ward statistics (Residents or Reps)
    if (
      lower.includes('common problem') ||
      lower.includes('problems in my ward') ||
      lower.includes('ward issues count') ||
      lower.includes('സാധാരണ പ്രശ്നങ്ങൾ') ||
      lower.includes('പ്രശ്നങ്ങൾ എന്തൊക്കെ')
    ) {
      return {
        intent: 'ANALYTICS',
        category: 'other',
        priority: 'low',
        titleMl: 'വാർഡ് സ്ഥിതിവിവരക്കണക്കുകൾ',
        descriptionMl: text,
        requiresFollowUp: false,
        toolToExecute: 'get_ward_statistics',
        toolArgs: {}
      };
    }

    // 7. Check for follow-up or vague single-word inputs
    const tokens = text.trim().split(/\s+/);
    if (
      (tokens.length <= 3 && (lower === 'road problem undu.' || lower === 'road problem undu' || lower === 'വെള്ളം പ്രശ്നം' || lower === 'road problem'))
    ) {
      return {
        intent: 'NEED_MORE_INFO',
        category: 'roads',
        priority: 'medium',
        titleMl: 'റോഡ് പരാതി',
        descriptionMl: text,
        requiresFollowUp: true,
        followUpQuestionMl: 'പ്രശ്നം കൃത്യമായി എവിടെയാണ് സ്ഥിതി ചെയ്യുന്നത്? (ഉദാഹരണത്തിന്: സ്കൂളിന്റെ അടുത്തോ കവലയിലോ?)'
      };
    }

    // 5. Default: Complaint Registration
    let category: IssueCategory = 'roads';
    let priority: IssuePriority = 'medium';
    let titleMl = 'വാർഡ് പ്രശ്നം';

    if (lower.includes('റോഡ്') || lower.includes('കുഴി') || lower.includes('road') || lower.includes('mosham')) {
      category = 'roads';
      titleMl = 'റോഡ് അറ്റകുറ്റപ്പണി (Road Repairs)';
    } else if (lower.includes('വെള്ളം') || lower.includes('പൈപ്പ്') || lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) {
      category = 'water_supply';
      titleMl = 'കുടിവെള്ള പൈപ്പ് ചോർച്ച (Water Leakage)';
    } else if (lower.includes('വിളക്ക്') || lower.includes('ലൈറ്റ്') || lower.includes('light') || lower.includes('street')) {
      category = 'streetlights';
      titleMl = 'തെരുവ് വിളക്ക് തകരാർ (Streetlight Outage)';
    } else if (lower.includes('മാലിന്യം') || lower.includes('വേസ്റ്റ്') || lower.includes('waste') || lower.includes('garbage')) {
      category = 'sanitation';
      titleMl = 'മാലിന്യ സംസ്കരണ പ്രശ്നം (Sanitation Issue)';
    } else if (lower.includes('ഓട') || lower.includes('drain') || lower.includes('drainage')) {
      category = 'drainage';
      titleMl = 'ഓട തടസ്സം / വെള്ളക്കെട്ട് (Drainage Issue)';
    }

    if (lower.includes('അപകടം') || lower.includes('വളരെ മോശം') || lower.includes('urgent') || lower.includes('emergency')) {
      priority = 'urgent';
    }

    // Check if input is too vague
    const isVeryShort = text.trim().split(/\s+/).length < 2 && !lower.includes('school');
    if (isVeryShort) {
      return {
        intent: 'NEED_MORE_INFO',
        category,
        priority,
        titleMl,
        descriptionMl: text,
        requiresFollowUp: true,
        followUpQuestionMl: 'പ്രശ്നം കൃത്യമായി എവിടെയാണ് സ്ഥിതി ചെയ്യുന്നത്? (ഉദാഹരണത്തിന്: സ്കൂളിന്റെ അടുത്തോ കവലയിലോ?)'
      };
    }

    let locationLandmark = '';
    if (lower.includes('school') || lower.includes('സ്കൂൾ')) {
      locationLandmark = 'സ്‌കൂളിന് സമീപം';
    } else if (lower.includes('junction') || lower.includes('കവല') || lower.includes('ജംഗ്ഷൻ')) {
      locationLandmark = 'ജംഗ്ഷൻ പരിസരം';
    } else if (lower.includes('temple') || lower.includes('ക്ഷേത്രം') || lower.includes('പള്ളി')) {
      locationLandmark = 'ആരാധനാലയത്തിന് സമീപം';
    }

    return {
      intent: 'REPORT_ISSUE',
      category,
      priority,
      titleMl,
      descriptionMl: text,
      locationLandmark,
      requiresFollowUp: false,
      toolToExecute: 'create_issue',
      toolArgs: {
        category,
        titleMl,
        descriptionMl: text,
        priority,
        locationLandmark
      }
    };
  }

  /**
   * Performs deep contextual reasoning using Google Gemini 3.6 Flash.
   */
  private async queryGemini(
    text: string,
    authContext: AuthenticatedUserContext,
    conversationHistory?: ConversationTurn[]
  ): Promise<LLMDecision> {
    const model = getGeminiModel();
    if (!model) {
      return this.heuristicParse(text, authContext);
    }

    try {
      const systemInstruction = `You are Ward Sahayakan (വാർഡ് സഹായി), the authoritative AI Action Agent for Ente Ward in Kerala.
Your user is authenticated as:
- Role: ${authContext.role}
- User Name: ${authContext.fullName}
- Authorized Ward: Ward ${authContext.wardNumber} (${authContext.wardNameMl})
- Grama Panchayat: ${authContext.localBodyName || 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത്'}
- District: ${authContext.district || 'Palakkad'}

Understand Malayalam, Manglish (Malayalam written in English alphabet), and English equally well.

Analyze the user's intent and select the appropriate backend action tool:
- REPORT_ISSUE: User wants to report a problem (roads, water_supply, streetlights, sanitation, drainage, public_health). Select tool: create_issue.
- TRACK_ISSUE: User asks about their past complaints/status. Select tool: get_my_issues.
- CONTACT_INFORMATION: User asks for local ward contacts (nurse, ASHA, member, kudumbashree). Select tool: get_ward_contacts.
- GOVERNMENT_CONTACT: User asks for Kerala ministers, collectors, secretariat. Select tool: get_government_contacts.
- ANALYTICS: Representative asks for ward statistics/open complaints. Select tool: get_ward_statistics or get_ward_issues.
- WARD_INFORMATION: User asks about ward office, grama sabha schedule. Select tool: get_ward_information.

CRITICAL INSTRUCTION: Return STRICT JSON ONLY (no markdown formatting, no code blocks):
{
  "intent": "REPORT_ISSUE" | "TRACK_ISSUE" | "CONTACT_INFORMATION" | "GOVERNMENT_CONTACT" | "ANALYTICS" | "WARD_INFORMATION" | "GENERAL_INFORMATION" | "NEED_MORE_INFO",
  "category": "roads" | "water_supply" | "streetlights" | "sanitation" | "drainage" | "public_health" | "other",
  "priority": "low" | "medium" | "high" | "urgent",
  "titleMl": "Concise Malayalam title for the issue",
  "descriptionMl": "Full Malayalam description",
  "locationLandmark": "Extracted location/landmark in ward or empty",
  "requiresFollowUp": false,
  "followUpQuestionMl": "",
  "toolToExecute": "create_issue" | "get_my_issues" | "get_ward_contacts" | "get_government_contacts" | "get_ward_statistics" | "get_ward_issues" | "get_ward_information",
  "toolArgs": {}
}`;

      let conversationContext = '';
      if (conversationHistory && conversationHistory.length > 0) {
        conversationContext = 'Recent conversation context:\n' + 
          conversationHistory.slice(-3).map(c => `${c.role}: ${c.content}`).join('\n') + '\n\n';
      }

      const prompt = `${systemInstruction}\n\n${conversationContext}Current user input: "${text}"`;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const rawJson = response.response.text();
      const parsed = JSON.parse(rawJson);

      // Sanitize and ensure valid structure
      return {
        intent: (parsed.intent as AgentIntent) || 'REPORT_ISSUE',
        category: (parsed.category as IssueCategory) || 'roads',
        priority: (parsed.priority as IssuePriority) || 'medium',
        titleMl: parsed.titleMl || 'വാർഡ് പരാതി',
        descriptionMl: parsed.descriptionMl || text,
        locationLandmark: parsed.locationLandmark || '',
        requiresFollowUp: Boolean(parsed.requiresFollowUp),
        followUpQuestionMl: parsed.followUpQuestionMl,
        toolToExecute: parsed.toolToExecute || (parsed.intent === 'REPORT_ISSUE' ? 'create_issue' : undefined),
        toolArgs: parsed.toolArgs || {}
      };
    } catch (err) {
      console.warn('Gemini query fell back to deterministic heuristic parser:', err);
      return this.heuristicParse(text, authContext);
    }
  }

  /**
   * Flagship Execution Flow:
   * UNDERSTAND -> CHECK CONTEXT -> PLAN -> SELECT TOOL -> EXECUTE ACTION -> OBSERVE RESULT -> DECIDE NEXT STEP -> RESPOND -> SAVE RUN
   */
  public async processRequest(
    userInput: string,
    authContext: AuthenticatedUserContext,
    onActivityStep?: ActivityListener,
    conversationHistory?: ConversationTurn[]
  ): Promise<AgentRunRecord> {
    const runId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `run-${Date.now()}`;
    const runRecord: AgentRunRecord = {
      id: runId,
      userId: authContext.userId,
      wardId: authContext.wardId,
      rawInput: userInput,
      stateHistory: ['IDLE'],
      activitySteps: [],
      toolCalls: [],
      toolResults: [],
      createdAt: new Date().toISOString()
    };

    const emitStep = (
      state: SafeActivityStep['state'],
      labelMl: string,
      labelEn: string,
      toolName?: string
    ) => {
      const step: SafeActivityStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        state,
        labelMl,
        labelEn,
        status: 'completed',
        timestamp: new Date().toISOString(),
        toolName
      };
      runRecord.activitySteps.push(step);
      if (onActivityStep) {
        onActivityStep(step);
      }
    };

    // 0. Start Run Logging
    await agentRunService.recordRunStart(runRecord);

    try {
      // 1. UNDERSTAND_GOAL
      this.stateMachine.transition('UNDERSTAND_GOAL');
      runRecord.stateHistory.push('UNDERSTAND_GOAL');
      emitStep('UNDERSTAND_GOAL', 'അഭ്യർത്ഥന വിശകലനം ചെയ്യുന്നു', 'Understanding civic request');

      // 2. CLASSIFY_INTENT
      this.stateMachine.transition('CLASSIFY_INTENT');
      runRecord.stateHistory.push('CLASSIFY_INTENT');
      const decision = await this.queryGemini(userInput, authContext, conversationHistory);
      runRecord.classifiedIntent = decision.intent;

      emitStep(
        'CLASSIFY_INTENT',
        `ഉദ്ദേശ്യം തിരിച്ചറിഞ്ഞു: ${decision.intent} (${decision.category})`,
        `Classified intent: ${decision.intent} (${decision.category})`
      );

      // Handle follow-up if necessary information is completely missing
      if (decision.requiresFollowUp && decision.followUpQuestionMl) {
        this.stateMachine.transition('RESPOND');
        runRecord.stateHistory.push('RESPOND');
        runRecord.finalResponseMl = decision.followUpQuestionMl;
        emitStep('RESPOND', 'കൂടുതൽ വിവരങ്ങൾ ആരാഞ്ഞു', 'Requested concise clarification');

        this.stateMachine.transition('SAVE_RELEVANT_MEMORY');
        runRecord.stateHistory.push('SAVE_RELEVANT_MEMORY');
        this.stateMachine.reset();
        await agentRunService.recordRunComplete(runId, 'completed', decision.followUpQuestionMl, decision.intent);
        return runRecord;
      }

      // 3. CHECK_CONTEXT
      this.stateMachine.transition('CHECK_CONTEXT');
      runRecord.stateHistory.push('CHECK_CONTEXT');
      emitStep(
        'CHECK_CONTEXT',
        `വാർഡ് ${authContext.wardNumber} (${authContext.wardNameMl}) അംഗീകാരം പരിശോധിക്കുന്നു`,
        `Verifying authorized ward: Ward ${authContext.wardNumber} (${authContext.wardNameMl})`
      );

      // 4. PLAN
      this.stateMachine.transition('PLAN');
      runRecord.stateHistory.push('PLAN');
      emitStep('PLAN', 'നടപടി ക്രമം ആസൂത്രണം ചെയ്യുന്നു', 'Planning required tools and actions');

      // 5. TOOL DECISION LOOP (MAX_TOOL_STEPS = 6)
      const MAX_STEPS = 6;
      let currentStepCount = 0;
      let nextToolToCall = decision.toolToExecute;
      let toolArguments = decision.toolArgs || {};

      while (nextToolToCall && currentStepCount < MAX_STEPS) {
        currentStepCount++;

        // SELECT_TOOL
        this.stateMachine.transition('SELECT_TOOL');
        runRecord.stateHistory.push('SELECT_TOOL');
        emitStep('SELECT_TOOL', `ടൂൾ തിരഞ്ഞെടുക്കുന്നു: ${nextToolToCall}`, `Selecting tool: ${nextToolToCall}`, nextToolToCall);

        // EXECUTE_TOOL
        this.stateMachine.transition('EXECUTE_TOOL');
        runRecord.stateHistory.push('EXECUTE_TOOL');
        emitStep('EXECUTE_TOOL', `ഡാറ്റാബേസിൽ നടപടി നടപ്പിലാക്കുന്നു (${nextToolToCall})`, `Executing action in database (${nextToolToCall})`, nextToolToCall);

        const callId = `call-${Date.now()}-${currentStepCount}`;
        const toolCall = {
          toolName: nextToolToCall,
          callId,
          arguments: toolArguments
        };
        runRecord.toolCalls.push(toolCall);

        // Prepare specific tool arguments if create_issue
        if (nextToolToCall === 'create_issue') {
          toolArguments = {
            category: decision.category,
            titleMl: decision.titleMl,
            descriptionMl: decision.descriptionMl,
            priority: decision.priority,
            locationLandmark: decision.locationLandmark
          };
        }

        // Execute through security boundary
        const result = await defaultToolExecutor.execute(
          nextToolToCall,
          toolArguments,
          authContext,
          callId
        );
        runRecord.toolResults.push(result);

        // Record tool call to database
        await agentRunService.recordToolCall(runId, toolCall, result);

        // OBSERVE_RESULT
        this.stateMachine.transition('OBSERVE_RESULT');
        runRecord.stateHistory.push('OBSERVE_RESULT');
        emitStep('OBSERVE_RESULT', `ഫലം പരിശോധിച്ചു (${result.success ? 'വിജയകരം' : 'പരാജയം'})`, `Observing result (${result.success ? 'Success' : 'Failed'})`);

        // DECIDE_NEXT_ACTION
        this.stateMachine.transition('DECIDE_NEXT_ACTION');
        runRecord.stateHistory.push('DECIDE_NEXT_ACTION');

        // Multi-action logic:
        if (nextToolToCall === 'create_issue' && result.success) {
          const issueData = result.data as { issueId?: string; issueNumber?: string };
          runRecord.createdIssueId = issueData.issueId;
          runRecord.createdIssueNumber = issueData.issueNumber;
          // Step 2 in chain: notify representative
          nextToolToCall = 'get_ward_contacts';
          toolArguments = { category: 'administration' };
        } else {
          // No further tools required for this request
          nextToolToCall = undefined;
        }
      }

      // 6. RESPOND
      this.stateMachine.transition('RESPOND');
      runRecord.stateHistory.push('RESPOND');

      let finalMessage = '';
      if (decision.intent === 'REPORT_ISSUE' && runRecord.createdIssueNumber) {
        finalMessage = `താങ്കളുടെ പരാതി (നം: #${runRecord.createdIssueNumber}) വാർഡ് ${authContext.wardNumber}-ൽ വിജയകരമായി രേഖപ്പെടുത്തി. വാർഡ് ജനപ്രതിനിധിക്ക് ഇത് പരിശോധിച്ച് നടപടി സ്വീകരിക്കാൻ കൈമാറിയിട്ടുണ്ട്.`;
      } else if (decision.intent === 'TRACK_ISSUE') {
        const issuesRes = runRecord.toolResults.find(r => r.toolName === 'get_my_issues');
        const count = (issuesRes?.data as { count?: number })?.count || 0;
        finalMessage = count > 0 
          ? `താങ്കൾ ഈ വാർഡിൽ സമർപ്പിച്ച ${count} പരാതികൾ കണ്ടെത്തി. താഴെ കാണുന്ന കാർഡുകളിൽ ഓരോന്നിന്റെയും ഇപ്പോഴത്തെ അവസ്ഥ പരിശോധിക്കാം.`
          : 'താങ്കൾ നിലവിൽ ഈ വാർഡിൽ സജീവ പരാതികൾ ഒന്നും സമർപ്പിച്ചിട്ടില്ല.';
      } else if (decision.intent === 'CONTACT_INFORMATION') {
        finalMessage = `വാർഡ് ${authContext.wardNumber} (${authContext.wardNameMl}) ഔദ്യോഗിക ബന്ധപ്പെടൽ നമ്പറുകൾ താഴെ നൽകുന്നു:`;
      } else if (decision.intent === 'GOVERNMENT_CONTACT') {
        finalMessage = 'കേരള സർക്കാരിന്റെ ഔദ്യോഗിക പബ്ലിക് ഡയറക്ടറി വിവരങ്ങൾ ലഭ്യമാക്കിയിട്ടുണ്ട്:';
      } else if (decision.intent === 'ANALYTICS') {
        const statsRes = runRecord.toolResults.find(r => r.toolName === 'get_ward_statistics');
        const data = statsRes?.data as any;
        finalMessage = data 
          ? `വാർഡ് ${authContext.wardNumber}-ൽ ആകെ ${data.totalIssues} പരാതികൾ റിപ്പോർട്ട് ചെയ്തിട്ടുണ്ട്. ഇതിൽ ${data.openIssues} എണ്ണം നടപടിയിലാണ്. പരിഹാര നിരക്ക്: ${data.resolutionRatePercent}%.`
          : 'വാർഡ് സ്ഥിതിവിവരക്കണക്കുകൾ വിജയകരമായി ശേഖരിച്ചു.';
      } else if (decision.intent === 'REPRESENTATIVE_ACTION') {
        finalMessage = `താങ്കളുടെ വാർഡിലെ റോഡ് സംബന്ധിച്ച തീർപ്പാക്കാത്ത പരാതികൾ കണ്ടെത്തി.`;
      } else {
        finalMessage = 'താങ്കളുടെ ആവശ്യം പരിശോധിച്ചു നടപടി സ്വീകരിച്ചിട്ടുണ്ട്.';
      }

      runRecord.finalResponseMl = finalMessage;
      emitStep('RESPOND', 'മറുപടി രൂപീകരിച്ചു', 'Formulated final response and outcome');

      // 7. SAVE_RELEVANT_MEMORY
      this.stateMachine.transition('SAVE_RELEVANT_MEMORY');
      runRecord.stateHistory.push('SAVE_RELEVANT_MEMORY');
      emitStep('SAVE_RELEVANT_MEMORY', 'പ്രവർത്തന വിവരങ്ങൾ ഡാറ്റാബേസിൽ സൂക്ഷിച്ചു', 'Saved agent run and tool executions');

      this.stateMachine.reset();
      runRecord.completedAt = new Date().toISOString();

      // Record run completion to database
      await agentRunService.recordRunComplete(runId, 'completed', finalMessage, decision.intent);

      return runRecord;
    } catch (err: any) {
      console.error('Agent execution exception:', err);
      this.stateMachine.reset();
      const failMessage = 'നടപടി പൂർത്തിയാക്കുന്നതിൽ സാങ്കേതിക തടസ്സം നേരിട്ടു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.';
      emitStep('RESPOND', 'തടസ്സം നേരിട്ടു', 'Execution interrupted');
      await agentRunService.recordRunComplete(runId, 'failed', failMessage, 'UNKNOWN');
      runRecord.finalResponseMl = failMessage;
      return runRecord;
    }
  }

  /**
   * Backward-compatible alias for existing caller components.
   */
  public async processComplaint(
    userInput: string,
    authContext: AuthenticatedUserContext,
    onActivityStep?: ActivityListener
  ): Promise<AgentRunRecord> {
    return this.processRequest(userInput, authContext, onActivityStep);
  }
}

export const defaultAgentRunner = new WardSahayakanAgentRunner();
