import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types/auth';

interface ResidentLoginProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const ResidentLogin: React.FC<ResidentLoginProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('anoop.ward7@enteward.in');
  const [password, setPassword] = useState('demo123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email/phone and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user, error } = await authService.signIn(email, password, 'resident');
      if (error || !user) {
        setErrorMessage(error || 'Invalid credentials. Please verify your email and password.');
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
      <div className="civic-card" style={{ padding: '2rem', boxShadow: '0 12px 32px -8px rgba(0, 46, 32, 0.12)' }}>
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
          <div className="badge badge-mint" style={{ marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined text-xs">person</span>
            <span>Resident Portal</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
            Welcome back.
          </h2>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-container)', marginTop: '0.2rem' }}>
            തിരികെ സ്വാഗതം
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            Sign in to your Ente Ward account.
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: '#991b1b',
            marginBottom: '1.25rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: '#dc2626' }}>error</span>
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.4rem' }}>
              Mobile Number or Email
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--outline)', fontSize: '1.2rem' }}>
                mail
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)' }}>
                Password
              </label>
            </div>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--outline)', fontSize: '1.2rem' }}>
                lock
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

          <div style={{
            background: 'var(--surface-bg)',
            border: '1px solid var(--outline-light)',
            borderRadius: '10px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.75rem',
            color: 'var(--outline)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem', color: 'var(--primary-container)' }}>
              shield
            </span>
            <span>Resident accounts are managed through the trusted ward structure.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
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
                <span>Sign In as Resident</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
