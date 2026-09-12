/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Agentic Architecture Types
 */

import { UserRole, IssueCategory } from './database';

export type AgentState =
  | 'IDLE'
  | 'UNDERSTAND_GOAL'
  | 'CLASSIFY_INTENT'
  | 'CHECK_CONTEXT'
  | 'PLAN'
  | 'SELECT_TOOL'
  | 'EXECUTE_TOOL'
  | 'OBSERVE_RESULT'
  | 'DECIDE_NEXT_ACTION'
  | 'RESPOND'
  | 'SAVE_RELEVANT_MEMORY';

export type AgentIntent =
  | 'REPORT_ISSUE'
  | 'QUERY_ISSUE_STATUS'
  | 'LIST_MY_ISSUES'
  | 'WARD_INQUIRY'
  | 'REPRESENTATIVE_UPDATE'
  | 'GENERAL_HELP'
  | 'UNKNOWN';

export interface AuthenticatedUserContext {
  userId: string;
  fullName: string;
  role: UserRole;
  wardId: string;
  wardNumber: number;
  wardNameMl: string;
  isAuthenticated: boolean;
}

export type SafeActivityStep = {
  id: string;
  state: AgentState;
  labelMl: string; // e.g. "അഭ്യർത്ഥന മനസ്സിലാക്കുന്നു"
  labelEn: string; // e.g. "Understanding request"
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
};

export interface AgentToolDeclaration {
  name: string;
  category: 'USER_CONTEXT' | 'ISSUES' | 'REPRESENTATIVE' | 'NOTIFICATIONS' | 'ANALYTICS';
  descriptionEn: string;
  descriptionMl: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required: boolean;
  }>;
  requiresAuth: boolean;
  authorizedRoles: UserRole[];
}

export interface AgentToolCall {
  toolName: string;
  arguments: Record<string, unknown>;
  callId: string;
}

export interface AgentToolResult {
  toolName: string;
  callId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ClassifiedComplaint {
  intent: AgentIntent;
  category: IssueCategory;
  titleMl: string;
  descriptionMl: string;
  locationHint?: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
}

export interface AgentRunRecord {
  id: string;
  userId: string;
  wardId: string;
  rawInput: string;
  classifiedIntent?: AgentIntent;
  stateHistory: AgentState[];
  activitySteps: SafeActivityStep[];
  toolCalls: AgentToolCall[];
  toolResults: AgentToolResult[];
  finalResponseMl?: string;
  createdIssueId?: string;
  createdAt: string;
  completedAt?: string;
}
