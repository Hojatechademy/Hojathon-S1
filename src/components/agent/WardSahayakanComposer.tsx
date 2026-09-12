import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { SafeActivityStep, AuthenticatedUserContext } from '../../types/agent';
import { defaultAgentRunner } from '../../agent/runner';
import { Issue } from '../../types/database';

interface WardSahayakanComposerProps {
  user: UserProfile;
  onIssueCreated: (newIssue: Issue) => void;
}

export const WardSahayakanComposer: React.FC<WardSahayakanComposerProps> = ({ user, onIssueCreated }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<SafeActivityStep[]>([]);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);

  const authContext: AuthenticatedUserContext = {
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    wardId: user.wardId,
    wardNumber: user.wardNumber,
    wardNameMl: user.wardNameMl,
    isAuthenticated: true
  };

  const handleRun = async (textToRun: string) => {
    const query = textToRun.trim();
    if (!query || isProcessing) return;

    setIsProcessing(true);
    setSteps([]);
    setAgentMessage(null);

    try {
      const result = await defaultAgentRunner.processComplaint(
        query,
        authContext,
        (newStep) => {
          setSteps(prev => [...prev, newStep]);
        }
      );

      if (result.finalResponseMl) {
        setAgentMessage(result.finalResponseMl);
      }

      // Check tool results for created issue
      for (const res of result.toolResults) {
        if (res.toolName === 'create_issue' && res.success && res.data) {
          const payload = res.data as { issue: Issue };
          if (payload.issue) {
            onIssueCreated(payload.issue);
          }
        }
      }
      setInput('');
    } catch (err) {
      console.error('Ward Sahayakan processing error:', err);
      setAgentMessage('പരാതി രേഖപ്പെടുത്തുന്നതിൽ ചെറിയ തടസ്സം നേരിട്ടു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = [
    { label: 'റോഡ് കുഴികൾ (Road repairs)', query: 'നമ്മുടെ വാർഡിലെ സ്കൂളിന്റെ അടുത്തുള്ള റോഡ് വളരെ മോശമാണ്. വലിയ കുഴികൾ അടയ്ക്കണം.' },
    { label: 'കുടിവെള്ള ചോർച്ച (Water pipe leak)', query: 'കനാൽ ജംഗ്ഷനിൽ കുടിവെള്ള പൈപ്പ് പൊട്ടി വെള്ളം പാഴായി ഒഴുകുന്നു.' },
    { label: 'തെരുവ് വിളക്ക് (Streetlights)', query: 'ക്ഷേത്രം റോഡിലെ 4 തെരുവ് വിളക്കുകൾ കഴിഞ്ഞ മൂന്ന് ദിവസമായി കത്തുന്നില്ല.' },
    { label: 'മാലിന്യം (Sanitation)', query: 'മാർക്കറ്റ് പരിസരത്ത് മാലിന്യം കെട്ടിക്കിടക്കുന്നു. അടിയന്തരമായി നീക്കം ചെയ്യണം.' }
  ];

  return (
    <div className="civic-card" style={{
      padding: '1.75rem',
      boxShadow: '0 8px 24px -6px rgba(0, 46, 32, 0.08)',
      border: '1px solid var(--mint-border)',
      background: '#ffffff',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '12px',
            background: 'var(--mint)',
            color: 'var(--primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined material-symbols-fill" style={{ fontSize: '1.4rem' }}>
              auto_awesome
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--charcoal)' }}>
              വാർഡ് സഹായി (Ward Sahayakan AI)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
              സ്വാഭാവിക മലയാളത്തിലോ ഇംഗ്ലീഷിലോ നിങ്ങളുടെ വാർഡിലെ പ്രശ്നം പറയൂ — ഏജന്റ് നേരിട്ട് നടപടി സ്വീകരിക്കും.
            </p>
          </div>
        </div>

        <div className="badge badge-mint">
          <span className="material-symbols-outlined text-xs">verified</span>
          <span>ടൂൾ-എനേബിൾഡ് ഏജന്റ്</span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleRun(input); }} style={{ position: 'relative' }}>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ഉദാഹരണത്തിന്: സ്കൂൾ റോഡിലെ കുഴികൾ കാരണം കുട്ടികൾക്ക് പോകാൻ ബുദ്ധിമുട്ടാണ്..."
          disabled={isProcessing}
          style={{
            width: '100%',
            padding: '0.85rem 1rem 3rem 1rem',
            borderRadius: '14px',
            border: '1.5px solid var(--outline-light)',
            outline: 'none',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            resize: 'none',
            background: 'var(--surface-bg)',
            transition: 'border-color 0.15s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-container)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--outline-light)'}
        />

        {/* Bottom bar inside textarea */}
        <div style={{
          position: 'absolute',
          bottom: '0.65rem',
          left: '0.75rem',
          right: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--outline)' }}>
            <span className="material-symbols-outlined text-xs">location_on</span>
            <span>{user.wardNameMl}</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="btn-primary"
            style={{ padding: '0.45rem 1.15rem', borderRadius: '10px', fontSize: '0.85rem' }}
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '1rem' }}>
                  progress_activity
                </span>
                <span>ഏജന്റ് പ്രവർത്തിക്കുന്നു...</span>
              </>
            ) : (
              <>
                <span>പരാതി നൽകുക</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>send</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Prompt Chips */}
      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>ഉദാഹരണങ്ങൾ:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(p.query);
              handleRun(p.query);
            }}
            disabled={isProcessing}
            style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '8px',
              background: 'var(--slate-100)',
              color: 'var(--charcoal)',
              border: '1px solid var(--outline-light)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--mint)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-100)'}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Safe Agent Activity Stream (Spec Section 15) */}
      {steps.length > 0 && (
        <div className="animate-fadeIn" style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          background: 'var(--surface-bg)',
          borderRadius: '12px',
          border: '1px solid var(--outline-light)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--primary-container)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-outlined text-sm material-symbols-fill">auto_awesome</span>
              <span>സുരക്ഷിത ഏജന്റ് പ്രവർത്തന ഘട്ടങ്ങൾ (Safe Agent Activity)</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--outline)', fontWeight: 500 }}>
              Zero Private CoT Exposed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {steps.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.825rem',
                  color: 'var(--charcoal)'
                }}
              >
                <span className="material-symbols-outlined material-symbols-fill" style={{ fontSize: '1.1rem', color: '#059669' }}>
                  check_circle
                </span>
                <span style={{ fontWeight: 600 }}>{s.labelMl}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>({s.labelEn})</span>
              </div>
            ))}
          </div>

          {agentMessage && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem',
              background: '#ffffff',
              borderRadius: '10px',
              borderLeft: '4px solid var(--primary-container)',
              fontSize: '0.875rem',
              color: 'var(--primary-dark)',
              lineHeight: 1.6,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>വാർഡ് സഹായിയുടെ മറുപടി:</span>
              </div>
              <p>{agentMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
