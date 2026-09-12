import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { RoleSelection } from '../components/auth/RoleSelection';
import { ResidentLogin } from '../components/auth/ResidentLogin';
import { RepresentativeLogin } from '../components/auth/RepresentativeLogin';
import { AdminLogin } from '../components/auth/AdminLogin';
import { UserProfile, AuthView } from '../types/auth';

interface LandingPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [currentView, setCurrentView] = useState<AuthView>('role-selection');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>
      <Navbar
        user={null}
        onSignOut={() => {}}
        onNavigateHome={() => setCurrentView('role-selection')}
      />

      <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1.25rem' }}>
        {currentView === 'role-selection' && (
          <RoleSelection
            onSelectRole={(role) => {
              if (role === 'resident') setCurrentView('resident-login');
              if (role === 'representative') setCurrentView('representative-login');
            }}
          />
        )}

        {currentView === 'resident-login' && (
          <ResidentLogin
            onBack={() => setCurrentView('role-selection')}
            onSuccess={onLoginSuccess}
          />
        )}

        {currentView === 'representative-login' && (
          <RepresentativeLogin
            onBack={() => setCurrentView('role-selection')}
            onSuccess={onLoginSuccess}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onBack={() => setCurrentView('role-selection')}
            onSuccess={onLoginSuccess}
          />
        )}
      </main>

      <Footer onOpenAdminLogin={() => setCurrentView('admin-login')} />
    </div>
  );
};
