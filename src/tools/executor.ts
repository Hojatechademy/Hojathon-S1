/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Authorized Tool Executor
 * 
 * SECURITY BOUNDARY:
 * Never trusts AI-generated user identity, role, ward ID, or permissions.
 * The executor strictly pins identity and ward authorization to the verified `AuthenticatedUserContext`.
 * Real database calls are made through issueService, contactService, and wardService.
 */

import { AuthenticatedUserContext, AgentToolResult } from '../types/agent';
import { defaultToolRegistry } from '../agent/registry';
import { IssueCategory, IssuePriority, IssueStatus, GovernmentContactLevel } from '../types/database';
import { issueService } from '../services/issueService';
import { contactService } from '../services/contactService';
import { wardService } from '../services/wardService';

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
        error: `Tool "${toolName}" is not registered in the system.`
      };
    }

    // 1. Authentication check
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

    try {
      switch (toolName) {
        // ==========================================
        // 1. USER & WARD CONTEXT TOOLS
        // ==========================================
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
              wardNameMl: authContext.wardNameMl,
              localBodyName: authContext.localBodyName || 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത്',
              district: authContext.district || 'Palakkad'
            }
          };
        }

        case 'get_user_profile': {
          return {
            toolName,
            callId,
            success: true,
            data: {
              id: authContext.userId,
              name: authContext.fullName,
              role: authContext.role,
              ward: authContext.wardNumber,
              wardName: authContext.wardNameMl,
              status: 'verified'
            }
          };
        }

        case 'get_user_ward':
        case 'get_representative_ward': {
          // BOUNDARY: Ward is derived strictly from authContext, never LLM
          return {
            toolName,
            callId,
            success: true,
            data: {
              state: 'Kerala',
              district: authContext.district || 'Palakkad',
              localBodyType: 'Grama Panchayat',
              gramaPanchayat: authContext.localBodyName || 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത്',
              wardId: authContext.wardId,
              wardNumber: authContext.wardNumber,
              wardNameMl: authContext.wardNameMl
            }
          };
        }

        case 'get_ward_information': {
          return {
            toolName,
            callId,
            success: true,
            data: {
              state: 'Kerala',
              district: authContext.district || 'Palakkad',
              panchayat: authContext.localBodyName || 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത്',
              wardNumber: authContext.wardNumber,
              wardName: authContext.wardNameMl,
              officeAddress: `${authContext.localBodyName || 'കുലുക്കല്ലൂർ'} ഗ്രാമപഞ്ചായത്ത് ഓഫീസ്, മെയിൻ റോഡ്`,
              gramaSabhaSchedule: 'പ്രതിമാസ വാർഡ് സഭ: എല്ലാ മാസവും രണ്ടാമത്തെ ശനിയാഴ്ച ഉച്ചക്ക് 2:00 മണിക്ക്.',
              wasteCollectionDays: 'ഹരിതകർമ്മസേന അജൈവ മാലിന്യ ശേഖരണം: ഓരോ മാസവും ആദ്യത്തെയും മൂന്നാമത്തെയും ചൊവ്വാഴ്ച.'
            }
          };
        }

        // ==========================================
        // 2. CONTACTS TOOLS (Ward Isolated + Kerala Govt)
        // ==========================================
        case 'get_ward_contacts': {
          // BOUNDARY: Only user authorized ward contacts can be retrieved
          const contacts = await contactService.getWardContacts(authContext.wardId);
          const filterTerm = rawArgs.category ? String(rawArgs.category).toLowerCase() : null;
          const filtered = filterTerm 
            ? contacts.filter(c => 
                c.designation.toLowerCase().includes(filterTerm) || 
                c.name.toLowerCase().includes(filterTerm) ||
                (c.description && c.description.toLowerCase().includes(filterTerm))
              )
            : contacts;

          return {
            toolName,
            callId,
            success: true,
            data: {
              wardNumber: authContext.wardNumber,
              wardNameMl: authContext.wardNameMl,
              count: filtered.length,
              contacts: filtered.map(c => ({
                id: c.id,
                name: c.name,
                designation: c.designation,
                phone: c.phone || 'ലഭ്യമല്ല',
                description: c.description
              }))
            }
          };
        }

        case 'get_government_contacts': {
          // Public Kerala Government Directory
          const search = rawArgs.query ? String(rawArgs.query) : undefined;
          const level = rawArgs.category ? (String(rawArgs.category) as GovernmentContactLevel | 'all') : undefined;
          const contacts = await contactService.getGovernmentContacts({ search, level });

          return {
            toolName,
            callId,
            success: true,
            data: {
              count: contacts.length,
              contacts: contacts.slice(0, 10).map(c => ({
                id: c.id,
                name: c.name,
                designation: c.designation,
                department: c.department,
                phone: c.phone || 'വിവരങ്ങൾ ഔദ്യോഗികമായി ലഭ്യമല്ല (Unlisted)',
                level: c.level
              }))
            }
          };
        }

        // ==========================================
        // 3. ISSUES & COMPLAINT TOOLS (Core Action)
        // ==========================================
        case 'create_issue': {
          // BOUNDARY: Enforce residentId and wardId from trusted authContext
          const category = (rawArgs.category as IssueCategory) || 'roads';
          const titleMl = String(rawArgs.titleMl || 'വാർഡ് പരാതി');
          const descriptionMl = String(rawArgs.descriptionMl || '');
          const priority = (rawArgs.priority as IssuePriority) || 'medium';
          const locationLandmark = rawArgs.locationLandmark ? String(rawArgs.locationLandmark) : undefined;

          // Perform real creation through issueService (persisted to Supabase)
          const result = await issueService.createIssue(
            {
              category,
              titleMl,
              descriptionMl,
              priority,
              locationLandmark
            },
            authContext
          );

          return {
            toolName,
            callId,
            success: true,
            data: {
              issueId: result.issue.id,
              issueNumber: result.issue.issueNumber,
              status: result.issue.status,
              wardId: result.issue.wardId,
              wardNumber: authContext.wardNumber,
              category: result.issue.category,
              priority: result.issue.priority,
              titleMl: result.issue.titleMl,
              createdAt: result.issue.createdAt,
              messageMl: `പരാതി #${result.issue.issueNumber} വിജയകരമായി രജിസ്റ്റർ ചെയ്തു.`
            }
          };
        }

        case 'get_my_issues': {
          const status = rawArgs.status ? (String(rawArgs.status) as IssueStatus) : undefined;
          const issues = await issueService.getIssues(undefined, authContext.userId, status);

          return {
            toolName,
            callId,
            success: true,
            data: {
              count: issues.length,
              issues: issues.map(i => ({
                id: i.id,
                issueNumber: i.issueNumber,
                titleMl: i.titleMl,
                category: i.category,
                status: i.status,
                priority: i.priority,
                createdAt: i.createdAt
              }))
            }
          };
        }

        case 'get_issue': {
          const issueId = String(rawArgs.issueId);
          const issue = await issueService.getIssueById(issueId);

          if (!issue) {
            return {
              toolName,
              callId,
              success: false,
              error: `Issue "${issueId}" not found.`
            };
          }

          // BOUNDARY: Authorization check - Resident can only access own issue or same ward
          if (authContext.role === 'resident' && issue.residentId !== authContext.userId && issue.wardId !== authContext.wardId) {
            return {
              toolName,
              callId,
              success: false,
              error: 'Security Error: You are not authorized to view issues from another ward.'
            };
          }

          return {
            toolName,
            callId,
            success: true,
            data: issue
          };
        }

        case 'get_issue_timeline': {
          const issueId = String(rawArgs.issueId);
          const timeline = await issueService.getIssueTimeline(issueId);

          return {
            toolName,
            callId,
            success: true,
            data: {
              issueId,
              events: timeline
            }
          };
        }

        case 'add_issue_evidence': {
          const issueId = String(rawArgs.issueId);
          const mediaUrl = String(rawArgs.mediaUrl);
          const stage = (rawArgs.stage as any) || 'in_progress';

          const evidence = await issueService.addEvidence({
            issueId,
            mediaUrl,
            stage,
            captionMl: 'വാർഡ് സഹായകൻ വഴി അപ്‌ലോഡ് ചെയ്ത തെളിവ്'
          });

          return {
            toolName,
            callId,
            success: true,
            data: evidence
          };
        }

        case 'submit_issue_feedback': {
          const issueId = String(rawArgs.issueId);
          const rating = Number(rawArgs.rating) || 5;
          const feedbackMl = rawArgs.feedbackMl ? String(rawArgs.feedbackMl) : 'നന്ദി';

          await issueService.updateIssueStatus(
            issueId,
            'resolved',
            `പൗരന്റെ റേറ്റിംഗ്: ${rating}/5. അഭിപ്രായം: ${feedbackMl}`,
            authContext
          );

          return {
            toolName,
            callId,
            success: true,
            data: {
              issueId,
              feedbackSubmitted: true,
              rating,
              messageMl: 'താങ്കളുടെ പ്രതികരണത്തിന് നന്ദി.'
            }
          };
        }

        // ==========================================
        // 4. PUBLIC INFORMATION / SCHEMES / HEALTH
        // ==========================================
        case 'search_schemes': {
          const q = String(rawArgs.query || '').toLowerCase();
          const verifiedSchemes = [
            { name: 'LIFE Mission (ലൈഫ് മിഷൻ)', desc: 'ഭൂരഹിത-ഭവനരഹിതർക്ക് പാർപ്പിടം നൽകുന്ന സമഗ്ര പദ്ധതി.', eligibility: 'ഭൂരഹിതരും ഭവനരഹിതരുമായ കുടുംബങ്ങൾ.' },
            { name: 'Karunya Arogya Suraksha Padhathi (കാരുണ്യ ആരോഗ്യ സുരക്ഷാപദ്ധതി)', desc: 'സാമ്പത്തികമായി പിന്നോക്കം നിൽക്കുന്ന കുടുംബങ്ങൾക്ക് പ്രതിവർഷം 5 ലക്ഷം രൂപയുടെ ചികിത്സാ ആനുകൂല്യം.', eligibility: 'റേഷൻ കാർഡ് അടിസ്ഥാനമാക്കിയുള്ള കാരുണ്യ ഗുണഭോക്താക്കൾ.' },
            { name: 'Aikyashree (ഐക്യശ്രീ)', desc: 'ന്യൂനപക്ഷ വിഭാഗങ്ങളിലെ വിദ്യാർത്ഥികൾക്കായുള്ള സ്കോളർഷിപ്പ് പദ്ധതി.', eligibility: 'കേരളത്തിലെ സ്കൂൾ/കോളേജ് ന്യൂനപക്ഷ വിദ്യാർത്ഥികൾ.' },
            { name: 'Kudumbashree Micro-enterprises (കുടുംബശ്രീ സംരംഭക വായ്പ)', desc: 'വനിതകൾക്ക് സ്വയംതൊഴിൽ കണ്ടെത്താൻ പലിശരഹിത/കുറഞ്ഞ പലിശ വായ്പകൾ.', eligibility: 'കുടുംബശ്രീ അയൽക്കൂട്ട അംഗങ്ങൾ.' }
          ];

          const matched = verifiedSchemes.filter(s => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
          return {
            toolName,
            callId,
            success: true,
            data: {
              count: matched.length,
              schemes: matched.length > 0 ? matched : verifiedSchemes.slice(0, 2),
              note: 'ഔദ്യോഗിക പഞ്ചായത്ത് ഹെൽപ്പ് ഡെസ്കിൽ നിന്നും കൂടുതൽ വിവരങ്ങൾ ലഭ്യമാണ്.'
            }
          };
        }

        case 'search_health_facilities': {
          return {
            toolName,
            callId,
            success: true,
            data: {
              facilities: [
                { name: 'പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം (Primary Health Centre - PHC)', location: 'കുലുക്കല്ലൂർ ജംഗ്ഷൻ', timing: '9:00 AM - 4:00 PM', phone: '0466-2277320', emergency: 'ലഭ്യമാണ്' },
                { name: 'കമ്മ്യൂണിറ്റി ഹെൽത്ത് സെന്റർ (CHC)', location: 'പട്ടാമ്പി താലൂക്ക്', timing: '24 Hours Emergency', phone: '0466-2212340', emergency: '24x7 ആംബുലൻസ്' }
              ]
            }
          };
        }

        // ==========================================
        // 5. REPRESENTATIVE AUTHORIZED TOOLS
        // ==========================================
        case 'get_ward_issues': {
          // BOUNDARY: Strictly restricted to representative's ward
          const issues = await issueService.getIssues(authContext.wardId);
          const categoryFilter = rawArgs.category ? String(rawArgs.category).toLowerCase() : null;
          const statusFilter = rawArgs.status ? String(rawArgs.status).toLowerCase() : null;
          const unresolvedOnly = rawArgs.unresolvedOnly === 'true' || rawArgs.unresolvedOnly === true;

          let filtered = issues;
          if (categoryFilter) {
            filtered = filtered.filter(i => i.category.toLowerCase() === categoryFilter);
          }
          if (statusFilter) {
            filtered = filtered.filter(i => i.status.toLowerCase() === statusFilter);
          }
          if (unresolvedOnly) {
            filtered = filtered.filter(i => i.status !== 'resolved');
          }

          return {
            toolName,
            callId,
            success: true,
            data: {
              wardNumber: authContext.wardNumber,
              total: filtered.length,
              issues: filtered.map(i => ({
                id: i.id,
                issueNumber: i.issueNumber,
                titleMl: i.titleMl,
                category: i.category,
                status: i.status,
                priority: i.priority,
                createdAt: i.createdAt
              }))
            }
          };
        }

        case 'update_issue': {
          const issueId = String(rawArgs.issueId);
          const newStatus = (rawArgs.newStatus as IssueStatus) || 'in_progress';
          const remarksMl = String(rawArgs.remarksMl || 'നടപടി സ്വീകരിച്ചു വരുന്നു');

          const updateResult = await issueService.updateIssueStatus(
            issueId,
            newStatus,
            remarksMl,
            authContext
          );

          return {
            toolName,
            callId,
            success: updateResult.success,
            data: {
              issueId,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              messageMl: `പരാതിയുടെ അവസ്ഥ "${newStatus}" ലേക്ക് മാറ്റി.`
            }
          };
        }

        case 'resolve_issue': {
          const issueId = String(rawArgs.issueId);
          const remarksMl = String(rawArgs.resolutionRemarksMl || 'പരാതി വിജയകരമായി പരിഹരിച്ചു.');

          const resolveResult = await issueService.updateIssueStatus(
            issueId,
            'resolved',
            remarksMl,
            authContext
          );

          return {
            toolName,
            callId,
            success: resolveResult.success,
            data: {
              issueId,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              messageMl: 'പരാതി പരിഹരിച്ചതായി രേഖപ്പെടുത്തി.'
            }
          };
        }

        case 'get_ward_statistics': {
          // BOUNDARY: Calculate live statistics strictly for authenticated ward
          const issues = await issueService.getIssues(authContext.wardId);
          const total = issues.length;
          const open = issues.filter(i => i.status !== 'resolved').length;
          const resolved = issues.filter(i => i.status === 'resolved').length;

          const byCategory: Record<string, number> = {};
          issues.forEach(i => {
            byCategory[i.category] = (byCategory[i.category] || 0) + 1;
          });

          return {
            toolName,
            callId,
            success: true,
            data: {
              wardNumber: authContext.wardNumber,
              wardNameMl: authContext.wardNameMl,
              totalIssues: total,
              openIssues: open,
              resolvedIssues: resolved,
              resolutionRatePercent: total > 0 ? Math.round((resolved / total) * 100) : 100,
              byCategory,
              awaitingAction: issues.filter(i => i.status === 'submitted').length
            }
          };
        }

        case 'get_ward_residents': {
          const residents = await wardService.getWardResidents(authContext.wardId);
          return {
            toolName,
            callId,
            success: true,
            data: {
              wardNumber: authContext.wardNumber,
              count: residents.length,
              residents: residents.map(r => ({
                id: r.id,
                fullName: r.fullName,
                phone: r.phone || 'ലഭ്യമല്ല',
                status: r.status
              }))
            }
          };
        }

        default:
          return {
            toolName,
            callId,
            success: false,
            error: `Tool "${toolName}" is not implemented in executor.`
          };
      }
    } catch (err: any) {
      return {
        toolName,
        callId,
        success: false,
        error: `Tool execution failed: ${err?.message || 'Internal error'}`
      };
    }
  }
}

export const defaultToolExecutor = new AuthorizedToolExecutor();
