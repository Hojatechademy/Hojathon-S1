import React from 'react';
import { Issue } from '../../types/database';
import { issueService } from '../../services/issueService';

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ issue, onClose }) => {
  if (!issue) return null;

  const timeline = issueService.getTimeline(issue.id);
  const evidence = issueService.getEvidence(issue.id);

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="civic-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          boxShadow: '0 20px 40px -12px rgba(0, 46, 32, 0.25)',
          background: '#ffffff'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              background: 'var(--primary-container)',
              color: '#ffffff',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 700
            }}>
              #{issue.issueNumber}
            </span>
            <span className="badge badge-mint" style={{ textTransform: 'capitalize' }}>
              {issue.category}
            </span>
            <span className="badge badge-outline">
              {issue.status}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{ color: 'var(--outline)', padding: '0.25rem' }}
            title="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Title & Description */}
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.65rem', lineHeight: 1.3 }}>
          {issue.titleMl}
        </h3>
        <p style={{ fontSize: '0.925rem', color: 'var(--charcoal)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {issue.descriptionMl}
        </p>

        {issue.locationLandmark && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--outline)', marginBottom: '1.5rem' }}>
            <span className="material-symbols-outlined text-sm">location_on</span>
            <span>സ്ഥലം: {issue.locationLandmark}</span>
          </div>
        )}

        {/* Evidence Section */}
        {evidence.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.75rem' }}>
              ഫോട്ടോകളും തെളിവുകളും (Evidence & Photos)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {evidence.map(e => (
                <div key={e.id} style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--outline-light)' }}>
                  <img
                    src={e.mediaUrl}
                    alt={e.captionMl || 'Evidence'}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                  {e.captionMl && (
                    <div style={{ padding: '0.5rem', fontSize: '0.75rem', background: 'var(--surface-bg)', color: 'var(--charcoal)' }}>
                      {e.captionMl}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronological Timeline History */}
        <div style={{ borderTop: '1px solid var(--outline-light)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-outlined text-base">history</span>
            <span>നടപടിക്രമങ്ങളുടെ സമയക്രമം (Action Timeline)</span>
          </h4>

          {timeline.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
              നടപടിക്രമങ്ങൾ രേഖപ്പെടുത്തിയിട്ടില്ല.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              {timeline.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '9999px',
                    background: t.status === 'resolved' ? 'var(--mint)' : 'var(--slate-100)',
                    color: t.status === 'resolved' ? '#059669' : 'var(--charcoal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined text-xs">
                      {t.status === 'resolved' ? 'check' : 'schedule'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                      {t.titleMl}
                    </div>
                    {t.remarksMl && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '0.15rem' }}>
                        {t.remarksMl}
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: 'var(--outline-variant)', marginTop: '0.2rem' }}>
                      {new Date(t.createdAt).toLocaleString()} · {t.actorRole}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Close Button */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
            Close / അടയ്ക്കുക
          </button>
        </div>
      </div>
    </div>
  );
};
