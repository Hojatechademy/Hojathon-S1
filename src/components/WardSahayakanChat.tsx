import React, { useState } from 'react';
import { Send, Bot, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { AuthenticatedUserContext, SafeActivityStep, AgentRunRecord } from '../types/agent';
import { defaultAgentRunner } from '../agent/runner';

interface WardSahayakanChatProps {
  authContext: AuthenticatedUserContext;
  onIssueCreated?: (runRecord: AgentRunRecord) => void;
}

export const WardSahayakanChat: React.FC<WardSahayakanChatProps> = ({
  authContext,
  onIssueCreated
}) => {
  const [input, setInput] = useState('നമ്മുടെ വാർഡിലെ സ്കൂളിന്റെ അടുത്തുള്ള റോഡ് വളരെ മോശമാണ്.');
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<SafeActivityStep[]>([]);
  const [latestRun, setLatestRun] = useState<AgentRunRecord | null>(null);

  const handleRunAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;

    setIsRunning(true);
    setSteps([]);
    setLatestRun(null);

    try {
      const result = await defaultAgentRunner.processComplaint(
        input,
        authContext,
        (newStep) => {
          setSteps(prev => [...prev, newStep]);
        }
      );
      setLatestRun(result);
      if (onIssueCreated) {
        onIssueCreated(result);
      }
    } catch (err) {
      console.error('Agent processing failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="civic-card" style={{ border: '1px solid var(--civic-200)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--slate-200)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ 
            width: '2rem', 
            height: '2rem', 
            borderRadius: '8px', 
            background: 'var(--civic-100)', 
            color: 'var(--civic-800)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Bot size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--slate-900)' }}>
              വാർഡ് സഹായിയുമായി സംസാരിക്കുക
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
              സ്വാഭാവിക മലയാളത്തിൽ പരാതി നൽകൂ, ഏജന്റ് നടപടി സ്വീകരിക്കും.
            </p>
          </div>
        </div>

        <div className="badge badge-civic">
          <Sparkles size={12} />
          <span>ടൂൾ-എനേബിൾഡ് ഏജന്റ്</span>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleRunAgent} style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="നിങ്ങളുടെ വാർഡിലെ പ്രശ്നം ഇവിടെ രേഖപ്പെടുത്തുക..."
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--slate-300)',
              outline: 'none',
              resize: 'none',
              fontSize: '0.95rem'
            }}
          />
          <button
            type="submit"
            disabled={isRunning || !input.trim()}
            className="btn-primary"
            style={{ minWidth: '140px', alignSelf: 'flex-end', height: '3rem' }}
          >
            {isRunning ? (
              <>
                <Clock size={16} className="spin" />
                <span>പരിശോധിക്കുന്നു...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>അയക്കുക</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggested Quick Prompt */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>മാതൃകാ ചോദ്യം:</span>
        <button
          type="button"
          onClick={() => setInput('നമ്മുടെ വാർഡിലെ സ്കൂളിന്റെ അടുത്തുള്ള റോഡ് വളരെ മോശമാണ്.')}
          style={{
            fontSize: '0.8rem',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            background: 'var(--slate-100)',
            color: 'var(--civic-800)',
            border: '1px solid var(--slate-200)'
          }}
        >
          "സ്കൂളിന്റെ അടുത്തുള്ള റോഡ് മോശമാണ്"
        </button>
      </div>

      {/* Safe Agent Activity Milestones */}
      {steps.length > 0 && (
        <div style={{
          background: 'var(--slate-50)',
          borderRadius: '8px',
          padding: '1rem',
          border: '1px solid var(--slate-200)',
          marginTop: '1rem'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="var(--civic-600)" />
            <span>സുരക്ഷിത ഏജന്റ് പ്രവർത്തനങ്ങൾ (Safe Agent Activity)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {steps.map((step) => (
              <div 
                key={step.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem',
                  fontSize: '0.875rem',
                  color: 'var(--slate-800)'
                }}
              >
                <CheckCircle2 size={16} color="var(--civic-600)" />
                <span style={{ fontWeight: 500 }}>{step.labelMl}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>({step.labelEn})</span>
              </div>
            ))}
          </div>

          {/* Final Agent Response Box */}
          {latestRun?.finalResponseMl && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.85rem', 
              background: 'var(--civic-50)', 
              borderRadius: '6px', 
              borderLeft: '4px solid var(--civic-600)',
              color: 'var(--civic-900)',
              fontSize: '0.9rem'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Bot size={16} />
                <span>വാർഡ് സഹായിയുടെ സന്ദേശം:</span>
              </div>
              <p>{latestRun.finalResponseMl}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
