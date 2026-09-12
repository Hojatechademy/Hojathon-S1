import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { Issue, IssueStatus } from '../../types/database';
import { StatusUpdateModal } from './StatusUpdateModal';

interface ActionHubProps {
  user: UserProfile;
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onIssueUpdated: (updatedIssue: Issue) => void;
}

export const ActionHub: React.FC<ActionHubProps> = ({
  user,
  issues,
  onSelectIssue,
  onIssueUpdated
}) => {
  const [activeModalIssue, setActiveModalIssue] = useState<Issue | null>(null);
  const [initialModalStatus, setInitialModalStatus] = useState<IssueStatus>('in_progress');

  // Enforce ward boundary: Representative only manages issues for their assigned ward
  const wardIssues = issues.filter(i => i.wardId === user.wardId);

  const totalCount = wardIssues.length;
  const pendingCount = wardIssues.filter(i => i.status === 'submitted' || i.status === 'triaged').length;
  const inProgressCount = wardIssues.filter(i => i.status === 'in_progress' || i.status === 'action_taken').length;
  const resolvedCount = wardIssues.filter(i => i.status === 'resolved').length;

  const openAction = (issue: Issue, status: IssueStatus) => {
    setActiveModalIssue(issue);
    setInitialModalStatus(status);
  };

  return (
    <div className="space-y-6">
      {/* Overview Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}>
        <div className="civic-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--outline)', fontWeight: 600 }}>ആകെ പരാതികൾ (Total)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--charcoal)', marginTop: '0.25rem' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            {user.wardNameMl}
          </div>
        </div>

        <div className="civic-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600 }}>പരിശോധിക്കേണ്ടവ (Pending)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            നടപടി കാത്തിരിക്കുന്നവ
          </div>
        </div>

        <div className="civic-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 600 }}>നടപടിയിൽ (In Progress)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.25rem' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            ജോലികൾ പുരോഗമിക്കുന്നു
          </div>
        </div>

        <div className="civic-card" style={{ borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 600 }}>പരിഹരിച്ചവ (Resolved)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#047857', marginTop: '0.25rem' }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            വിജയകരമായി പൂർത്തിയാക്കി
          </div>
        </div>
      </div>

      {/* Triage Queue */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              വാർഡ് ആക്ഷൻ ഹബ്ബ് (Ward Action Hub)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
              വാർഡ് {user.wardNumber} പ്രതിനിധിയുടെ നേരിട്ടുള്ള നടപടി പാനൽ
            </p>
          </div>
          <div className="badge badge-teal">
            <span>{wardIssues.length} പരാതികൾ</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {wardIssues.map((issue) => (
            <div key={issue.id} className="civic-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--secondary)' }}>
                      #{issue.issueNumber}
                    </span>
                    <span className="badge badge-outline" style={{ textTransform: 'capitalize' }}>
                      {issue.category}
                    </span>
                    {issue.priority === 'urgent' && (
                      <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Urgent</span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                    {issue.titleMl}
                  </h4>
                </div>

                <div>
                  {issue.status === 'resolved' ? (
                    <span className="badge" style={{ background: 'var(--status-resolved)', color: 'var(--status-resolved-text)' }}>
                      പരിഹരിച്ചു (Resolved)
                    </span>
                  ) : issue.status === 'in_progress' ? (
                    <span className="badge" style={{ background: 'var(--status-progress)', color: 'var(--status-progress-text)' }}>
                      നടപടിയിൽ (In Progress)
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--status-submitted)', color: 'var(--status-submitted-text)' }}>
                      രേഖപ്പെടുത്തി (Submitted)
                    </span>
                  )}
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--outline)', marginBottom: '1rem', lineHeight: 1.5 }}>
                {issue.descriptionMl}
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderTop: '1px solid var(--outline-light)',
                paddingTop: '0.85rem'
              }}>
                <button
                  onClick={() => onSelectIssue(issue)}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>visibility</span>
                  <span>ടൈംലൈൻ & തെളിവുകൾ</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {issue.status === 'submitted' && (
                    <button
                      onClick={() => openAction(issue, 'triaged')}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>done</span>
                      <span>പരിശോധിച്ചു (Acknowledge)</span>
                    </button>
                  )}

                  {issue.status !== 'resolved' && (
                    <>
                      <button
                        onClick={() => openAction(issue, 'in_progress')}
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>pending_actions</span>
                        <span>അപ്ഡേറ്റ് ചെയ്യുക</span>
                      </button>

                      <button
                        onClick={() => openAction(issue, 'resolved')}
                        className="btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', background: '#059669' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
                        <span>പരിഹരിച്ചു (Resolve)</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Modal */}
      {activeModalIssue && (
        <StatusUpdateModal
          issue={activeModalIssue}
          user={user}
          initialAction={initialModalStatus}
          onClose={() => setActiveModalIssue(null)}
          onUpdated={(updated) => {
            onIssueUpdated(updated);
            setActiveModalIssue(null);
          }}
        />
      )}
    </div>
  );
};
