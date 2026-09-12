import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types/auth';

interface RepresentativeLoginProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const RepresentativeLogin: React.FC<RepresentativeLoginProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('lathika.rep7@kadakampally.enteward.in');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your official representative email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user, error } = await authService.signIn(email, password, 'representative');
      if (error || !user) {
        setErrorMessage(error || 'Invalid credentials or account is not an authorized representative.');
      } else {
        onSuccess(user);
      }
    } catch (_err) {
      setErrorMessage('Network error: Unable to connect to authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '440px', margin: '1.5rem auto' }}>
      <div className="civic-card" style={{ padding: '2rem', boxShadow: '0 12px 32px -8px rgba(0, 106, 99, 0.12)' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--outline)',
            marginBottom: '1.25rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          <span>Back to choose account type</span>
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="badge badge-teal" style={{ marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined text-xs">badge</span>
            <span>Representative Access</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
            Representative access
          </h2>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '0.2rem' }}>
            പ്രതിനിധി പ്രവേശനം
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            Sign in to manage your assigned ward.
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#92400e',
            marginBottom: '1.25rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#d97706' }}>lock_person</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.4rem' }}>
              Official UID or Email
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--outline)', fontSize: '1.2rem' }}>
                account_circle
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-light)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--outline)', fontSize: '1.2rem' }}>
                vpn_key
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  borderRadius: '10px',
                  border: '1px solid var(--outline-light)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Mandatory Trust Policy Note (Spec Section 7) */}
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.75rem',
            color: '#065f46',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: '#059669', flexShrink: 0 }}>
              verified_user
            </span>
            <span>
              <strong>Trust Policy:</strong> Representative accounts are created by Ente Ward administrators. Public registration is not permitted.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-teal"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '1.1rem' }}>
                  progress_activity
                </span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Ward Action Hub</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
