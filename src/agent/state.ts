/**
 * Ward Sahayakan (വാർഡ് സഹായി) - State Machine Engine
 * Enforces the required agent execution lifecycle.
 */

import { AgentState } from '../types/agent';

export const AGENT_STATE_SEQUENCE: readonly AgentState[] = [
  'IDLE',
  'UNDERSTAND_GOAL',
  'CLASSIFY_INTENT',
  'CHECK_CONTEXT',
  'PLAN',
  'SELECT_TOOL',
  'EXECUTE_TOOL',
  'OBSERVE_RESULT',
  'DECIDE_NEXT_ACTION',
  'RESPOND',
  'SAVE_RELEVANT_MEMORY'
] as const;

export const VALID_TRANSITIONS: Record<AgentState, AgentState[]> = {
  IDLE: ['UNDERSTAND_GOAL'],
  UNDERSTAND_GOAL: ['CLASSIFY_INTENT', 'RESPOND'],
  CLASSIFY_INTENT: ['CHECK_CONTEXT', 'RESPOND'],
  CHECK_CONTEXT: ['PLAN', 'RESPOND'],
  PLAN: ['SELECT_TOOL', 'RESPOND'],
  SELECT_TOOL: ['EXECUTE_TOOL'],
  EXECUTE_TOOL: ['OBSERVE_RESULT'],
  OBSERVE_RESULT: ['DECIDE_NEXT_ACTION'],
  // Loop back or conclude:
  DECIDE_NEXT_ACTION: ['SELECT_TOOL', 'RESPOND'],
  RESPOND: ['SAVE_RELEVANT_MEMORY'],
  SAVE_RELEVANT_MEMORY: ['IDLE']
};

export class AgentStateMachine {
  private currentState: AgentState = 'IDLE';
  private history: AgentState[] = ['IDLE'];

  public getState(): AgentState {
    return this.currentState;
  }

  public getHistory(): readonly AgentState[] {
    return [...this.history];
  }

  public canTransition(to: AgentState): boolean {
    const allowed = VALID_TRANSITIONS[this.currentState] || [];
    return allowed.includes(to);
  }

  public transition(to: AgentState): AgentState {
    if (!this.canTransition(to)) {
      throw new Error(`Invalid agent state transition: ${this.currentState} -> ${to}`);
    }
    this.currentState = to;
    this.history.push(to);
    return this.currentState;
  }

  public reset(): void {
    this.currentState = 'IDLE';
    this.history = ['IDLE'];
  }
}
