import { Bot, ShieldCheck, Activity } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
      color: '#ffffff',
      padding: '2.75rem 0',
      marginBottom: '2rem',
      borderRadius: '0 0 16px 16px',
      boxShadow: '0 4px 20px -4px rgba(6, 78, 59, 0.25)'
    }}>
      <div className="container">
        <div style={{ maxWidth: '850px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <Bot size={16} />
            <span>AI ഏജന്റ്: വാർഡ് സഹായി (Ward Sahayakan)</span>
          </div>

          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.75rem' }}>
            ജനങ്ങളും വാർഡ് പ്രതിനിധിയും തമ്മിലുള്ള വിശ്വസ്ത ഡിജിറ്റൽ പാലം
          </h1>
          
          <p style={{ fontSize: '1.05rem', color: '#d1fae5', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            തദ്ദേശ സ്വയംഭരണ തലത്തിൽ പൊതുപ്രശ്നങ്ങൾ ഉന്നയിക്കാനും, ഏജന്റ് വഴി തരംതിരിച്ച് അംഗീകൃത വാർഡ് മെമ്പർക്ക് എത്തിക്കാനും, തെളിവുസഹിതം നടപടികൾ നിരീക്ഷിക്കാനുമുള്ള സ്വകാര്യ വാർഡ് പ്ലാറ്റ്‌ഫോം.
          </p>

          {/* Workflow badges */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '0.75rem',
            marginTop: '1.25rem' 
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Activity size={18} color="#a7f3d0" />
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>ഘട്ടം 1: റിപ്പോർട്ടിംഗ്</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>മലയാളത്തിൽ പരാതി നൽകൽ</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Bot size={18} color="#a7f3d0" />
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>ഘട്ടം 2: ഏജന്റ് ടൂൾ പ്രവർത്തനം</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>ഓട്ടോമേറ്റഡ് ടൂൾ എക്സിക്യൂഷൻ</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={18} color="#a7f3d0" />
              <div>
                <div style={{ fontSize: '0.8rem', color: '#a7f3d0' }}>ഘട്ടം 3: പരിഹാരം & തെളിവ്</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>പ്രതിനിധി നടപടിയും ടൈംലൈനും</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
