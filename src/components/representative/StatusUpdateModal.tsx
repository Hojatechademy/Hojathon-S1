import React, { useState } from 'react';
import { Issue, IssueStatus } from '../../types/database';
import { UserProfile } from '../../types/auth';
import { issueService } from '../../services/issueService';
import { AuthenticatedUserContext } from '../../types/agent';

interface StatusUpdateModalProps {
  issue: Issue | null;
  user: UserProfile;
  initialAction?: IssueStatus;
  onClose: () => void;
  onUpdated: (updatedIssue: Issue) => void;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  issue,
  user,
  initialAction = 'in_progress',
  onClose,
  onUpdated
}) => {
  const [newStatus, setNewStatus] = useState<IssueStatus>(initialAction);
  const [remarksMl, setRemarksMl] = useState(
    initialAction === 'resolved' 
      ? 'പ്രശ്നം പരിശോധിക്കുകയും ആവശ്യമായ പരിഹാര നടപടികൾ പൂർത്തിയാക്കുകയും ചെയ്തു.' 
      : 'വാർഡ് പ്രതിനിധി പരാതി പരിശോധിച്ച് നടപടി ആരംഭിച്ചു.'
  );
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarksMl.trim()) return;

    setIsSubmitting(true);
    const authContext: AuthenticatedUserContext = {
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      wardId: user.wardId,
      wardNumber: user.wardNumber,
      wardNameMl: user.wardNameMl,
      isAuthenticated: true
    };

    try {
      const result = await issueService.updateStatus(issue.id, newStatus, remarksMl, authContext);
      if (evidenceUrl.trim()) {
        await issueService.addEvidence({
          issueId: issue.id,
          mediaUrl: evidenceUrl.trim(),
          stage: newStatus === 'resolved' ? 'after' : 'in_progress',
          captionMl: `${newStatus === 'resolved' ? 'പരിഹാര തെളിവ്' : 'നടപടി തെളിവ്'}: ${remarksMl.trim()}`
        });
      }
      if (result) {
        onUpdated(result);
        onClose();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="civic-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '2rem',
          background: '#ffffff',
          boxShadow: '0 20px 40px -12px rgba(0, 106, 99, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div className="badge badge-teal" style={{ marginBottom: '0.35rem' }}>
              #{issue.issueNumber}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              നടപടിക്രമം രേഖപ്പെടുത്തുക
            </h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--outline)' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.4rem' }}>
              പരാതിയുടെ അവസ്ഥ (Status)
            </label>
            <select
              value={newStatus}
              onChange={(e) => {
                const s = e.target.value as IssueStatus;
                setNewStatus(s);
                if (s === 'resolved') {
                  setRemarksMl('പ്രശ്നം പരിശോധിക്കുകയും ആവശ്യമായ പരിഹാര നടപടികൾ പൂർത്തിയാക്കുകയും ചെയ്തു.');
                }
              }}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--outline-light)',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="triaged">പരിശോധിച്ചു (Triaged)</option>
              <option value="in_progress">നടപടിയിൽ (In Progress)</option>
              <option value="action_taken">നടപടി സ്വീകരിച്ചു (Action Taken)</option>
              <option value="resolved">പരിഹരിച്ചു (Resolved)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.4rem' }}>
              പ്രതിനിധിയുടെ കുറിപ്പ് (Official Remarks)
            </label>
            <textarea
              rows={3}
              value={remarksMl}
              onChange={(e) => setRemarksMl(e.target.value)}
              placeholder="സ്വീകരിച്ച നടപടിയെക്കുറിച്ചുള്ള വിവരണം..."
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--outline-light)',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.4rem' }}>
              നടപടി തെളിവ് / ഫോട്ടോ (Evidence URL - Optional)
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://example.com/repair-work-photo.jpg"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--outline-light)',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
              പരാതി പരിഹരിച്ചതിന്റെയോ നടക്കുന്ന ജോലിയുടെയോ ഫോട്ടോ ലിങ്ക് ചേർക്കാം.
            </p>
          </div>

          <div style={{
            background: 'var(--surface-bg)',
            padding: '0.75rem',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: 'var(--outline)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--secondary)' }}>
              info
            </span>
            <span>ഈ കുറിപ്പ് താമസക്കാരന്റെ ടൈംലൈനിൽ തത്സമയം ലഭ്യമാകും.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
              റദ്ദാക്കുക
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-teal" style={{ padding: '0.6rem 1.5rem' }}>
              {isSubmitting ? 'രേഖപ്പെടുത്തുന്നു...' : 'അപ്ഡേറ്റ് ചെയ്യുക'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
