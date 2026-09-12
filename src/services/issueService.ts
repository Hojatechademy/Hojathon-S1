/**
 * Ente Ward - Issue & Civic Workflow Service
 * Interacts with Supabase 'issues', 'issue_timeline', and 'issue_evidence' tables.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Issue, IssueCategory, IssuePriority, IssueStatus, IssueTimeline, IssueEvidence } from '../types/database';
import { AuthenticatedUserContext } from '../types/agent';
import { DEMO_ISSUES, DEMO_TIMELINES, DEMO_EVIDENCE } from './mockData';

const LOCAL_ISSUES_KEY = 'enteward_cached_issues';
const LOCAL_TIMELINE_KEY = 'enteward_cached_timelines';

class IssueService {
  private localIssues: Issue[] = [];
  private localTimelines: Record<string, IssueTimeline[]> = {};

  constructor() {
    this.restoreLocal();
  }

  private restoreLocal(): void {
    try {
      const storedIssues = localStorage.getItem(LOCAL_ISSUES_KEY);
      this.localIssues = storedIssues ? JSON.parse(storedIssues) : [...DEMO_ISSUES];
      const storedTimelines = localStorage.getItem(LOCAL_TIMELINE_KEY);
      this.localTimelines = storedTimelines ? JSON.parse(storedTimelines) : { ...DEMO_TIMELINES };
    } catch (_e) {
      this.localIssues = [...DEMO_ISSUES];
      this.localTimelines = { ...DEMO_TIMELINES };
    }
  }

  private saveLocal(): void {
    try {
      localStorage.setItem(LOCAL_ISSUES_KEY, JSON.stringify(this.localIssues));
      localStorage.setItem(LOCAL_TIMELINE_KEY, JSON.stringify(this.localTimelines));
    } catch (_e) {
      // Ignore storage quota issues
    }
  }

  /**
   * Retrieves issues filtered by ward and optional filters.
   */
  public async getIssues(wardId?: string, residentId?: string, status?: IssueStatus): Promise<Issue[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (wardId) query = query.eq('ward_id', wardId);
        if (residentId) query = query.eq('resident_id', residentId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (!error && data) {
          return data.map((d: Record<string, unknown>) => ({
            id: String(d.id),
            issueNumber: String(d.issue_number),
            wardId: String(d.ward_id),
            residentId: String(d.resident_id),
            titleMl: String(d.title_ml || d.title || ''),
            descriptionMl: String(d.description_ml || d.description || ''),
            category: (d.category as IssueCategory) || 'roads',
            priority: (d.priority as IssuePriority) || 'medium',
            status: (d.status as IssueStatus) || 'submitted',
            locationLandmark: d.location_landmark ? String(d.location_landmark) : undefined,
            createdAt: String(d.created_at),
            updatedAt: String(d.updated_at)
          }));
        }
      } catch (err) {
        console.warn('Supabase query failed, using local store:', err);
      }
    }

    let filtered = [...this.localIssues];
    if (wardId) filtered = filtered.filter(i => i.wardId === wardId);
    if (residentId) filtered = filtered.filter(i => i.residentId === residentId);
    if (status) filtered = filtered.filter(i => i.status === status);
    return filtered;
  }

  /**
   * Creates an issue with security boundary strictly deriving residentId and wardId from authContext.
   */
  public async createIssue(
    data: {
      category: IssueCategory;
      titleMl: string;
      descriptionMl: string;
      priority?: IssuePriority;
      locationLandmark?: string;
    },
    authContext: AuthenticatedUserContext
  ): Promise<{ issue: Issue; timeline: IssueTimeline }> {
    const now = new Date().toISOString();
    const count = this.localIssues.length + 1045;
    const issueNumber = `EW-${count}`;
    const issueId = `issue-${Date.now()}`;

    const newIssue: Issue = {
      id: issueId,
      issueNumber,
      wardId: authContext.wardId, // Enforced by authenticated context
      residentId: authContext.userId, // Enforced by authenticated context
      category: data.category,
      titleMl: data.titleMl,
      descriptionMl: data.descriptionMl,
      priority: data.priority || 'medium',
      status: 'submitted',
      locationLandmark: data.locationLandmark,
      createdAt: now,
      updatedAt: now
    };

    const newTimeline: IssueTimeline = {
      id: `time-${Date.now()}`,
      issueId,
      status: 'submitted',
      actorId: authContext.userId,
      actorRole: 'agent',
      titleMl: 'പരാതി വാർഡ് സഹായി വഴി രേഖപ്പെടുത്തി',
      remarksMl: `വാർഡ് ${authContext.wardNumber} പ്രതിനിധിയുടെ ശ്രദ്ധയിലേക്ക് അയച്ചു.`,
      createdAt: now
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('issues').insert({
          id: issueId,
          issue_number: issueNumber,
          ward_id: authContext.wardId,
          resident_id: authContext.userId,
          category: data.category,
          title_ml: data.titleMl,
          description_ml: data.descriptionMl,
          priority: data.priority || 'medium',
          status: 'submitted',
          location_landmark: data.locationLandmark,
          created_at: now,
          updated_at: now
        });

        await supabase.from('issue_timeline').insert({
          id: newTimeline.id,
          issue_id: issueId,
          status: 'submitted',
          actor_id: authContext.userId,
          actor_role: 'agent',
          title_ml: newTimeline.titleMl,
          remarks_ml: newTimeline.remarksMl,
          created_at: now
        });
      } catch (err) {
        console.warn('Supabase insert notice, saved locally:', err);
      }
    }

    this.localIssues.unshift(newIssue);
    this.localTimelines[issueId] = [newTimeline];
    this.saveLocal();

    return { issue: newIssue, timeline: newTimeline };
  }

  /**
   * Updates an issue's status (Representative only).
   */
  public async updateStatus(
    issueId: string,
    newStatus: IssueStatus,
    remarksMl: string,
    authContext: AuthenticatedUserContext
  ): Promise<Issue | null> {
    if (authContext.role !== 'representative' && authContext.role !== 'admin') {
      throw new Error('Security Error: Only authorized representatives can update issue status.');
    }

    const now = new Date().toISOString();
    const issueIndex = this.localIssues.findIndex(i => i.id === issueId);
    if (issueIndex === -1) return null;

    const updatedIssue: Issue = {
      ...this.localIssues[issueIndex],
      status: newStatus,
      updatedAt: now,
      resolvedAt: newStatus === 'resolved' ? now : undefined,
      resolutionRemarks: newStatus === 'resolved' ? remarksMl : undefined
    };
    this.localIssues[issueIndex] = updatedIssue;

    const timelineEntry: IssueTimeline = {
      id: `time-${Date.now()}`,
      issueId,
      status: newStatus,
      actorId: authContext.userId,
      actorRole: 'representative',
      titleMl: newStatus === 'resolved' ? 'പരാതി പരിഹരിച്ചു (Resolved)' : `നടപടിക്രമം അപ്ഡേറ്റ് ചെയ്തു: ${newStatus}`,
      remarksMl,
      createdAt: now
    };

    if (!this.localTimelines[issueId]) {
      this.localTimelines[issueId] = [];
    }
    this.localTimelines[issueId].push(timelineEntry);
    this.saveLocal();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('issues').update({
          status: newStatus,
          updated_at: now,
          resolved_at: newStatus === 'resolved' ? now : null,
          resolution_remarks: remarksMl
        }).eq('id', issueId);

        await supabase.from('issue_timeline').insert({
          id: timelineEntry.id,
          issue_id: issueId,
          status: newStatus,
          actor_id: authContext.userId,
          actor_role: 'representative',
          title_ml: timelineEntry.titleMl,
          remarks_ml: remarksMl,
          created_at: now
        });
      } catch (err) {
        console.warn('Supabase status update error:', err);
      }
    }

    return updatedIssue;
  }

  public getTimeline(issueId: string): IssueTimeline[] {
    return this.localTimelines[issueId] || [];
  }

  public getEvidence(issueId: string): IssueEvidence[] {
    return DEMO_EVIDENCE[issueId] || [];
  }
}

export const issueService = new IssueService();
