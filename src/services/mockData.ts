/**
 * Ente Ward - Fallback Demo Data
 * Clearly labeled as demo data for offline testing or when Supabase is unseeded.
 */

import { Ward, Issue, IssueTimeline, IssueEvidence } from '../types/database';
import { UserProfile } from '../types/auth';

export const DEMO_WARD: Ward = {
  id: 'ward-07-kadakampally',
  wardNumber: 7,
  nameEn: 'Chacka',
  nameMl: 'ചാക്ക (വാർഡ് 7)',
  localBodyName: 'കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത് (Kadakampally GP)',
  district: 'തിരുവനന്തപുരം (Thiruvananthapuram)',
  representativeId: 'user-rep-07'
};

export const DEMO_PROFILES: Record<string, UserProfile> = {
  resident: {
    id: 'user-resident-01',
    email: 'anoop.ward7@enteward.in',
    fullName: 'Anoop Nair',
    fullNameMl: 'അനൂപ് നായർ',
    role: 'resident',
    wardId: 'ward-07-kadakampally',
    wardNumber: 7,
    wardNameMl: 'ചാക്ക (വാർഡ് 7)',
    localBodyName: 'കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത്',
    district: 'തിരുവനന്തപുരം',
    phone: '+91 98470 12345',
    createdAt: '2026-01-10T10:00:00Z'
  },
  representative: {
    id: 'user-rep-07',
    email: 'lathika.rep7@kadakampally.enteward.in',
    fullName: 'Lathika Kumari',
    fullNameMl: 'ലതിക കുമാരി (വാർഡ് മെമ്പർ)',
    role: 'representative',
    wardId: 'ward-07-kadakampally',
    wardNumber: 7,
    wardNameMl: 'ചാക്ക (വാർഡ് 7)',
    localBodyName: 'കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത്',
    district: 'തിരുവനന്തപുരം',
    phone: '+91 94471 67890',
    createdAt: '2025-12-01T08:00:00Z'
  },
  admin: {
    id: 'user-admin-01',
    email: 'mshibin042@gmail.com',
    fullName: 'Shibin PT (Platform Admin)',
    fullNameMl: 'ഷിബിൻ പി.ടി (അഡ്മിനിസ്ട്രേറ്റർ)',
    role: 'admin',
    wardId: 'ward-07-kadakampally',
    wardNumber: 7,
    wardNameMl: 'എല്ലാ വാർഡുകളും (All Wards)',
    localBodyName: 'എന്റെ വാർഡ് പ്ലാറ്റ്‌ഫോം',
    district: 'കേരളം',
    phone: '+91 99950 00000',
    createdAt: '2025-11-15T08:00:00Z'
  }
};

export const DEMO_ISSUES: Issue[] = [
  {
    id: 'issue-demo-1042',
    issueNumber: 'EW-1042',
    wardId: 'ward-07-kadakampally',
    residentId: 'user-resident-01',
    titleMl: 'സ്കൂളിന്റെ അടുത്തുള്ള റോഡ് വളരെ മോശമാണ് — വലിയ കുഴികൾ',
    descriptionMl: 'ഗവ. യു.പി. സ്കൂൾ റോഡിൽ 3 വലിയ കുഴികൾ രൂപപ്പെട്ടിരിക്കുന്നു. മഴവെള്ളം കെട്ടിക്കിടന്ന് കുട്ടികൾക്കും ഇരുചക്ര വാഹനങ്ങൾക്കും യാത്ര ദുഷ്കരമാണ്.',
    category: 'roads',
    priority: 'high',
    status: 'in_progress',
    locationLandmark: 'ഗവ. യു.പി. സ്കൂളിന് സമീപം, ചാക്ക',
    createdAt: '2026-09-10T09:30:00Z',
    updatedAt: '2026-09-11T14:20:00Z'
  },
  {
    id: 'issue-demo-1043',
    issueNumber: 'EW-1043',
    wardId: 'ward-07-kadakampally',
    residentId: 'user-resident-01',
    titleMl: 'ക്ഷേത്ര റോഡിലെ തെരുവ് വിളക്കുകൾ പ്രവർത്തിക്കുന്നില്ല',
    descriptionMl: 'പോസ്റ്റ് നമ്പർ 14 മുതൽ 18 വരെയുള്ള 4 എൽ.ഇ.ഡി ലൈറ്റുകൾ കഴിഞ്ഞ ഒരാഴ്ചയായി കത്തുന്നില്ല. രാത്രിയിൽ വഴിനടക്കാൻ ബുദ്ധിമുട്ടാണ്.',
    category: 'streetlights',
    priority: 'medium',
    status: 'submitted',
    locationLandmark: 'ശ്രീകൃഷ്ണ ക്ഷേത്രം റോഡ്',
    createdAt: '2026-09-11T18:15:00Z',
    updatedAt: '2026-09-11T18:15:00Z'
  },
  {
    id: 'issue-demo-1044',
    issueNumber: 'EW-1044',
    wardId: 'ward-07-kadakampally',
    residentId: 'user-resident-02',
    titleMl: 'കനാൽ പാലത്തിന് സമീപം കുടിവെള്ള പൈപ്പ് ചോർച്ച',
    descriptionMl: 'മെയിൻ റോഡിലേക്ക് കുടിവെള്ളം പാഴായി ഒഴുകുന്നു. വാട്ടർ അതോറിറ്റി ലൈനിൽ ചെറിയ വിള്ളലുണ്ട്.',
    category: 'water_supply',
    priority: 'urgent',
    status: 'action_taken',
    locationLandmark: 'ചാക്ക കനാൽ പാലം ജംഗ്ഷൻ',
    createdAt: '2026-09-08T11:00:00Z',
    updatedAt: '2026-09-10T16:45:00Z'
  },
  {
    id: 'issue-demo-1040',
    issueNumber: 'EW-1040',
    wardId: 'ward-07-kadakampally',
    residentId: 'user-resident-03',
    titleMl: 'മാർക്കറ്റ് റോഡിലെ മാലിന്യക്കൂമ്പാരം നീക്കം ചെയ്തു',
    descriptionMl: 'ഓടയിലേക്ക് മാലിന്യം തള്ളിയിരുന്നത് വാർഡ് ശുചീകരണ തൊഴിലാളികൾ എത്തി നീക്കം ചെയ്തു.',
    category: 'sanitation',
    priority: 'medium',
    status: 'resolved',
    locationLandmark: 'കടകംപള്ളി മാർക്കറ്റ് റോഡ്',
    resolutionRemarks: 'ഹരിതകർമ്മസേനയും വാർഡ് വളണ്ടിയർമാരും ചേർന്ന് മാലിന്യം പൂർണ്ണമായി നീക്കം ചെയ്തു.',
    resolvedAt: '2026-09-09T17:00:00Z',
    createdAt: '2026-09-07T08:00:00Z',
    updatedAt: '2026-09-09T17:00:00Z'
  }
];

export const DEMO_TIMELINES: Record<string, IssueTimeline[]> = {
  'issue-demo-1042': [
    {
      id: 'time-1042-1',
      issueId: 'issue-demo-1042',
      status: 'submitted',
      actorId: 'user-resident-01',
      actorRole: 'agent',
      titleMl: 'പരാതി വാർഡ് സഹായി വഴി രേഖപ്പെടുത്തി',
      remarksMl: 'വാർഡ് 7 ലെ ഗവ. യു.പി. സ്കൂൾ റോഡ് തകരാർ വാർഡ് സഹായി തരംതിരിച്ചു.',
      createdAt: '2026-09-10T09:30:00Z'
    },
    {
      id: 'time-1042-2',
      issueId: 'issue-demo-1042',
      status: 'triaged',
      actorId: 'user-rep-07',
      actorRole: 'representative',
      titleMl: 'വാർഡ് പ്രതിനിധി പരിശോധിച്ചു (Acknowledged)',
      remarksMl: 'റോഡ് അറ്റകുറ്റപ്പണി പഞ്ചായത്ത് അസിസ്റ്റന്റ് എഞ്ചിനീയറുടെ ശ്രദ്ധയിൽപ്പെടുത്തി.',
      createdAt: '2026-09-10T12:00:00Z'
    },
    {
      id: 'time-1042-3',
      issueId: 'issue-demo-1042',
      status: 'in_progress',
      actorId: 'user-rep-07',
      actorRole: 'representative',
      titleMl: 'അറ്റകുറ്റപ്പണി ആരംഭിച്ചു (In Progress)',
      remarksMl: 'മെറ്റൽ നിരത്തി കുഴിയടയ്ക്കൽ ജോലികൾ പുരോഗമിക്കുന്നു.',
      createdAt: '2026-09-11T14:20:00Z'
    }
  ],
  'issue-demo-1043': [
    {
      id: 'time-1043-1',
      issueId: 'issue-demo-1043',
      status: 'submitted',
      actorId: 'user-resident-01',
      actorRole: 'agent',
      titleMl: 'പരാതി രേഖപ്പെടുത്തി',
      remarksMl: 'തെരുവ് വിളക്ക് തകരാർ വാർഡ് പ്രതിനിധിക്ക് കൈമാറി.',
      createdAt: '2026-09-11T18:15:00Z'
    }
  ],
  'issue-demo-1040': [
    {
      id: 'time-1040-1',
      issueId: 'issue-demo-1040',
      status: 'submitted',
      actorId: 'user-resident-03',
      actorRole: 'agent',
      titleMl: 'പരാതി സമർപ്പിച്ചു',
      createdAt: '2026-09-07T08:00:00Z'
    },
    {
      id: 'time-1040-2',
      issueId: 'issue-demo-1040',
      status: 'resolved',
      actorId: 'user-rep-07',
      actorRole: 'representative',
      titleMl: 'മാലിന്യം നീക്കം ചെയ്തു (Resolved)',
      remarksMl: 'സ്ഥലം പൂർണ്ണമായും ശുചീകരിച്ചു.',
      createdAt: '2026-09-09T17:00:00Z'
    }
  ]
};

export const DEMO_EVIDENCE: Record<string, IssueEvidence[]> = {
  'issue-demo-1042': [
    {
      id: 'evi-1',
      issueId: 'issue-demo-1042',
      uploadedBy: 'user-resident-01',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600',
      captionMl: 'റോഡിലെ കുഴികൾ (തുടക്കത്തിലെ അവസ്ഥ)',
      stage: 'before',
      createdAt: '2026-09-10T09:30:00Z'
    },
    {
      id: 'evi-2',
      issueId: 'issue-demo-1042',
      uploadedBy: 'user-rep-07',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&q=80&w=600',
      captionMl: 'മെറ്റലിങ് പുരോഗമിക്കുന്നു (നടപടിയിൽ)',
      stage: 'in_progress',
      createdAt: '2026-09-11T14:20:00Z'
    }
  ]
};
