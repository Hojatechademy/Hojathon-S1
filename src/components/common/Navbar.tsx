import React from 'react';
import { UserProfile } from '../../types/auth';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, onNavigateHome }) => {
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid var(--outline-light)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.5rem' }}>
        {/* Brand */}
        <div 
          onClick={onNavigateHome}
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: onNavigateHome ? 'pointer' : 'default' }}
        >
          <div style={{
            position: 'relative',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-container)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(11, 70, 52, 0.2)'
          }}>
            <span className="material-symbols-outlined material-symbols-fill" style={{ fontSize: '1.4rem' }}>
              account_balance
            </span>
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '10px',
              height: '10px',
              borderRadius: '9999px',
              backgroundColor: '#10b981',
              border: '2px solid #ffffff'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-dark)', letterSpacing: '-0.02em' }}>
                Ente Ward
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--outline)' }}>
                (എന്റെ വാർഡ്)
              </span>
              <span className="badge badge-mint" style={{ display: 'none' }}>
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                AI
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 500 }}>
              {user ? `${user.localBodyName} · ${user.wardNameMl}` : 'സ്വകാര്യ ഡിജിറ്റൽ വാർഡ് പ്ലാറ്റ്‌ഫോം'}
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Active Ward Pill */}
          <div className="badge badge-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#059669', display: 'inline-block' }} />
            <span>{user ? user.wardNameMl : 'വാർഡ് 7 · ചാക്ക'}</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* User Info Chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--slate-50)',
                padding: '0.3rem 0.75rem',
                borderRadius: '10px',
                border: '1px solid var(--outline-light)'
              }}>
                <span className="material-symbols-outlined text-outline" style={{ fontSize: '1.2rem' }}>
                  {user.role === 'admin' ? 'terminal' : user.role === 'representative' ? 'badge' : 'person'}
                </span>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--charcoal)', lineHeight: 1.2 }}>
                    {user.fullName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--outline)', textTransform: 'capitalize' }}>
                    {user.role}
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={onSignOut}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                title="Sign out of Ente Ward"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>logout</span>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
