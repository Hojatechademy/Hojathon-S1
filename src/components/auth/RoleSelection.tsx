import React from 'react';

interface RoleSelectionProps {
  onSelectRole: (role: 'resident' | 'representative') => void;
}

export const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="animate-fadeIn" style={{ maxWidth: '850px', margin: '0 auto', padding: '1.5rem 0' }}>
      {/* Welcome Headline */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          background: '#ffffff',
          border: '1px solid var(--outline-light)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--primary-container)',
          marginBottom: '1rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <span className="material-symbols-outlined text-xs material-symbols-fill">hub</span>
          <span>Community · Transparency · Local Action</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 800,
          color: 'var(--charcoal)',
          letterSpacing: '-0.025em',
          lineHeight: 1.25,
          marginBottom: '0.65rem'
        }}>
          Your ward. One conversation.<br /> Real action.
        </h1>

        <p style={{
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--primary-container)',
          marginBottom: '0.5rem'
        }}>
          നിങ്ങളുടെ വാർഡ്. ഒരു സംഭാഷണം. യഥാർത്ഥ നടപടി.
        </p>

        <p style={{ fontSize: '0.9rem', color: 'var(--outline)' }}>
          Choose how you want to access Ente Ward. / എന്റെ വാർഡിലേക്ക് പ്രവേശിക്കാൻ നിങ്ങളുടെ പങ്ക് തിരഞ്ഞെടുക്കുക.
        </p>
      </div>

      {/* Two Dominant Primary Role Selection Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* CARD 1: RESIDENT */}
        <div
          onClick={() => onSelectRole('resident')}
          className="civic-card civic-card-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '2px solid transparent',
            padding: '2rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '16px',
                background: 'var(--mint)',
                border: '1px solid var(--mint-border)',
                color: 'var(--primary-container)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined material-symbols-fill" style={{ fontSize: '1.85rem' }}>
                  groups
                </span>
              </div>
              <span className="badge badge-mint" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Citizen Access
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--charcoal)' }}>Resident</h2>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--outline)' }}>(താമസക്കാരൻ)</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--outline)', lineHeight: 1.6 }}>
              Report local problems, track your complaints in real time, discover ward information, and talk directly to Ward Sahayakan.
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--outline-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Verified Ward Resident</span>
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <span>Continue as Resident</span>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
            </button>
          </div>
        </div>

        {/* CARD 2: REPRESENTATIVE */}
        <div
          onClick={() => onSelectRole('representative')}
          className="civic-card civic-card-interactive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '2px solid transparent',
            padding: '2rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '16px',
                background: 'var(--secondary-light)',
                border: '1px solid var(--secondary-border)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span className="material-symbols-outlined material-symbols-fill" style={{ fontSize: '1.85rem' }}>
                  badge
                </span>
              </div>
              <span className="badge badge-teal" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Elected Member
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--charcoal)' }}>Representative</h2>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--outline)' }}>(പ്രതിനിധി)</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--outline)', lineHeight: 1.6 }}>
              Manage your assigned ward, triage inbound resident complaints, update resolution status with evidence, and keep your community informed.
            </p>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--outline-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Verified Credentials</span>
            <button className="btn-teal" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <span>Continue as Representative</span>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.75)',
        border: '1px solid var(--outline-light)',
        borderRadius: '12px',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--outline)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary-container)' }}>
            verified_user
          </span>
          <span>Verified civic resolution flow</span>
        </div>
        <div style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
          Kadakampally GP · Ward 7 (ചാക്ക)
        </div>
      </div>
    </div>
  );
};
