/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Authorized Tool Executor
 * 
 * SECURITY BOUNDARY:
 * Never trusts AI-generated: user identity, role, ward ID, or permissions.
 * The executor pins identity and ward authorization to the verified `AuthenticatedUserContext`.
 */

import { AuthenticatedUserContext, AgentToolResult } from '../types/agent';
import { defaultToolRegistry } from '../agent/registry';
import { Issue, IssueCategory, IssuePriority, IssueTimeline } from '../types/database';

export class AuthorizedToolExecutor {
  /**
   * Dispatches and executes an authorized tool call.
   */
  public async execute(
    toolName: string,
    rawArgs: Record<string, unknown>,
    authContext: AuthenticatedUserContext,
    callId: string
  ): Promise<AgentToolResult> {
    const tool = defaultToolRegistry.getTool(toolName);

    if (!tool) {
      return {
        toolName,
        callId,
        success: false,
        error: `Tool "${toolName}" is not registered.`
      };
    }

    // 1. Authorization check: Authentication required
    if (tool.requiresAuth && !authContext.isAuthenticated) {
      return {
        toolName,
        callId,
        success: false,
        error: 'Security Error: User is not authenticated.'
      };
    }

    // 2. Role permission check
    if (!tool.authorizedRoles.includes(authContext.role)) {
      return {
        toolName,
        callId,
        success: false,
        error: `Security Error: Role "${authContext.role}" is not authorized for tool "${toolName}".`
      };
    }

    // 3. Parameter validation
    const validation = defaultToolRegistry.validateArgs(toolName, rawArgs);
    if (!validation.valid) {
      return {
        toolName,
        callId,
        success: false,
        error: `Parameter validation failed. Missing: ${validation.missing?.join(', ')}`
      };
    }

    // 4. Authorized Tool Dispatch
    switch (toolName) {
      case 'get_current_user': {
        return {
          toolName,
          callId,
          success: true,
          data: {
            userId: authContext.userId,
            fullName: authContext.fullName,
            role: authContext.role,
            wardNumber: authContext.wardNumber,
            wardNameMl: authContext.wardNameMl
          }
        };
      }

      case 'get_user_ward': {
        return {
          toolName,
          callId,
          success: true,
          data: {
            // BOUNDARY: Ward is derived strictly from authContext, not LLM
            wardId: authContext.wardId,
            wardNumber: authContext.wardNumber,
            wardNameMl: authContext.wardNameMl
          }
        };
      }

      case 'create_issue': {
        // BOUNDARY: Overwrite or inject wardId and residentId from trusted authContext
        const now = new Date().toISOString();
        const issueId = `issue-${Date.now()}`;
        const issueNumber = `EW-W${authContext.wardNumber.toString().padStart(2, '0')}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

        const newIssue: Issue = {
          id: issueId,
          issueNumber,
          wardId: authContext.wardId, // Enforced by auth context
          residentId: authContext.userId, // Enforced by auth context
          category: (rawArgs.category as IssueCategory) || 'roads',
          titleMl: String(rawArgs.titleMl || 'വാർഡ് പരാതി'),
          descriptionMl: String(rawArgs.descriptionMl || ''),
          locationLandmark: rawArgs.locationLandmark ? String(rawArgs.locationLandmark) : undefined,
          priority: (rawArgs.priority as IssuePriority) || 'medium',
          status: 'submitted',
          createdAt: now,
          updatedAt: now
        };

        const timelineRecord: IssueTimeline = {
          id: `timeline-${Date.now()}`,
          issueId,
          status: 'submitted',
          actorId: authContext.userId,
          actorRole: 'agent',
          titleMl: 'പരാതി വാർഡ് സഹായി വഴി രേഖപ്പെടുത്തി',
          remarksMl: `വാർഡ് ${authContext.wardNumber} പ്രതിനിധിക്ക് കൈമാറാൻ തയ്യാറാക്കി.`,
          createdAt: now
        };

        return {
          toolName,
          callId,
          success: true,
          data: {
            issue: newIssue,
            timeline: timelineRecord,
            messageMl: `പരാതി #${issueNumber} വിജയകരമായി രേഖപ്പെടുത്തി.`
          }
        };
      }

      case 'notify_representative': {
        return {
          toolName,
          callId,
          success: true,
          data: {
            notified: true,
            issueId: rawArgs.issueId,
            wardNumber: authContext.wardNumber,
            summaryMl: rawArgs.summaryMl,
            deliveredAt: new Date().toISOString()
          }
        };
      }

      default:
        return {
          toolName,
          callId,
          success: false,
          error: `Tool "${toolName}" is declared but not yet wired in the foundation slice.`
        };
    }
  }
}

export const defaultToolExecutor = new AuthorizedToolExecutor();
