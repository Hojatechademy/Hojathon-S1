import React from 'react';
import { Shield, Sparkles, Building2, UserCheck, Users } from 'lucide-react';
import { UserRole } from '../types/database';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  wardNumber: number;
  wardNameMl: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  wardNumber,
  wardNameMl
}) => {
  return (
    <header style={{ borderBottom: '1px solid var(--slate-200)', background: '#ffffff', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.25rem' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            width: '2.5rem', 
            height: '2.5rem', 
            borderRadius: '10px', 
            backgroundColor: 'var(--civic-700)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }}>എന്റെ വാർഡ്</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)', fontWeight: 500 }}>Ente Ward</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={12} color="var(--civic-600)" />
              <span>സ്വകാര്യ ഡിജിറ്റൽ വാർഡ് പ്ലാറ്റ്‌ഫോം</span>
            </div>
          </div>
        </div>

        {/* Ward Badge & Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Active Ward */}
          <div className="badge badge-civic" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
            <span>വാർഡ് {wardNumber}: {wardNameMl}</span>
          </div>

          {/* Persona Switcher */}
          <div style={{ 
            display: 'flex', 
            backgroundColor: 'var(--slate-100)', 
            padding: '0.2rem', 
            borderRadius: '8px',
            border: '1px solid var(--slate-200)'
          }}>
            <button
              onClick={() => onRoleChange('resident')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: currentRole === 'resident' ? 600 : 500,
                backgroundColor: currentRole === 'resident' ? '#ffffff' : 'transparent',
                color: currentRole === 'resident' ? 'var(--civic-800)' : 'var(--slate-600)',
                boxShadow: currentRole === 'resident' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Users size={16} />
              <span>താമസക്കാരൻ (Resident)</span>
            </button>

            <button
              onClick={() => onRoleChange('representative')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: currentRole === 'representative' ? 600 : 500,
                backgroundColor: currentRole === 'representative' ? '#ffffff' : 'transparent',
                color: currentRole === 'representative' ? 'var(--civic-800)' : 'var(--slate-600)',
                boxShadow: currentRole === 'representative' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <UserCheck size={16} />
              <span>പ്രതിനിധി (Representative)</span>
            </button>
          </div>

          {/* AI Status Badge */}
          <div className="badge badge-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} color="var(--civic-600)" />
            <span style={{ fontSize: '0.75rem' }}>വാർഡ് സഹായി സജീവം</span>
          </div>
        </div>
      </div>
    </header>
  );
};
