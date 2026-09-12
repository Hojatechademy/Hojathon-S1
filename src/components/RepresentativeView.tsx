import { UserCheck, CheckCircle, Upload, Clock, Filter } from 'lucide-react';
import { Issue } from '../types/database';

interface RepresentativeViewProps {
  wardNumber: number;
  wardNameMl: string;
  issues: Issue[];
  onAcknowledge?: (issueId: string) => void;
}

export const RepresentativeView: React.FC<RepresentativeViewProps> = ({
  wardNumber,
  wardNameMl,
  issues
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Banner */}
      <div className="civic-card" style={{ background: '#ffffff', borderLeft: '4px solid var(--civic-600)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <UserCheck size={20} color="var(--civic-700)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                വാർഡ് പ്രതിനിധി ഡാഷ്‌ബോർഡ് (Ward Representative Dashboard)
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
              വാർഡ് {wardNumber} ({wardNameMl}) - താമസക്കാരിൽ നിന്നും വാർഡ് സഹായി വഴി എത്തിയ പരാതികൾ
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>{issues.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>ആകെ പരാതികൾ</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-pending)' }}>
                {issues.filter(i => i.status === 'submitted').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>തീർപ്പുകൽപ്പിക്കാത്തവ</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--civic-700)' }}>
                {issues.filter(i => i.status === 'resolved').length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>പരിഹരിച്ചവ</div>
            </div>
          </div>
        </div>
      </div>

      {/* Issues Queue */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>നടപടി ആവശ്യമുള്ള പരാതികൾ</h3>
          <div className="badge badge-outline">
            <Filter size={12} />
            <span>വാർഡ് {wardNumber} ഫിൽട്ടർ</span>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="civic-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--slate-600)' }}>
            <Clock size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--slate-300)' }} />
            <p style={{ fontWeight: 500 }}>ഈ വാർഡിൽ പുതിയ പരാതികൾ ലഭ്യമല്ല.</p>
            <p style={{ fontSize: '0.8rem' }}>താമസക്കാർ പരാതി നൽകുമ്പോൾ വാർഡ് സഹായി ഇവിടെ ചേർക്കുന്നതാണ്.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {issues.map(issue => (
              <div key={issue.id} className="civic-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--slate-600)' }}>
                      {issue.issueNumber}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--slate-900)' }}>
                      {issue.titleMl}
                    </h4>
                  </div>
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    {issue.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
                  {issue.descriptionMl}
                </p>

                {/* Representative Actions Stub */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  borderTop: '1px solid var(--slate-100)', 
                  paddingTop: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                    <Clock size={14} />
                    <span>നടപടിയിലേക്ക് മാറ്റുക (Acknowledge)</span>
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                    <Upload size={14} />
                    <span>തെളിവ് ചേർക്കുക (Add Evidence)</span>
                  </button>
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}>
                    <CheckCircle size={14} />
                    <span>പരിഹരിച്ചു എന്ന് അടയാളപ്പെടുത്തുക (Resolve)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
