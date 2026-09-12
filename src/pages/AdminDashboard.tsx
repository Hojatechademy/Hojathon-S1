import React, { useState } from 'react';
import { UserProfile } from '../types/auth';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { wardService, AdminRepresentativePayload } from '../services/wardService';

interface AdminDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSignOut }) => {
  const [repName, setRepName] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repWardNumber, setRepWardNumber] = useState(8);
  const [repWardName, setRepWardName] = useState('പാൽക്കുളങ്ങര');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCreateRep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName || !repEmail) return;

    const payload: AdminRepresentativePayload = {
      fullName: repName,
      email: repEmail,
      phone: repPhone,
      wardNumber: repWardNumber,
      wardNameMl: `${repWardName} (വാർഡ് ${repWardNumber})`,
      localBodyName: 'കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത്'
    };

    const res = await wardService.createRepresentative(payload);
    setStatusMessage(res.message);
    setRepName('');
    setRepEmail('');
    setRepPhone('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>
      <Navbar
        user={user}
        onSignOut={onSignOut}
      />

      <main className="container animate-fadeIn" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {/* Admin Header */}
        <div style={{
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="badge badge-outline" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined text-xs">terminal</span>
                <span>Platform Administration Console</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
                Ente Ward Administration
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                വാർഡ് ഘടനയും പ്രതിനിധി അക്കൗണ്ടുകളും നിയന്ത്രിക്കുന്നതിനുള്ള ഔദ്യോഗിക പാനൽ
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>അഡ്മിനിസ്ട്രേറ്റർ:</div>
              <div style={{ fontSize: '1rem', fontWeight: 700 }}>{user.email}</div>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{statusMessage}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2rem' }}>
          {/* Form: Provision New Representative Account */}
          <div className="civic-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
              പുതിയ വാർഡ് പ്രതിനിധിയെ ചേർക്കുക (Provision Representative)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginBottom: '1.25rem' }}>
              പ്രതിനിധി അക്കൗണ്ടുകൾ അഡ്മിനിസ്ട്രേറ്റർമാർ മാത്രമേ സൃഷ്ടിക്കാൻ പാടുള്ളൂ (Spec Section 7 & 10).
            </p>

            <form onSubmit={handleCreateRep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
                  പ്രതിനിധിയുടെ പേര് (Full Name)
                </label>
                <input
                  type="text"
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="ഉദാ: പി. സുനിൽ കുമാർ (മെമ്പർ)"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid var(--outline-light)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
                  ഔദ്യോഗിക ഇമെയിൽ (Official Email)
                </label>
                <input
                  type="email"
                  value={repEmail}
                  onChange={(e) => setRepEmail(e.target.value)}
                  placeholder="sunil.rep8@kadakampally.enteward.in"
                  required
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid var(--outline-light)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
                    വാർഡ് നമ്പർ
                  </label>
                  <input
                    type="number"
                    value={repWardNumber}
                    onChange={(e) => setRepWardNumber(Number(e.target.value))}
                    min={1}
                    max={50}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid var(--outline-light)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '0.35rem' }}>
                    വാർഡ് പേര്
                  </label>
                  <input
                    type="text"
                    value={repWardName}
                    onChange={(e) => setRepWardName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid var(--outline-light)' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', background: '#0f172a' }}>
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>പ്രതിനിധി അക്കൗണ്ട് സൃഷ്ടിക്കുക</span>
              </button>
            </form>
          </div>

          {/* Ward Structure & Audit Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="civic-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                വാർഡ് ഘടന (Ward Structure)
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--outline)', marginBottom: '0.75rem' }}>
                കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത് (തിരുവനന്തപുരം)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'var(--surface-bg)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <span>വാർഡ് 7 · ചാക്ക</span>
                  <span style={{ color: '#059669', fontWeight: 600 }}>പ്രതിനിധി സജീവം (Lathika Kumari)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'var(--surface-bg)', borderRadius: '8px', fontSize: '0.8rem' }}>
                  <span>വാർഡ് 8 · പാൽക്കുളങ്ങര</span>
                  <span style={{ color: 'var(--outline)' }}>പ്രൊവിഷൻ ചെയ്തു</span>
                </div>
              </div>
            </div>

            <div className="civic-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                പ്ലാറ്റ്‌ഫോം ഓഡിറ്റ് ലോഗ് (Audit Activity)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--outline)' }}>
                <div>• Auth: Shibin PT logged in as Platform Administrator.</div>
                <div>• Ward 7: 4 active complaints synced with database.</div>
                <div>• Security: Representative self-registration disabled.</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenAdminLogin={() => {}} />
    </div>
  );
};
