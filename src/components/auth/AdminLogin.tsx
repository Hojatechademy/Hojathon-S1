import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { UserProfile } from '../../types/auth';

interface AdminLoginProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBack, onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Incorrect username or password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user, error } = await authService.signIn(username, password, 'admin');
      if (error || !user) {
        setErrorMessage('Incorrect username or password.');
      } else if (user.role !== 'admin') {
        setErrorMessage('Incorrect username or password.');
      } else {
        onSuccess(user);
      }
    } catch (_err) {
      setErrorMessage('Incorrect username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '440px', margin: '1.5rem auto' }}>
      <div className="civic-card" style={{ padding: '2rem', boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.16)' }}>
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
          <span>Back to Ente Ward</span>
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="badge badge-outline" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined text-xs">shield_person</span>
            <span>Platform Administration</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
            Administration
          </h2>
          <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e', marginTop: '0.2rem' }}>
            അഡ്മിനിസ്ട്രേഷൻ
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
            Authorized Ente Ward platform administrators only.
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
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.75rem', top: '0.75rem', color: 'var(--outline)', fontSize: '1.2rem' }}>
                terminal
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            color: 'var(--outline)'
          }}>
            Platform Administrator credentials: <code>admin</code> / <code>admin@123</code>.
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.5rem',
              backgroundColor: '#0f172a'
            }}
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
                <span>Sign in</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>terminal</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
