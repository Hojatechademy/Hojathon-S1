import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { Issue } from '../types/database';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ActionHub } from '../components/representative/ActionHub';
import { IssueDetailModal } from '../components/issues/IssueDetailModal';
import { issueService } from '../services/issueService';

interface RepresentativeDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const RepresentativeDashboard: React.FC<RepresentativeDashboardProps> = ({ user, onSignOut }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const loadIssues = async () => {
    // Only load issues belonging to the representative's assigned ward
    const list = await issueService.getIssues(user.wardId);
    setIssues(list);
  };

  useEffect(() => {
    loadIssues();
  }, [user.wardId]);

  const handleIssueUpdated = (updated: Issue) => {
    setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>
      <Navbar
        user={user}
        onSignOut={onSignOut}
      />

      <main className="container animate-fadeIn" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #004d40 0%, #006a63 60%, #00897b 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 30px -6px rgba(0, 106, 99, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="badge badge-teal" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>ഔദ്യോഗിക വാർഡ് പ്രതിനിധി പാനൽ</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {user.fullName}
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#9bf2e8' }}>
                {user.localBodyName} · {user.wardNameMl}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#e6fffa' }}>അധികാരപരിധി:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>വാർഡ് {user.wardNumber} ({user.district})</div>
            </div>
          </div>
        </div>

        {/* Action Hub Component */}
        <ActionHub
          user={user}
          issues={issues}
          onSelectIssue={setSelectedIssue}
          onIssueUpdated={handleIssueUpdated}
        />
      </main>

      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />

      <Footer onOpenAdminLogin={() => {}} />
    </div>
  );
};
