import React, { useState } from 'react';
import { Issue } from '../../types/database';

interface IssueFeedProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onOpenNewReportModal?: () => void;
}

export const IssueFeed: React.FC<IssueFeedProps> = ({ issues, onSelectIssue, onOpenNewReportModal }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Issues / എല്ലാം' },
    { id: 'roads', label: 'റോഡുകൾ (Roads)' },
    { id: 'water_supply', label: 'കുടിവെള്ളം (Water)' },
    { id: 'streetlights', label: 'വിളക്കുകൾ (Lights)' },
    { id: 'sanitation', label: 'ശുചിത്വം (Sanitation)' }
  ];

  const filteredIssues = selectedCategory === 'all'
    ? issues
    : issues.filter(i => i.category === selectedCategory);

  const getStatusBadge = (status: Issue['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="badge" style={{ background: 'var(--status-submitted)', color: 'var(--status-submitted-text)' }}>രേഖപ്പെടുത്തി (Submitted)</span>;
      case 'triaged':
        return <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>പരിശോധിച്ചു (Triaged)</span>;
      case 'in_progress':
        return <span className="badge" style={{ background: 'var(--status-progress)', color: 'var(--status-progress-text)' }}>നടപടിയിൽ (In Progress)</span>;
      case 'action_taken':
        return <span className="badge" style={{ background: 'var(--status-action)', color: 'var(--status-action-text)' }}>നടപടി സ്വീകരിച്ചു</span>;
      case 'resolved':
        return <span className="badge" style={{ background: 'var(--status-resolved)', color: 'var(--status-resolved-text)' }}>പരിഹരിച്ചു (Resolved)</span>;
      default:
        return <span className="badge badge-outline">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: Issue['priority']) => {
    if (priority === 'urgent') {
      return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>Urgent</span>;
    }
    if (priority === 'high') {
      return <span className="badge" style={{ background: '#ffedd5', color: '#9a3412' }}>High</span>;
    }
    return null;
  };

  return (
    <div>
      {/* Feed Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)' }}>
            വാർഡിലെ പരാതികൾ (Active Ward Issues)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
            തത്സമയ പുരോഗതിയും നടപടിക്രമങ്ങളും
          </p>
        </div>

        {onOpenNewReportModal && (
          <button
            onClick={onOpenNewReportModal}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '10px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_circle</span>
            <span>New Report / പുതിയ പരാതി</span>
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            style={{
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: selectedCategory === c.id ? 700 : 500,
              background: selectedCategory === c.id ? 'var(--primary-container)' : '#ffffff',
              color: selectedCategory === c.id ? '#ffffff' : 'var(--outline)',
              border: '1px solid',
              borderColor: selectedCategory === c.id ? 'var(--primary-container)' : 'var(--outline-light)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Issues List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredIssues.length === 0 ? (
          <div className="civic-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--outline-light)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.75rem' }}>
                check_circle
              </span>
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
              നിങ്ങളുടെ വാർഡിൽ നിലവിൽ പരാതികളൊന്നുമില്ല
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--outline)', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
              No issues reported yet in your ward. Everything is looking good! വാർഡിൽ എന്തെങ്കിലും ശ്രദ്ധയിൽപ്പെട്ടാൽ പുതിയ പരാതി നൽകാം.
            </p>
            {onOpenNewReportModal && (
              <button
                onClick={onOpenNewReportModal}
                className="btn-primary"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '12px', margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add_circle</span>
                <span>+ Report a Problem / പരാതി നൽകുക</span>
              </button>
            )}
          </div>
        ) : (
          filteredIssues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => onSelectIssue(issue)}
              className="civic-card civic-card-interactive"
              style={{ padding: '1.25rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-container)' }}>
                    #{issue.issueNumber}
                  </span>
                  <span className="badge badge-outline" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {issue.category}
                  </span>
                  {getPriorityBadge(issue.priority)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getStatusBadge(issue.status)}
                </div>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
                {issue.titleMl}
              </h4>

              <p style={{
                fontSize: '0.875rem',
                color: 'var(--outline)',
                lineHeight: 1.5,
                marginBottom: '0.75rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {issue.descriptionMl}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--outline)',
                borderTop: '1px solid var(--outline-light)',
                paddingTop: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  <span>{issue.locationLandmark || 'വാർഡ് 7'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-container)', fontWeight: 600 }}>
                  <span>വിശദാംശങ്ങൾ കാണുക</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
