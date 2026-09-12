import React, { useState } from 'react';
import { UserProfile } from '../../types/auth';
import { SafeActivityStep, AuthenticatedUserContext, AgentRunRecord, ConversationTurn } from '../../types/agent';
import { defaultAgentRunner } from '../../agent/runner';
import { Issue } from '../../types/database';

interface WardSahayakanComposerProps {
  user: UserProfile;
  onIssueCreated?: (newIssue: Issue) => void;
}

export const WardSahayakanComposer: React.FC<WardSahayakanComposerProps> = ({ user, onIssueCreated }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<SafeActivityStep[]>([]);
  const [latestRun, setLatestRun] = useState<AgentRunRecord | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);

  const authContext: AuthenticatedUserContext = {
    userId: user.id,
    fullName: user.fullName,
    role: user.role,
    wardId: user.wardId,
    wardNumber: user.wardNumber,
    wardNameMl: user.wardNameMl,
    localBodyName: user.localBodyName || 'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത്',
    district: user.district || 'Palakkad',
    isAuthenticated: true
  };

  const handleRun = async (textToRun: string) => {
    const query = textToRun.trim();
    if (!query || isProcessing) return;

    setIsProcessing(true);
    setSteps([]);

    // Record user query in conversation history
    const userTurn: ConversationTurn = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    const updatedHistory = [...conversationHistory, userTurn];
    setConversationHistory(updatedHistory);

    try {
      const result = await defaultAgentRunner.processRequest(
        query,
        authContext,
        (newStep) => {
          setSteps(prev => [...prev, newStep]);
        },
        updatedHistory
      );

      setLatestRun(result);

      // Save agent turn
      if (result.finalResponseMl) {
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'agent',
            content: result.finalResponseMl || '',
            runRecord: result,
            timestamp: new Date().toISOString()
          }
        ]);
      }

      // Check tool results for created issue
      for (const res of result.toolResults) {
        if (res.toolName === 'create_issue' && res.success && res.data) {
          const payload = res.data as { issueId?: string; issueNumber?: string; category?: string; priority?: string; titleMl?: string };
          if (payload && onIssueCreated) {
            const newlyCreatedIssue: Issue = {
              id: payload.issueId || `issue-${Date.now()}`,
              issueNumber: payload.issueNumber || 'EW-NEW',
              wardId: authContext.wardId,
              residentId: authContext.userId,
              titleMl: payload.titleMl || 'വാർഡ് പരാതി',
              descriptionMl: query,
              category: (payload.category as any) || 'roads',
              priority: (payload.priority as any) || 'medium',
              status: 'submitted',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            onIssueCreated(newlyCreatedIssue);
          }
        }
      }
      setInput('');
    } catch (err) {
      console.error('Ward Sahayakan processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPrompts = [
    {
      label: 'റോഡ് കേടുപാടുകൾ (Road problem)',
      query: 'Schoolinte aduthulla road valare mosham aanu, oru complaint register cheyyanam.'
    },
    {
      label: 'പരാതി അന്വേഷണം (Track complaint)',
      query: 'Where is my complaint?'
    },
    {
      label: 'വാർഡ് ആരോഗ്യ നഴ്സ് (Health Nurse)',
      query: 'Who is the health nurse in my ward?'
    },
    {
      label: 'കേരള സർക്കാർ ഡയറക്ടറി (Govt Contacts)',
      query: 'Give me Kerala government contacts'
    }
  ];

  // Helper to extract tool output data for rich rendering
  const createdIssueResult = latestRun?.toolResults.find(r => r.toolName === 'create_issue' && r.success);
  const myIssuesResult = latestRun?.toolResults.find(r => r.toolName === 'get_my_issues' && r.success);
  const wardContactsResult = latestRun?.toolResults.find(r => r.toolName === 'get_ward_contacts' && r.success);
  const govtContactsResult = latestRun?.toolResults.find(r => r.toolName === 'get_government_contacts' && r.success);
  const statsResult = latestRun?.toolResults.find(r => r.toolName === 'get_ward_statistics' && r.success);

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
              smart_toy
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--charcoal)', letterSpacing: '-0.02em' }}>
                വാർഡ് സഹായി (Ward Sahayakan Action Agent)
              </h3>
              <span className="badge badge-mint" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                Gemini 3.6 Flash Live
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
              സ്വാഭാവിക മലയാളത്തിലോ ഇംഗ്ലീഷിലോ പറയൂ — ഏജന്റ് പരിശോധിച്ച് നേരിട്ട് ഡാറ്റാബേസിൽ നടപടി സ്വീകരിക്കും.
            </p>
          </div>
        </div>

        <div className="badge badge-mint hidden sm:flex">
          <span className="material-symbols-outlined text-xs">verified</span>
          <span>ആക്ഷൻ ടൂൾ-എനേബിൾഡ്</span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleRun(input); }} style={{ position: 'relative' }}>
        <textarea
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ഉദാഹരണത്തിന്: Schoolinte aduthulla road valare mosham aanu, oru complaint register cheyyanam..."
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
            <span>{user.wardNameMl} ({user.localBodyName || 'കുലുക്കല്ലൂർ'})</span>
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
                <span>നിർദ്ദേശം അയക്കുക</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick Prompt Chips */}
      <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--outline)', fontWeight: 600 }}>വേഗത്തിലുള്ള ഉദാഹരണങ്ങൾ:</span>
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
              padding: '0.3rem 0.75rem',
              borderRadius: '8px',
              background: 'var(--slate-100)',
              color: 'var(--charcoal)',
              border: '1px solid var(--outline-light)',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--mint)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-100)'}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Safe Agent Activity Stream */}
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
              <span>സുരക്ഷിത ഏജന്റ് പ്രവർത്തന ഘട്ടങ്ങൾ (Live Action Pipeline)</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
              ✓ Real Backend Execution
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                {s.toolName && (
                  <span style={{ fontSize: '0.65rem', background: '#e0e7ff', color: '#3730a3', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, fontFamily: 'monospace' }}>
                    TOOL: {s.toolName}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Final Agent Response Box */}
          {latestRun?.finalResponseMl && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#ffffff',
              borderRadius: '10px',
              borderLeft: '4px solid var(--primary-container)',
              fontSize: '0.875rem',
              color: 'var(--primary-dark)',
              lineHeight: 1.6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>വാർഡ് സഹായിയുടെ മറുപടി:</span>
                </div>
                {latestRun.createdIssueNumber && (
                  <span className="badge badge-mint" style={{ fontSize: '0.75rem' }}>
                    Issue #{latestRun.createdIssueNumber}
                  </span>
                )}
              </div>
              <p style={{ margin: 0 }}>{latestRun.finalResponseMl}</p>

              {/* RICH RESULT: Created Issue Card */}
              {createdIssueResult && (createdIssueResult.data as any)?.issueNumber && (
                <div style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem 1rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="material-symbols-outlined text-emerald-700">task_alt</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#14532d' }}>
                        പരാതി സ്ഥിരീകരണം: #{(createdIssueResult.data as any).issueNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                        വിഭാഗം: {(createdIssueResult.data as any).category} | മുൻഗണന: {(createdIssueResult.data as any).priority}
                      </div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                    SUBMITTED
                  </span>
                </div>
              )}

              {/* RICH RESULT: My Issues List */}
              {myIssuesResult && (myIssuesResult.data as any)?.issues?.length > 0 && (
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>
                    കണ്ടെത്തിയ പരാതികൾ ({(myIssuesResult.data as any).count})
                  </div>
                  {(myIssuesResult.data as any).issues.slice(0, 4).map((iss: any) => (
                    <div key={iss.id} style={{
                      padding: '0.6rem 0.85rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--charcoal)' }}>
                          #{iss.issueNumber} — {iss.titleMl}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>
                          വിഭാഗം: {iss.category} | തീയതി: {new Date(iss.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge badge-outline" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {iss.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* RICH RESULT: Ward Contacts */}
              {wardContactsResult && (wardContactsResult.data as any)?.contacts?.length > 0 && (
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>
                    വാർഡ് {user.wardNumber} ബന്ധപ്പെടൽ നമ്പറുകൾ
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                    {(wardContactsResult.data as any).contacts.map((c: any) => (
                      <div key={c.id} style={{
                        padding: '0.6rem 0.75rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--charcoal)' }}>
                          {c.nameMl || c.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{c.role}</div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                          📞 {c.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RICH RESULT: Kerala Government Directory */}
              {govtContactsResult && (govtContactsResult.data as any)?.contacts?.length > 0 && (
                <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase' }}>
                    കേരള സർക്കാർ ഔദ്യോഗിക ഡയറക്ടറി
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                    {(govtContactsResult.data as any).contacts.slice(0, 4).map((c: any) => (
                      <div key={c.id} style={{
                        padding: '0.6rem 0.75rem',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--charcoal)' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{c.designation}</div>
                        <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                          📞 {c.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RICH RESULT: Ward Statistics (for Representatives or Inquiry) */}
              {statsResult && (statsResult.data as any) && (
                <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{(statsResult.data as any).totalIssues}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--outline)', fontWeight: 600 }}>ആകെ പരാതികൾ</div>
                  </div>
                  <div style={{ padding: '0.5rem', background: '#fffbeb', borderRadius: '8px', textAlign: 'center', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>{(statsResult.data as any).openIssues}</div>
                    <div style={{ fontSize: '0.65rem', color: '#92400e', fontWeight: 600 }}>നടപടിയിൽ</div>
                  </div>
                  <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#15803d' }}>{(statsResult.data as any).resolvedIssues}</div>
                    <div style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 600 }}>പരിഹരിച്ചവ</div>
                  </div>
                  <div style={{ padding: '0.5rem', background: '#eff6ff', borderRadius: '8px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1d4ed8' }}>{(statsResult.data as any).resolutionRatePercent}%</div>
                    <div style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: 600 }}>പരിഹാര നിരക്ക്</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
