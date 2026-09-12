/**
 * Ward Sahayakan (വാർഡ് സഹായി) - Tool Declarations
 * Declares all civic agent tools for residents and representatives.
 */

import { AgentToolDeclaration } from '../types/agent';

export const AGENT_TOOL_DEFINITIONS: AgentToolDeclaration[] = [
  // TOOL 1: get_current_user
  {
    name: 'get_current_user',
    category: 'USER_CONTEXT',
    descriptionEn: 'Retrieves authenticated user details and current session context.',
    descriptionMl: 'ഉപയോക്താവിന്റെ ലോഗിൻ വിവരങ്ങൾ ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 2: get_user_profile
  {
    name: 'get_user_profile',
    category: 'USER_CONTEXT',
    descriptionEn: 'Retrieves the user profile, verified role, full name, and phone.',
    descriptionMl: 'ഉപയോക്താവിന്റെ പ്രൊഫൈലും റോളും ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 3: get_user_ward
  {
    name: 'get_user_ward',
    category: 'USER_CONTEXT',
    descriptionEn: 'Retrieves the authenticated user authorized State, District, Grama Panchayat, and Ward.',
    descriptionMl: 'ഉപയോക്താവിന്റെ അംഗീകൃത വാർഡ്, പഞ്ചായത്ത്, ജില്ല എന്നിവ ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 4: get_ward_information
  {
    name: 'get_ward_information',
    category: 'PUBLIC_INFO',
    descriptionEn: 'Retrieves useful public information, council office, and jurisdiction for the user ward.',
    descriptionMl: 'വാർഡിന്റെ പൊതുവിവരങ്ങളും സേവന കേന്ദ്രങ്ങളും ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 5: get_ward_contacts
  {
    name: 'get_ward_contacts',
    category: 'CONTACTS',
    descriptionEn: 'Retrieves emergency and official contacts belonging ONLY to the user authorized ward (Ward Member, ASHA Worker, Kudumbashree, Health Nurse, etc.).',
    descriptionMl: 'ഉപയോക്താവിന്റെ വാർഡിലെ മാത്രം അടിയന്തര/ഔദ്യോഗിക നമ്പറുകൾ ലഭ്യമാക്കുന്നു.',
    parameters: {
      category: {
        type: 'string',
        description: 'Optional filter: health, emergency, administration, utility',
        required: false
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 6: get_government_contacts
  {
    name: 'get_government_contacts',
    category: 'CONTACTS',
    descriptionEn: 'Retrieves common Kerala Government public directory contacts (Ministers, District Collectors, Senior Officials, Secretariat).',
    descriptionMl: 'കേരള സർക്കാരിന്റെ ഔദ്യോഗിക പബ്ലിക് ഡയറക്ടറി നമ്പറുകൾ (മന്ത്രിമാർ, കലക്ടർമാർ, വകുപ്പ് മേധാവികൾ) ലഭ്യമാക്കുന്നു.',
    parameters: {
      query: {
        type: 'string',
        description: 'Search term (e.g. Palakkad Collector, Health Minister, Chief Minister)',
        required: false
      },
      category: {
        type: 'string',
        description: 'Filter category: ministers, collectors, senior_officials, secretariat',
        required: false
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 7: get_my_issues
  {
    name: 'get_my_issues',
    category: 'ISSUES',
    descriptionEn: 'Retrieves civic complaints reported by the authenticated resident.',
    descriptionMl: 'ലോഗിൻ ചെയ്ത പൗരൻ സമർപ്പിച്ച പരാതികൾ ശേഖരിക്കുന്നു.',
    parameters: {
      status: {
        type: 'string',
        description: 'Optional status filter: submitted, acknowledged, in_progress, action_taken, resolved',
        required: false
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 8: get_issue
  {
    name: 'get_issue',
    category: 'ISSUES',
    descriptionEn: 'Retrieves details of a specific issue by issue ID or issue number (with authorization check).',
    descriptionMl: 'ഒരു നിർദ്ദിഷ്ട പരാതിയുടെ വിശദാംശങ്ങൾ പരിശോധിച്ചു ശേഖരിക്കുന്നു.',
    parameters: {
      issueId: {
        type: 'string',
        description: 'Unique ID or issue tracking number (e.g. EW-1001)',
        required: true
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 9: get_issue_timeline
  {
    name: 'get_issue_timeline',
    category: 'ISSUES',
    descriptionEn: 'Retrieves chronological action history and official status updates for an authorized issue.',
    descriptionMl: 'പരാതിയിൽ സ്വീകരിച്ച നടപടികളുടെ ടൈംലൈൻ ലഭ്യമാക്കുന്നു.',
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

  // TOOL 10: create_issue (THE MOST IMPORTANT TOOL)
  {
    name: 'create_issue',
    category: 'ISSUES',
    descriptionEn: 'Creates a real structured civic complaint in Supabase. Backend strictly derives user_id and ward_id from authenticated session.',
    descriptionMl: 'വാർഡിൽ പുതിയ പരാതി ഡാറ്റാബേസിൽ രേഖപ്പെടുത്തുന്നു.',
    parameters: {
      category: {
        type: 'string',
        description: 'Issue category: roads, streetlights, water_supply, sanitation, drainage, public_health, electricity, other',
        required: true
      },
      titleMl: {
        type: 'string',
        description: 'Brief Malayalam title summarizing the civic complaint',
        required: true
      },
      descriptionMl: {
        type: 'string',
        description: 'Detailed description of the issue in Malayalam',
        required: true
      },
      priority: {
        type: 'string',
        description: 'Priority level: low, medium, high, urgent',
        required: false
      },
      locationLandmark: {
        type: 'string',
        description: 'Specific landmark or location in the ward (e.g., Near Govt Higher Secondary School)',
        required: false
      }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 11: add_issue_evidence
  {
    name: 'add_issue_evidence',
    category: 'ISSUES',
    descriptionEn: 'Attaches photo or document evidence to an authorized issue.',
    descriptionMl: 'പരാതിയിലേക്ക് തെളിവുകളോ ചിത്രങ്ങളോ ചേർക്കുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'Target issue ID', required: true },
      mediaUrl: { type: 'string', description: 'Storage URL of photo/evidence', required: true },
      stage: { type: 'string', description: 'before, in_progress, after', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 12: submit_issue_feedback
  {
    name: 'submit_issue_feedback',
    category: 'ISSUES',
    descriptionEn: 'Allows residents to submit satisfaction rating and feedback on resolved issues.',
    descriptionMl: 'പരിഹരിച്ച പരാതിയെക്കുറിച്ച് അഭിപ്രായം രേഖപ്പെടുത്തുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'Target resolved issue ID', required: true },
      rating: { type: 'string', description: 'Rating 1 to 5', required: true },
      feedbackMl: { type: 'string', description: 'Feedback comments in Malayalam', required: false }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 13: search_schemes
  {
    name: 'search_schemes',
    category: 'PUBLIC_INFO',
    descriptionEn: 'Searches verified government schemes (Aikyashree, Karunya, LIFE Mission, Awas). Never invents schemes.',
    descriptionMl: 'അംഗീകൃത സർക്കാർ ക്ഷേമപദ്ധതികൾ തിരയുന്നു.',
    parameters: {
      query: { type: 'string', description: 'Scheme name or topic', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // TOOL 14: search_health_facilities
  {
    name: 'search_health_facilities',
    category: 'PUBLIC_INFO',
    descriptionEn: 'Searches verified public health centres (PHC, CHC, Taluk Hospital) in the local body. Uses real stored data.',
    descriptionMl: 'തദ്ദേശ സ്ഥാപന പരിധിയിലെ പ്രാഥമിക ആരോഗ്യ കേന്ദ്രങ്ങൾ ലഭ്യമാക്കുന്നു.',
    parameters: {
      query: { type: 'string', description: 'Facility search term', required: false }
    },
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },

  // REPRESENTATIVE TOOLS:
  {
    name: 'get_representative_ward',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Retrieves representative authorized ward jurisdiction and boundary details.',
    descriptionMl: 'പ്രതിനിധിയുടെ വാർഡ് വിവരങ്ങൾ ശേഖരിക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  },
  {
    name: 'get_ward_issues',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Retrieves complaints within the representative authorized ward with optional filters.',
    descriptionMl: 'പ്രതിനിധിയുടെ വാർഡിലെ പരാതികൾ ലഭ്യമാക്കുന്നു.',
    parameters: {
      category: { type: 'string', description: 'Optional category filter: roads, water_supply, streetlights, sanitation, drainage, etc.', required: false },
      status: { type: 'string', description: 'Optional status filter: submitted, acknowledged, in_progress, action_taken, resolved', required: false },
      unresolvedOnly: { type: 'string', description: 'true or false', required: false }
    },
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  },
  {
    name: 'update_issue',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Updates lifecycle status and official action remarks for a ward issue.',
    descriptionMl: 'പരാതിയിൽ സ്വീകരിച്ച ഔദ്യോഗിക നടപടി രേഖപ്പെടുത്തുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'Target issue ID', required: true },
      newStatus: { type: 'string', description: 'New status: acknowledged, in_progress, action_taken, resolved', required: true },
      remarksMl: { type: 'string', description: 'Official action remarks in Malayalam', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  },
  {
    name: 'resolve_issue',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Marks an issue as resolved with official completion details and evidence.',
    descriptionMl: 'പരാതി പരിഹരിച്ചതായി രേഖപ്പെടുത്തുന്നു.',
    parameters: {
      issueId: { type: 'string', description: 'Target issue ID', required: true },
      resolutionRemarksMl: { type: 'string', description: 'Detailed resolution remarks in Malayalam', required: true }
    },
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  },
  {
    name: 'get_ward_statistics',
    category: 'ANALYTICS',
    descriptionEn: 'Calculates live issue statistics, breakdown by category, and resolution rate for the authorized ward.',
    descriptionMl: 'വാർഡിലെ പരാതികളുടെ ആകെ എണ്ണവും വിഭാഗം തിരിച്ചുള്ള വിവരങ്ങളും ലഭ്യമാക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['resident', 'representative', 'admin']
  },
  {
    name: 'get_ward_residents',
    category: 'REPRESENTATIVE',
    descriptionEn: 'Retrieves verified residents in the representative authorized ward.',
    descriptionMl: 'വാർഡിലെ അംഗീകൃത പൗരന്മാരുടെ വിവരങ്ങൾ ലഭ്യമാക്കുന്നു.',
    parameters: {},
    requiresAuth: true,
    authorizedRoles: ['representative', 'admin']
  }
];
