/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Tool Declarations
 * Prepares the architectural declarations for all planned civic agent tools.
 */

import { AgentToolDeclaration } from '../types/agent';

export const AGENT_TOOL_DEFINITIONS: AgentToolDeclaration[] = [
  // 1. USER / CONTEXT TOOLS
  {
    name: 'get_current_user',
    category: 'USER_CONTEXT',
    descriptionEn: 'Retrieves authenticated user details and current session context.',
    descriptionMl: 'ഉപയോക്താവിന്റെ ലോഗിൻ വിവരങ്ങൾ ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },
  {
    name: 'get_user_ward',
    category: 'USER_CONTEXT',
    descriptionEn: 'Retrieves the verified ward and local body boundaries for the authenticated user.',
    descriptionMl: 'ഉപയോക്താവിന്റെ അംഗീകൃത വാർഡ് വിവരങ്ങൾ ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // 2. ISSUES TOOLS (Core vertical slice)
  {
    name: 'create_issue',
    category: 'ISSUES',
    descriptionEn: 'Creates a structured civic issue in the verified ward after security validation.',
    descriptionMl: 'പരിശോധിച്ച വാർഡിൽ പുതിയ പരാതി അല്ലെങ്കിൽ പ്രശ്നം രേഖപ്പെടുത്തുന്നു.',
    parameters: {
      category: {
        type: 'string',
        description: 'Category of civic issue (roads, streetlights, water_supply, sanitation, drainage, public_health)',
        required: true
      },
      titleMl: {
        type: 'string',
        description: 'Brief Malayalam title summarizing the issue',
        required: true
      },
      descriptionMl: {
        type: 'string',
        description: 'Detailed Malayalam description of the civic problem',
        required: true
      },
      locationLandmark: {
        type: 'string',
        description: 'Landmark or location descriptor within the ward',
        required: false
      },
      priority: {
        type: 'string',
        description: 'Urgency level: low, medium, high, urgent',
        required: false
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },
  {
    name: 'get_issue',
    category: 'ISSUES',
    descriptionEn: 'Fetches details of a specific issue by issue ID or issue number.',
    descriptionMl: 'ഒരു നിർദ്ദിഷ്ട പരാതിയുടെ വിശദാംശങ്ങൾ ശേഖരിക്കുന്നു.',
    parameters: {
      issueId: {
        type: 'string',
        description: 'Unique ID or issue tracking number',
        required: true
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },
  {
    name: 'get_my_issues',
    category: 'ISSUES',
    descriptionEn: 'Fetches civic issues reported by the authenticated resident.',
    descriptionMl: 'ലോഗിൻ ചെയ്ത താമസക്കാരൻ നൽകിയ പരാതികൾ ശേഖരിക്കുന്നു.',
    parameters: {
      status: {
        type: 'string',
        description: 'Optional filter by status',
        required: false
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },
  {
    name: 'get_issue_timeline',
    category: 'ISSUES',
    descriptionEn: 'Retrieves chronological action history and status progression for an issue.',
    descriptionMl: 'പരാതിയിൽ സ്വീകരിച്ച നടപടികളുടെ സമയക്രമം ലഭ്യമാക്കുന്നു.',
    parameters: {
      issueId: {
        type: 'string',
        description: 'Issue ID to fetch timeline for',
        required: true
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // 3. REPRESENTATIVE TOOLS
  {
    name: 'update_issue_status',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Updates the lifecycle status of an issue (e.g. in_progress, action_taken, resolved).',
    descriptionMl: 'ജനപ്രതിനിധി പരാതിയുടെ അവസ്ഥ അപ്ഡേറ്റ് ചെയ്യുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'Target issue ID', required: true },
      newStatus: { type: 'string', description: 'New lifecycle status', required: true },
      remarksMl: { type: 'string', description: 'Action remarks in Malayalam', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  },
  {
    name: 'add_issue_evidence',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Attaches photo or document evidence of action taken or resolution.',
    descriptionMl: 'പരിഹാര തെളിവുകളോ ചിത്രങ്ങളോ ചേർക്കുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'Target issue ID', required: true },
      mediaUrl: { type: 'string', description: 'Storage URL of evidence', required: true },
      stage: { type: 'string', description: 'before, in_progress, after', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  },

  // 4. NOTIFICATIONS TOOLS
  {
    name: 'notify_representative',
    category: 'NOTIFICATIONS',
    descriptionEn: 'Dispatches notification to the authorized ward representative for new high-priority issues.',
    descriptionMl: 'വാർഡ് മെമ്പർക്ക് പുതിയ പരാതി അറിയിപ്പ് നൽകുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'ID of the issue to notify about', required: true },
      summaryMl: { type: 'string', description: 'Summary message in Malayalam', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // 5. ANALYTICS TOOLS
  {
    name: 'get_ward_statistics',
    category: 'ANALYTICS',
    descriptionEn: 'Calculates resolution rate and issue counts for the authenticated ward.',
    descriptionMl: 'വാർഡിലെ പരാതി പരിഹാര നിരക്കുകളും സ്ഥിതിവിവരക്കണക്കുകളും ലഭ്യമാക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  }
];
