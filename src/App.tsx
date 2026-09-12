import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { UserProfile } from './types/auth';
import { LandingPage } from './pages/LandingPage';
import { ResidentDashboard } from './pages/ResidentDashboard';
import { RepresentativeDashboard } from './pages/RepresentativeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  // Optional preview mode for hackathon evaluation: allows inspecting each simplified experience
  const [previewRole, setPreviewRole] = useState<'resident' | 'representative' | 'admin' | null>(null);

  useEffect(() => {
    // Restore session on initial load
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    setIsInitializing(false);
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setPreviewRole(null);
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setPreviewRole(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6] text-emerald-900 gap-3 font-semibold text-sm">
        <span className="material-symbols-outlined animate-spin text-2xl">
          progress_activity
        </span>
        <span>എന്റെ വാർഡ് സജ്ജമാക്കുന്നു (Loading Ente Ward)...</span>
      </div>
    );
  }

  // Determine effective user and role
  const effectiveUser: UserProfile | null = previewRole
    ? {
        id: `eval-${previewRole}`,
        email: previewRole === 'admin' ? 'mshibin042@gmail.com' : `${previewRole}@enteward.in`,
        fullName:
          previewRole === 'admin'
            ? 'Mohammed Shibin PT'
            : previewRole === 'representative'
            ? 'വാർഡ് പ്രതിനിധി (Ward Representative)'
            : 'വാർഡ് പൗരൻ (Ward Resident)',
        role: previewRole,
        wardId: 'ward-01',
        wardNumber: 1,
        wardNameMl: 'ചാക്ക (വാർഡ് 1)',
        localBodyName: 'കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത്',
        district: 'തിരുവനന്തപുരം',
        createdAt: new Date().toISOString()
      }
    : currentUser;

  // Render appropriate view based on authoritative role
  const renderCurrentView = () => {
    if (!effectiveUser) {
      return <LandingPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (effectiveUser.role === 'admin') {
      return <AdminDashboard user={effectiveUser} onSignOut={handleSignOut} />;
    }

    if (effectiveUser.role === 'representative') {
      return <RepresentativeDashboard user={effectiveUser} onSignOut={handleSignOut} />;
    }

    return <ResidentDashboard user={effectiveUser} onSignOut={handleSignOut} />;
  };

  return (
    <div className="relative min-h-screen">
      {renderCurrentView()}

      {/* Floating Evaluation Persona Switcher (Hackathon Review Toolbar) */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-stone-900/90 backdrop-blur-md text-white p-1.5 rounded-2xl shadow-xl border border-white/10 text-xs font-semibold">
        <span className="text-[10px] text-stone-400 font-bold px-2 uppercase tracking-wider hidden sm:inline">
          View:
        </span>
        <button
          onClick={() => setPreviewRole(null)}
          className={`px-2.5 py-1 rounded-xl transition-all ${
            !previewRole && !currentUser
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          Public
        </button>
        <button
          onClick={() => setPreviewRole('resident')}
          className={`px-2.5 py-1 rounded-xl transition-all ${
            (previewRole === 'resident' || (!previewRole && currentUser?.role === 'resident'))
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          Resident
        </button>
        <button
          onClick={() => setPreviewRole('representative')}
          className={`px-2.5 py-1 rounded-xl transition-all ${
            (previewRole === 'representative' || (!previewRole && currentUser?.role === 'representative'))
              ? 'bg-emerald-600 text-white font-bold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          Representative
        </button>
        <button
          onClick={() => setPreviewRole('admin')}
          className={`px-2.5 py-1 rounded-xl transition-all ${
            (previewRole === 'admin' || (!previewRole && currentUser?.role === 'admin'))
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  );
};

export default App;
