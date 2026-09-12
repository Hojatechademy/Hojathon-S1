import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { Issue, IssueCategory, IssuePriority } from '../../types/database';
import { issueService } from '../../services/issueService';
import { AuthenticatedUserContext } from '../../types/agent';

interface NewIssueModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (issue: Issue) => void;
}

export const NewIssueModal: React.FC<NewIssueModalProps> = ({
  user,
  isOpen,
  onClose,
  onIssueCreated
}) => {
  const [category, setCategory] = useState<IssueCategory>('roads');
  const [titleMl, setTitleMl] = useState('');
  const [descriptionMl, setDescriptionMl] = useState('');
  const [locationLandmark, setLocationLandmark] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleMl.trim() || !descriptionMl.trim()) return;

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
      const { issue } = await issueService.createIssue({
        category,
        titleMl,
        descriptionMl,
        locationLandmark,
        priority
      }, authContext);

      onIssueCreated(issue);
      onClose();
    } catch (err) {
      console.error('Issue creation error:', err);
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
          maxWidth: '540px',
          padding: '2rem',
          background: '#ffffff',
          boxShadow: '0 20px 40px -12px rgba(0, 46, 32, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)' }}>
              പുതിയ പരാതി നൽകുക
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
              {user.wardNameMl} · New Civic Report
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--outline)' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
              വിഭാഗം (Category)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--outline-light)',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="roads">റോഡുകൾ (Roads & potholes)</option>
              <option value="water_supply">കുടിവെള്ളം (Water supply & leaks)</option>
              <option value="streetlights">തെരുവ് വിളക്കുകൾ (Streetlights)</option>
              <option value="sanitation">ശുചിത്വം (Sanitation & waste)</option>
              <option value="drainage">ഓടകൾ (Drainage)</option>
              <option value="public_health">പൊതുജനാരോഗ്യം (Public Health)</option>
              <option value="other">മറ്റു കാര്യങ്ങൾ (Other)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
              വിഷയം / തലക്കെട്ട് (Title)
            </label>
            <input
              type="text"
              value={titleMl}
              onChange={(e) => setTitleMl(e.target.value)}
              placeholder="ഉദാഹരണത്തിന്: സ്കൂൾ റോഡിലെ വലിയ കുഴികൾ"
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--outline-light)',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
              വിശദാംശങ്ങൾ (Description)
            </label>
            <textarea
              rows={3}
              value={descriptionMl}
              onChange={(e) => setDescriptionMl(e.target.value)}
              placeholder="പ്രശ്നത്തെക്കുറിച്ചുള്ള വ്യക്തമായ വിവരണം നൽകുക..."
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
                സ്ഥലം / ലാൻഡ്മാർക്ക്
              </label>
              <input
                type="text"
                value={locationLandmark}
                onChange={(e) => setLocationLandmark(e.target.value)}
                placeholder="ഉദാ: ജംഗ്ഷന് സമീപം"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-light)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
                മുൻഗണന (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-light)',
                  outline: 'none',
                  background: '#ffffff'
                }}
              >
                <option value="low">സാധാരണ (Low)</option>
                <option value="medium">ഇടത്തരം (Medium)</option>
                <option value="high">ഉയർന്ന മുൻഗണന (High)</option>
                <option value="urgent">അടിയന്തിരം (Urgent)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.6rem 1.25rem' }}>
              റദ്ദാക്കുക (Cancel)
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
              {isSubmitting ? 'രേഖപ്പെടുത്തുന്നു...' : 'സമർപ്പിക്കുക'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
