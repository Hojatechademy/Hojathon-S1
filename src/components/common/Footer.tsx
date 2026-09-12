import React from 'react';

interface FooterProps {
  onOpenAdminLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminLogin }) => {
  return (
    <footer style={{
      borderTop: '1px solid var(--outline-light)',
      background: '#ffffff',
      padding: '1.5rem 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.75rem',
        color: 'var(--outline)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Ente Ward Civic Tech</span>
          <span>•</span>
          <span>സ്വകാര്യ ഡിജിറ്റൽ വാർഡ് പ്ലാറ്റ്‌ഫോം (Private civic technology platform. Not affiliated with any government department).</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Kadakampally GP · Ward 7</span>
          <span>•</span>
          {/* Subtle Platform Administration Access */}
          <button
            onClick={onOpenAdminLogin}
            style={{
              color: 'var(--outline)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Platform Administration (അഡ്മിനിസ്ട്രേഷൻ)
          </button>
        </div>
      </div>
    </footer>
  );
};
