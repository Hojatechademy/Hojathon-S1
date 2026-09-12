/**
 * Ente Ward - Agent Run & Tool Call Persistence Service
 * Logs all agent executions and tool calls to Supabase `agent_runs` and `agent_tool_calls`.
 * Includes graceful memory caching for immediate UI rendering and offline resilience.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { AgentRunRecord, AgentToolCall, AgentToolResult } from '../types/agent';

class AgentRunService {
  private localRuns: AgentRunRecord[] = [];

  /**
   * Records the start of an agent run.
   */
  public async recordRunStart(run: AgentRunRecord): Promise<string> {
    this.localRuns.unshift({ ...run });

    if (isSupabaseConfigured) {
      try {
        const payload: Record<string, any> = {
          id: run.id,
          user_input: run.rawInput,
          intent: run.classifiedIntent || 'REPORT_ISSUE',
          status: 'started',
          started_at: run.createdAt || new Date().toISOString()
        };

        // Only include user_id if valid UUID format (not eval-resident)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(run.userId);
        if (isUuid) {
          payload.user_id = run.userId;
        }

        const { error } = await supabase.from('agent_runs').insert(payload);
        if (error) {
          console.warn('Supabase agent_runs insert notice:', error.message);
        }
      } catch (err) {
        console.warn('agent_runs logging exception:', err);
      }
    }

    return run.id;
  }

  /**
   * Records a tool call execution and its outcome.
   * STRICT: Uses `agent_run_id` as foreign key, NEVER `run_id`.
   */
  public async recordToolCall(
    agentRunId: string,
    toolCall: AgentToolCall,
    result: AgentToolResult
  ): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const toolCallPayload = {
          id: toolCall.callId || `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          agent_run_id: agentRunId, // STRICT: agent_run_id NOT run_id
          tool_name: toolCall.toolName,
          input: toolCall.arguments || {},
          output: result.data || {},
          status: result.success ? 'success' : 'failed',
          error_message: result.error || null,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('agent_tool_calls').insert(toolCallPayload);
        if (error) {
          console.warn('Supabase agent_tool_calls insert notice:', error.message);
        }
      } catch (err) {
        console.warn('agent_tool_calls logging exception:', err);
      }
    }
  }

  /**
   * Records the completion of an agent run.
   */
  public async recordRunComplete(
    runId: string,
    status: 'completed' | 'failed',
    finalResponse: string,
    intent?: string
  ): Promise<void> {
    const existing = this.localRuns.find(r => r.id === runId);
    if (existing) {
      existing.completedAt = new Date().toISOString();
      existing.finalResponseMl = finalResponse;
    }

    if (isSupabaseConfigured) {
      try {
        const updatePayload: Record<string, any> = {
          status,
          final_response: finalResponse,
          completed_at: new Date().toISOString()
        };
        if (intent) {
          updatePayload.intent = intent;
        }

        const { error } = await supabase
          .from('agent_runs')
          .update(updatePayload)
          .eq('id', runId);

        if (error) {
          console.warn('Supabase agent_runs update notice:', error.message);
        }
      } catch (err) {
        console.warn('agent_runs complete logging exception:', err);
      }
    }
  }

  /**
   * Retrieves recent runs for the current user or ward.
   */
  public async getRecentRuns(userId?: string): Promise<AgentRunRecord[]> {
    if (isSupabaseConfigured && userId) {
      try {
        const { data, error } = await supabase
          .from('agent_runs')
          .select('*')
          .order('started_at', { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id || 'user',
            wardId: 'ward-01',
            rawInput: d.user_input || '',
            classifiedIntent: d.intent,
            stateHistory: ['RESPOND'],
            activitySteps: [],
            toolCalls: [],
            toolResults: [],
            finalResponseMl: d.final_response,
            createdAt: d.started_at || new Date().toISOString(),
            completedAt: d.completed_at
          }));
        }
      } catch (err) {
        console.warn('Supabase recent runs query notice:', err);
      }
    }

    return this.localRuns;
  }
}

export const agentRunService = new AgentRunService();
