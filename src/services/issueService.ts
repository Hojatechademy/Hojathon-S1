/**
 * Ente Ward - Issue & Civic Workflow Service
 * Interacts with Supabase 'issues', 'issue_timeline', and 'issue_evidence' tables.
 * Zero fake seeded issues; returns clean empty state when no issues exist.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { Issue, IssueCategory, IssuePriority, IssueStatus, IssueTimeline, IssueEvidence } from '../types/database';
import { AuthenticatedUserContext } from '../types/agent';

const LOCAL_ISSUES_KEY = 'enteward_cached_issues';
const LOCAL_TIMELINE_KEY = 'enteward_cached_timelines';
const LOCAL_EVIDENCE_KEY = 'enteward_cached_evidence';

class IssueService {
  private localIssues: Issue[] = [];
  private localTimelines: Record<string, IssueTimeline[]> = {};
  private localEvidence: Record<string, IssueEvidence[]> = {};

  constructor() {
    this.restoreLocal();
  }

  private restoreLocal(): void {
    try {
      const storedIssues = localStorage.getItem(LOCAL_ISSUES_KEY);
      this.localIssues = storedIssues ? JSON.parse(storedIssues) : [];
      const storedTimelines = localStorage.getItem(LOCAL_TIMELINE_KEY);
      this.localTimelines = storedTimelines ? JSON.parse(storedTimelines) : {};
      const storedEvidence = localStorage.getItem(LOCAL_EVIDENCE_KEY);
      this.localEvidence = storedEvidence ? JSON.parse(storedEvidence) : {};
    } catch (_e) {
      this.localIssues = [];
      this.localTimelines = {};
      this.localEvidence = {};
    }
  }

  private saveLocal(): void {
    try {
      localStorage.setItem(LOCAL_ISSUES_KEY, JSON.stringify(this.localIssues));
      localStorage.setItem(LOCAL_TIMELINE_KEY, JSON.stringify(this.localTimelines));
      localStorage.setItem(LOCAL_EVIDENCE_KEY, JSON.stringify(this.localEvidence));
    } catch (_e) {
      // Ignore storage quota issues
    }
  }

  /**
   * Retrieves issues filtered by ward and optional filters.
   * Returns empty array when no issues exist.
   */
  public async getIssues(wardId?: string, residentId?: string, status?: IssueStatus): Promise<Issue[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (wardId) query = query.eq('ward_id', wardId);
        if (residentId) query = query.eq('resident_id', residentId);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((d: Record<string, unknown>) => ({
            id: String(d.id),
            issueNumber: String(d.issue_number || `EW-${String(d.id).slice(0, 4)}`),
            wardId: String(d.ward_id || wardId || 'ward-01'),
            residentId: String(d.resident_id || residentId || 'user-resident'),
            titleMl: String(d.title_ml || d.title || 'വാർഡ് പരാതി'),
            descriptionMl: String(d.description_ml || d.description || ''),
            category: (d.category as IssueCategory) || 'roads',
            priority: (d.priority as IssuePriority) || 'medium',
            status: (d.status as IssueStatus) || 'submitted',
            locationLandmark: d.location_landmark ? String(d.location_landmark) : undefined,
            createdAt: String(d.created_at || new Date().toISOString()),
            updatedAt: String(d.updated_at || new Date().toISOString())
          }));
        }
      } catch (err) {
        console.warn('Supabase query note, using local memory store:', err);
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
    const count = this.localIssues.length + 1001;
    const issueNumber = `EW-${count}`;
    const issueId = `issue-${Date.now()}`;

    const newIssue: Issue = {
      id: issueId,
      issueNumber,
      wardId: authContext.wardId,
      residentId: authContext.userId,
      titleMl: data.titleMl,
      descriptionMl: data.descriptionMl,
      category: data.category,
      priority: data.priority || 'medium',
      status: 'submitted',
      locationLandmark: data.locationLandmark,
      createdAt: now,
      updatedAt: now
    };

    const initialTimeline: IssueTimeline = {
      id: `timeline-${Date.now()}-1`,
      issueId,
      status: 'submitted',
      actorId: authContext.userId,
      actorRole: authContext.role,
      titleMl: 'പരാതി വാർഡ് സഹായകൻ വഴി രേഖപ്പെടുത്തി (Complaint registered via Ward Sahayakan)',
      remarksMl: 'പരാതി പരിശോധിച്ച് നടപടി സ്വീകരിക്കുന്നതിനായി വാർഡ് മെമ്പർക്ക് കൈമാറി.',
      createdAt: now
    };

    if (isSupabaseConfigured) {
      try {
        const issuePayload: Record<string, any> = {
          issue_number: issueNumber,
          title: data.titleMl,
          description: data.descriptionMl,
          category: data.category,
          priority: data.priority || 'medium',
          status: 'submitted'
        };

        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authContext.wardId)) {
          issuePayload.ward_id = authContext.wardId;
        }
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authContext.userId)) {
          issuePayload.resident_id = authContext.userId;
        }

        const { data: dbData, error } = await supabase
          .from('issues')
          .insert(issuePayload)
          .select()
          .single();

        if (!error && dbData) {
          newIssue.id = String(dbData.id);
          initialTimeline.issueId = String(dbData.id);

          // Also record initial timeline entry in Supabase
          try {
            await supabase.from('issue_timeline').insert({
              issue_id: String(dbData.id),
              old_status: null,
              new_status: 'submitted',
              message: 'പരാതി വാർഡ് സഹായകൻ വഴി രേഖപ്പെടുത്തി (വാർഡ് ജനപ്രതിനിധിക്ക് കൈമാറി)'
            });
          } catch (_tlErr) {}
        }
      } catch (err) {
        console.warn('Supabase issue insertion note:', err);
      }
    }

    this.localIssues.unshift(newIssue);
    this.localTimelines[newIssue.id] = [initialTimeline];
    this.saveLocal();

    return { issue: newIssue, timeline: initialTimeline };
  }

  /**
   * Synchronous getter for issue timeline history.
   */
  public getTimeline(issueId: string): IssueTimeline[] {
    return this.localTimelines[issueId] || [];
  }

  /**
   * Synchronous getter for issue evidence attachments.
   */
  public getEvidence(issueId: string): IssueEvidence[] {
    return this.localEvidence[issueId] || [];
  }

  /**
   * Retrieves chronological audit timeline for an issue from Supabase.
   */
  public async getIssueTimeline(issueId: string): Promise<IssueTimeline[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('issue_timeline')
          .select('*')
          .eq('issue_id', issueId)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped: IssueTimeline[] = data.map((d: any) => ({
            id: String(d.id),
            issueId: String(d.issue_id),
            status: d.new_status || d.status_to || d.status || 'submitted',
            actorId: String(d.actor_id || d.performed_by || ''),
            actorRole: (d.actor_id ? 'representative' : 'system') as any,
            titleMl: String(d.message || d.action_taken || 'സ്റ്റാറ്റസ് അപ്ഡേറ്റ്'),
            remarksMl: d.message || d.remarks,
            createdAt: String(d.created_at || d.timestamp || new Date().toISOString())
          }));
          this.localTimelines[issueId] = mapped;
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase timeline query note:', err);
      }
    }

    return this.getTimeline(issueId);
  }

  /**
   * Updates issue status and returns updated Issue.
   */
  public async updateStatus(
    issueId: string,
    newStatus: IssueStatus,
    remarksMl: string,
    authContext: AuthenticatedUserContext
  ): Promise<Issue> {
    await this.updateIssueStatus(issueId, newStatus, remarksMl, authContext);
    const updated = this.localIssues.find(i => i.id === issueId);
    if (updated) {
      return updated;
    }
    return {
      id: issueId,
      issueNumber: `EW-${issueId.slice(0, 4)}`,
      wardId: authContext.wardId,
      residentId: authContext.userId,
      titleMl: 'വാർഡ് പരാതി',
      descriptionMl: '',
      category: 'roads',
      priority: 'medium',
      status: newStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Updates issue status (Acknowledge / Triaged / In Progress / Resolved).
   */
  public async updateIssueStatus(
    issueId: string,
    newStatus: IssueStatus,
    remarks: string,
    authContext: AuthenticatedUserContext
  ): Promise<{ success: boolean; timeline: IssueTimeline }> {
    const now = new Date().toISOString();
    const current = this.localIssues.find(i => i.id === issueId);
    const oldStatus = current?.status || 'submitted';

    if (current) {
      current.status = newStatus;
      current.updatedAt = now;
      if (newStatus === 'resolved') {
        current.resolvedAt = now;
        current.resolutionRemarks = remarks;
      }
    }

    const newTimeline: IssueTimeline = {
      id: `timeline-${Date.now()}`,
      issueId,
      status: newStatus,
      actorId: authContext.userId,
      actorRole: authContext.role,
      titleMl: `സ്റ്റാറ്റസ് ${newStatus} ആയി മാറ്റി (${oldStatus} ➜ ${newStatus})`,
      remarksMl: remarks,
      createdAt: now
    };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('issues')
          .update({
            status: newStatus,
            updated_at: now,
            ...(newStatus === 'resolved' ? { resolved_at: now } : {})
          })
          .eq('id', issueId);

        const timelinePayload: Record<string, any> = {
          issue_id: issueId,
          old_status: oldStatus,
          new_status: newStatus,
          message: remarks || newTimeline.titleMl
        };

        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authContext.userId)) {
          timelinePayload.actor_id = authContext.userId;
        }

        await supabase
          .from('issue_timeline')
          .insert(timelinePayload);
      } catch (err) {
        console.warn('Supabase issue status update note:', err);
      }
    }

    if (!this.localTimelines[issueId]) {
      this.localTimelines[issueId] = [];
    }
    this.localTimelines[issueId].push(newTimeline);
    this.saveLocal();

    return { success: true, timeline: newTimeline };
  }

  /**
   * Retrieves an issue by ID or issueNumber.
   */
  public async getIssueById(issueId: string): Promise<Issue | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*')
          .or(`id.eq.${issueId},issue_number.eq.${issueId}`)
          .maybeSingle();

        if (!error && data) {
          return {
            id: String(data.id),
            issueNumber: String(data.issue_number || `EW-${String(data.id).slice(0, 4)}`),
            wardId: String(data.ward_id),
            residentId: String(data.resident_id),
            titleMl: String(data.title_ml || data.title || 'വാർഡ് പരാതി'),
            descriptionMl: String(data.description_ml || data.description || ''),
            category: data.category || 'roads',
            priority: data.priority || 'medium',
            status: data.status || 'submitted',
            locationLandmark: data.location_landmark ? String(data.location_landmark) : undefined,
            createdAt: String(data.created_at || new Date().toISOString()),
            updatedAt: String(data.updated_at || new Date().toISOString())
          };
        }
      } catch (_e) {}
    }
    return this.localIssues.find(i => i.id === issueId || i.issueNumber === issueId) || null;
  }

  /**
   * Adds an evidence photo/document to an issue.
   */
  public async addEvidence(evidence: {
    issueId: string;
    mediaUrl: string;
    stage: 'before' | 'in_progress' | 'after';
    captionMl?: string;
  }): Promise<IssueEvidence> {
    const newEv: IssueEvidence = {
      id: `ev-${Date.now()}`,
      issueId: evidence.issueId,
      uploadedBy: 'user',
      mediaType: 'image',
      mediaUrl: evidence.mediaUrl,
      captionMl: evidence.captionMl,
      stage: evidence.stage,
      createdAt: new Date().toISOString()
    };
    if (!this.localEvidence[evidence.issueId]) {
      this.localEvidence[evidence.issueId] = [];
    }
    this.localEvidence[evidence.issueId].push(newEv);
    this.saveLocal();
    return newEv;
  }
}

export const issueService = new IssueService();
