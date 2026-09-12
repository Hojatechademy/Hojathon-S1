/**
 * Ente Ward (എന്റെ വാർഡ്) - Clean State Initializers
 * No fake residents, fake representatives, or fake seeded complaints.
 * Clean empty collections so the app renders genuine, warm empty states.
 */

import { Ward, Issue, IssueTimeline, IssueEvidence } from '../types/database';
import { UserProfile } from '../types/auth';

export const INITIAL_ADMIN_PROFILE: UserProfile = {
  id: 'admin-mshibin042',
  email: 'mshibin042@gmail.com',
  fullName: 'Mohammed Shibin PT',
  fullNameMl: 'മുഹമ്മദ് ഷിബിൻ പി.ടി (അഡ്മിനിസ്ട്രേറ്റർ)',
  role: 'admin',
  wardId: 'all-wards',
  wardNumber: 0,
  wardNameMl: 'എല്ലാ വാർഡുകളും (All Wards)',
  localBodyName: 'എന്റെ വാർഡ് പ്ലാറ്റ്‌ഫോം (Ente Ward Platform)',
  district: 'കേരളം (Kerala)',
  createdAt: new Date().toISOString()
};

export const DEMO_WARD: Ward | null = null;
export const DEMO_PROFILES: Record<string, UserProfile> = {
  admin: INITIAL_ADMIN_PROFILE
};

export const DEMO_ISSUES: Issue[] = [];
export const DEMO_TIMELINES: Record<string, IssueTimeline[]> = {};
export const DEMO_EVIDENCE: Record<string, IssueEvidence[]> = {};
