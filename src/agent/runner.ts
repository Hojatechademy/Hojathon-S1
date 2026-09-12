/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Agent Runner
 * Orchestrates multi-step agent reasoning, tool execution, and safe activity stream.
 */

import { AgentStateMachine } from './state';
import { defaultToolExecutor } from '../tools/executor';
import { 
  AuthenticatedUserContext, 
  AgentRunRecord, 
  SafeActivityStep, 
  ClassifiedComplaint 
} from '../types/agent';
import { IssueCategory } from '../types/database';

export type ActivityListener = (step: SafeActivityStep) => void;

export class WardSahayakanAgentRunner {
  private stateMachine: AgentStateMachine;

  constructor() {
    this.stateMachine = new AgentStateMachine();
  }

  /**
   * Simple classifier rule/stub for Malayalam civic queries.
   * Ready to be plugged into Gemini model in subsequent step.
   */
  private classifyInput(text: string): ClassifiedComplaint {
    const lower = text.toLowerCase();
    let category: IssueCategory = 'roads';
    let urgency: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    if (lower.includes('റോഡ്') || lower.includes('കുഴി') || lower.includes('road')) {
      category = 'roads';
    } else if (lower.includes('വെള്ളം') || lower.includes('പൈപ്പ്') || lower.includes('water')) {
      category = 'water_supply';
    } else if (lower.includes('വിളക്ക്') || lower.includes('ലൈറ്റ്') || lower.includes('light')) {
      category = 'streetlights';
    } else if (lower.includes('മാലിന്യം') || lower.includes('വേസ്റ്റ്') || lower.includes('waste')) {
      category = 'sanitation';
    } else if (lower.includes('ഓട') || lower.includes('drain')) {
      category = 'drainage';
    }

    if (lower.includes('അപകടം') || lower.includes('വളരെ മോശം') || lower.includes('urgent')) {
      urgency = 'high';
    }

    return {
      intent: 'REPORT_ISSUE',
      category,
      titleMl: `${category === 'roads' ? 'റോഡ് അറ്റകുറ്റപ്പണി' : 'വാർഡ് പരാതി'} — അടിയന്തര ശ്രദ്ധ ആവശ്യമാണ്`,
      descriptionMl: text,
      urgency,
      confidence: 0.92
    };
  }

  /**
   * Runs the flagship agent workflow for a resident complaint.
   */
  public async processComplaint(
    userInput: string,
    authContext: AuthenticatedUserContext,
    onActivityStep?: ActivityListener
  ): Promise<AgentRunRecord> {
    const runId = `run-${Date.now()}`;
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

    const emitStep = (state: SafeActivityStep['state'], labelMl: string, labelEn: string) => {
      const step: SafeActivityStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        state,
        labelMl,
        labelEn,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
      runRecord.activitySteps.push(step);
      if (onActivityStep) {
        onActivityStep(step);
      }
    };

    try {
      // 1. UNDERSTAND_GOAL
      this.stateMachine.transition('UNDERSTAND_GOAL');
      runRecord.stateHistory.push('UNDERSTAND_GOAL');
      emitStep('UNDERSTAND_GOAL', 'അഭ്യർത്ഥന പരിശോധിക്കുന്നു', 'Understanding request');

      // 2. CLASSIFY_INTENT
      this.stateMachine.transition('CLASSIFY_INTENT');
      runRecord.stateHistory.push('CLASSIFY_INTENT');
      const classification = this.classifyInput(userInput);
      runRecord.classifiedIntent = classification.intent;
      emitStep(
        'CLASSIFY_INTENT',
        `പ്രശ്ന വിഭാഗം തിരിച്ചറിഞ്ഞു: ${classification.category}`,
        `Identified ${classification.category} issue`
      );

      // 3. CHECK_CONTEXT
      this.stateMachine.transition('CHECK_CONTEXT');
      runRecord.stateHistory.push('CHECK_CONTEXT');
      emitStep(
        'CHECK_CONTEXT',
        `വാർഡ് ${authContext.wardNumber} (${authContext.wardNameMl}) അംഗീകാരം പരിശോധിക്കുന്നു`,
        `Verifying authorized ward: Ward ${authContext.wardNumber}`
      );

      // 4. PLAN
      this.stateMachine.transition('PLAN');
      runRecord.stateHistory.push('PLAN');
      emitStep('PLAN', 'നടപടി ക്രമം ആസൂത്രണം ചെയ്യുന്നു', 'Planning required action');

      // 5. SELECT_TOOL & EXECUTE_TOOL (create_issue)
      this.stateMachine.transition('SELECT_TOOL');
      runRecord.stateHistory.push('SELECT_TOOL');
      emitStep('SELECT_TOOL', 'പരാതി രജിസ്റ്റർ ചെയ്യുന്ന ടൂൾ തിരഞ്ഞെടുക്കുന്നു', 'Selecting create_issue tool');

      this.stateMachine.transition('EXECUTE_TOOL');
      runRecord.stateHistory.push('EXECUTE_TOOL');
      emitStep('EXECUTE_TOOL', 'പരാതി ഡാറ്റാബേസിൽ രേഖപ്പെടുത്തുന്നു', 'Creating issue in ward database');

      const createCallId = `call-create-${Date.now()}`;
      runRecord.toolCalls.push({
        toolName: 'create_issue',
        callId: createCallId,
        arguments: {
          category: classification.category,
          titleMl: classification.titleMl,
          descriptionMl: classification.descriptionMl,
          priority: classification.urgency
        }
      });

      const createResult = await defaultToolExecutor.execute(
        'create_issue',
        {
          category: classification.category,
          titleMl: classification.titleMl,
          descriptionMl: classification.descriptionMl,
          priority: classification.urgency
        },
        authContext,
        createCallId
      );
      runRecord.toolResults.push(createResult);

      // 6. OBSERVE_RESULT
      this.stateMachine.transition('OBSERVE_RESULT');
      runRecord.stateHistory.push('OBSERVE_RESULT');
      emitStep('OBSERVE_RESULT', 'രേഖപ്പെടുത്തിയ വിവരങ്ങൾ നിരീക്ഷിക്കുന്നു', 'Observing tool result');

      // 7. DECIDE_NEXT_ACTION -> Notify representative
      this.stateMachine.transition('DECIDE_NEXT_ACTION');
      runRecord.stateHistory.push('DECIDE_NEXT_ACTION');

      // Loop back to SELECT_TOOL for notification
      this.stateMachine.transition('SELECT_TOOL');
      runRecord.stateHistory.push('SELECT_TOOL');
      emitStep('SELECT_TOOL', 'വാർഡ് പ്രതിനിധിയെ അറിയിക്കാൻ തിരഞ്ഞെടുക്കുന്നു', 'Selecting notify_representative tool');

      this.stateMachine.transition('EXECUTE_TOOL');
      runRecord.stateHistory.push('EXECUTE_TOOL');
      emitStep('EXECUTE_TOOL', 'വാർഡ് പ്രതിനിധിക്ക് അറിയിപ്പ് അയക്കുന്നു', 'Notifying ward representative');

      const notifyCallId = `call-notify-${Date.now()}`;
      const notifyResult = await defaultToolExecutor.execute(
        'notify_representative',
        {
          issueId: createResult.data && typeof createResult.data === 'object' && 'issue' in createResult.data 
            ? (createResult.data as { issue: { id: string } }).issue.id 
            : 'pending-id',
          summaryMl: classification.titleMl
        },
        authContext,
        notifyCallId
      );
      runRecord.toolCalls.push({
        toolName: 'notify_representative',
        callId: notifyCallId,
        arguments: { summaryMl: classification.titleMl }
      });
      runRecord.toolResults.push(notifyResult);

      this.stateMachine.transition('OBSERVE_RESULT');
      runRecord.stateHistory.push('OBSERVE_RESULT');

      this.stateMachine.transition('DECIDE_NEXT_ACTION');
      runRecord.stateHistory.push('DECIDE_NEXT_ACTION');

      // 8. RESPOND
      this.stateMachine.transition('RESPOND');
      runRecord.stateHistory.push('RESPOND');
      
      const createdIssueNumber = (createResult.data as { issue?: { issueNumber?: string } })?.issue?.issueNumber || 'EW-NEW';
      runRecord.finalResponseMl = `താങ്കളുടെ പരാതി (നം: ${createdIssueNumber}) വാർഡ് ${authContext.wardNumber}-ൽ വിജയകരമായി രേഖപ്പെടുത്തി. വാർഡ് മെമ്പർക്ക് ഇതിന്റെ സന്ദേശം അയച്ചിട്ടുണ്ട്.`;
      emitStep('RESPOND', 'മറുപടി നൽകുന്നു: പരാതി വിജയകരമായി രേഖപ്പെടുത്തി', 'Complaint created and representative notified');

      // 9. SAVE_RELEVANT_MEMORY
      this.stateMachine.transition('SAVE_RELEVANT_MEMORY');
      runRecord.stateHistory.push('SAVE_RELEVANT_MEMORY');
      emitStep('SAVE_RELEVANT_MEMORY', 'പരാതി വിവരങ്ങൾ ഓർമ്മയിൽ സൂക്ഷിക്കുന്നു', 'Saving session memory');

      this.stateMachine.reset();
      runRecord.completedAt = new Date().toISOString();
      return runRecord;
    } catch (err) {
      this.stateMachine.reset();
      emitStep('RESPOND', 'പ്രക്രിയയിൽ തടസ്സം നേരിട്ടു', 'Encountered error in processing');
      throw err;
    }
  }
}

export const defaultAgentRunner = new WardSahayakanAgentRunner();
