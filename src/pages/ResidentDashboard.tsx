import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { Issue } from '../types/database';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { WardSahayakanComposer } from '../components/agent/WardSahayakanComposer';
import { IssueFeed } from '../components/issues/IssueFeed';
import { IssueDetailModal } from '../components/issues/IssueDetailModal';
import { NewIssueModal } from '../components/issues/NewIssueModal';
import { issueService } from '../services/issueService';

interface ResidentDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user, onSignOut }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const loadIssues = async () => {
    const list = await issueService.getIssues(user.wardId);
    setIssues(list);
  };

  useEffect(() => {
    loadIssues();
  }, [user.wardId]);

  const handleIssueCreated = (newIssue: Issue) => {
    setIssues(prev => [newIssue, ...prev]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>
      <Navbar
        user={user}
        onSignOut={onSignOut}
      />

      <main className="container animate-fadeIn" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {/* Civic Hero (Spec Section 13) */}
        <div style={{
          background: 'linear-gradient(135deg, #002e20 0%, #0b4634 60%, #125b42 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 30px -6px rgba(0, 46, 32, 0.3)'
        }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(8px)'
            }}>
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span>{user.localBodyName} · {user.wardNameMl}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.5rem' }}>
              Tell your ward what needs attention.
            </h1>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '0.85rem' }}>
              നിങ്ങളുടെ വാർഡിന് എന്താണ് ശ്രദ്ധിക്കേണ്ടതെന്ന് പറയുക.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#d1fae5', lineHeight: 1.6, maxWidth: '650px' }}>
              പൊതുവഴികൾ, കുടിവെള്ളം, തെരുവ് വിളക്കുകൾ, ശുചിത്വം എന്നിവയുമായി ബന്ധപ്പെട്ട പ്രശ്നങ്ങൾ വാർഡ് സഹായിയോട് നേരിട്ട് പറയൂ. നിങ്ങളുടെ വാർഡ് മെമ്പർക്ക് നടപടിയെടുക്കാൻ ഉടൻ കൈമാറും.
            </p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
          {/* Left: Ward Sahayakan AI Composer */}
          <div>
            <WardSahayakanComposer
              user={user}
              onIssueCreated={handleIssueCreated}
            />
          </div>

          {/* Right: Active Issue Feed */}
          <div>
            <IssueFeed
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onOpenNewReportModal={() => setIsNewModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />

      <NewIssueModal
        user={user}
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onIssueCreated={handleIssueCreated}
      />

      <Footer onOpenAdminLogin={() => {}} />
    </div>
  );
};
