import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { defaultAgentRunner } from '../../agent/runner';
import { AuthenticatedUserContext } from '../../types/agent';
import { DEMO_ISSUES, DEMO_TIMELINES } from '../../services/mockData';

export const StitchCivicApp: React.FC = () => {
  // Navigation & Role State ('resident' | 'representative' | 'admin' | 'auth_portal')
  const [activeTab, setActiveTab] = useState<'resident' | 'representative' | 'admin' | 'auth_portal'>('resident');
  const [sidebarTabIndex, setSidebarTabIndex] = useState(0);

  // Dedicated Login Experience State ('select_role' | 'login_resident' | 'login_representative' | 'login_admin')
  const [loginView, setLoginView] = useState<'select_role' | 'login_resident' | 'login_representative' | 'login_admin'>('select_role');
  const [loginEmail, setLoginEmail] = useState('anoop.ward7@enteward.in');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSuccessNotice, setLoginSuccessNotice] = useState<string | null>(null);

  // Issues State (Synced with Supabase)
  const [issuesList, setIssuesList] = useState(DEMO_ISSUES);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('EW-1042');
  const [selectedIssueTimeline, setSelectedIssueTimeline] = useState<any[]>(DEMO_TIMELINES['issue-demo-1042'] || []);

  // Modals state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddResidentModalOpen, setIsAddResidentModalOpen] = useState(false);
  const [isCreateRepModalOpen, setIsCreateRepModalOpen] = useState(false);

  // 5-Step Report Modal State
  const [reportStep, setReportStep] = useState(1);
  const [reportTitle, setReportTitle] = useState('റോഡ് മോശമാണ് - സ്കൂളിന് സമീപം');
  const [reportDesc, setReportDesc] = useState('സ്കൂളിന് സമീപമുള്ള റോഡിൽ വലിയ കുഴികൾ രൂപപ്പെട്ടു. മഴയത്ത് വെള്ളക്കെട്ട് കാരണം കുട്ടികൾക്കും കാൽനടയാത്രക്കാർക്കും സഞ്ചരിക്കാൻ ബുദ്ധിമുട്ടാണ്.');
  const [reportCategory, setReportCategory] = useState('Roads & Bridges');
  const [reportLocation, setReportLocation] = useState('Opposite Govt LP School Chakkai main gate, Temple Road');

  // AI Agent Input & Execution State
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAgentExecuting, setIsAgentExecuting] = useState(false);
  const [isAgentPanelVisible, setIsAgentPanelVisible] = useState(false);
  const [agentStepStatuses, setAgentStepStatuses] = useState([false, false, false, false, false, false]);
  const [agentSummaryMessage, setAgentSummaryMessage] = useState('');

  // Star rating state
  const [ratedStars, setRatedStars] = useState(0);

  // Fetch live issues from Supabase on load
  const loadSupabaseIssues = async () => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            issueNumber: d.issue_number || `EW-${d.id.slice(0, 4)}`,
            wardId: d.ward_id || 'ward-07-kadakampally',
            residentId: d.resident_id || 'user-resident-01',
            titleMl: d.title_ml || d.title || 'വാർഡ് പരാതി',
            descriptionMl: d.description_ml || d.description || '',
            category: d.category || 'roads',
            priority: d.priority || 'medium',
            status: d.status || 'submitted',
            locationLandmark: d.location_landmark || 'വാർഡ് 7',
            createdAt: d.created_at,
            updatedAt: d.updated_at
          }));
          setIssuesList([...mapped, ...DEMO_ISSUES]);
        }
      } catch (err) {
        console.warn('Supabase query note:', err);
      }
    }
  };

  useEffect(() => {
    loadSupabaseIssues();
  }, []);

  // Switch role handler
  const handleSwitchRole = (role: 'resident' | 'representative' | 'admin') => {
    setActiveTab(role);
    if (role === 'resident') setSidebarTabIndex(0);
    if (role === 'representative') setSidebarTabIndex(3);
    if (role === 'admin') setSidebarTabIndex(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run the real AI agent flow
  const handleRunAgenticWorkflow = async (promptOverride?: string) => {
    const text = promptOverride || aiPromptInput || 'റോഡ് മോശമാണ് - സ്കൂളിന് സമീപം വലിയ കുഴികൾ രൂപപ്പെട്ടു';
    setIsAgentPanelVisible(true);
    setIsAgentExecuting(true);
    setAgentStepStatuses([false, false, false, false, false, false]);
    setAgentSummaryMessage('');

    // Sequentially illuminate the 6 steps visually
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 400));
      setAgentStepStatuses(prev => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }

    // Call real agent runner
    const authContext: AuthenticatedUserContext = {
      userId: 'user-resident-01',
      fullName: 'Anoop V.',
      role: 'resident',
      wardId: 'ward-07-kadakampally',
      wardNumber: 7,
      wardNameMl: 'ചാക്ക (വാർഡ് 7)',
      isAuthenticated: true
    };

    try {
      const runResult = await defaultAgentRunner.processComplaint(text, authContext);
      setAgentSummaryMessage(runResult.finalResponseMl || 'പരാതി #EW-1045 വിജയകരമായി രൂപീകരിച്ചു.');

      // Insert real issue into Supabase
      if (isSupabaseConfigured) {
        const newTicketNumber = `EW-${Math.floor(1045 + Math.random() * 50)}`;
        await supabase.from('issues').insert({
          id: `issue-${Date.now()}`,
          issue_number: newTicketNumber,
          ward_id: 'ward-07-kadakampally',
          resident_id: 'user-resident-01',
          category: 'roads',
          title_ml: text.slice(0, 60),
          description_ml: text,
          priority: 'high',
          status: 'submitted',
          location_landmark: 'ഗവ. എൽ.പി സ്കൂളിന് സമീപം, ചാക്ക'
        });
      }

      // Add to local state
      const createdItem: any = {
        id: `issue-${Date.now()}`,
        issueNumber: `EW-${Math.floor(1045 + Math.random() * 50)}`,
        wardId: 'ward-07-kadakampally',
        residentId: 'user-resident-01',
        titleMl: text,
        descriptionMl: text,
        category: 'roads',
        priority: 'high',
        status: 'submitted',
        locationLandmark: 'ഗവ. എൽ.പി സ്കൂളിന് സമീപം, ചാക്ക',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setIssuesList(prev => [createdItem, ...prev]);
    } catch (err) {
      console.warn('Agent processing note:', err);
    } finally {
      setIsAgentExecuting(false);
    }
  };

  // Submit 5-step report modal to Supabase
  const handleSubmitReportModal = async () => {
    const newNum = `EW-${Math.floor(1050 + Math.random() * 50)}`;
    const newIssueRecord: any = {
      id: `issue-${Date.now()}`,
      issueNumber: newNum,
      wardId: 'ward-07-kadakampally',
      residentId: 'user-resident-01',
      titleMl: reportTitle,
      descriptionMl: reportDesc,
      category: reportCategory.toLowerCase().includes('water') ? 'water_supply' : reportCategory.toLowerCase().includes('light') ? 'streetlights' : 'roads',
      priority: 'high',
      status: 'submitted',
      locationLandmark: reportLocation,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('issues').insert({
          id: newIssueRecord.id,
          issue_number: newNum,
          ward_id: 'ward-07-kadakampally',
          resident_id: 'user-resident-01',
          title_ml: reportTitle,
          description_ml: reportDesc,
          priority: 'high',
          status: 'submitted',
          location_landmark: reportLocation
        });
      } catch (e) {
        console.warn('Supabase modal insert notice:', e);
      }
    }

    setIssuesList(prev => [newIssueRecord, ...prev]);
    setIsReportModalOpen(false);
    setReportStep(1);
    alert(`Petition #${newNum} formulated and queued for Ward Representative Smt. Lathika Kumari.`);
  };

  // Acknowledge action in Action Hub
  const handleAcknowledge = async (id: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('issues').update({ status: 'triaged' }).eq('issue_number', id);
    }
    setIssuesList(prev => prev.map(i => i.issueNumber === id ? { ...i, status: 'triaged' } : i));
    alert(`Issue #${id} acknowledged by Representative Smt. Lathika Kumari. Citizen notified via SMS & App.`);
  };

  // Resolve action in Action Hub
  const handleResolve = async (id: string) => {
    if (isSupabaseConfigured) {
      await supabase.from('issues').update({ status: 'resolved' }).eq('issue_number', id);
    }
    setIssuesList(prev => prev.map(i => i.issueNumber === id ? { ...i, status: 'resolved' } : i));
    alert(`Issue #${id} marked as resolved with completed works order.`);
  };

  // Open issue detail modal
  const handleOpenIssueDetail = (ticketId: string) => {
    setSelectedIssueId(ticketId);
    const found = issuesList.find(i => i.issueNumber === ticketId);
    if (found && DEMO_TIMELINES[found.id]) {
      setSelectedIssueTimeline(DEMO_TIMELINES[found.id]);
    } else {
      setSelectedIssueTimeline([
        {
          id: '1',
          titleMl: 'പരാതി വാർഡ് സഹായി വഴി രൂപീകരിച്ചു',
          remarksMl: 'Geotag logged and boundary conditions verified with photograph.',
          status: 'submitted',
          createdAt: new Date().toISOString()
        }
      ]);
    }
    setIsDetailModalOpen(true);
  };

  return (
    <div className="bg-[#F9FAF8] text-on-surface antialiased min-h-screen font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-primary">

      {/* =======================================================
           VIEW A: DEDICATED LOGIN & WELCOME EXPERIENCE
           ======================================================= */}
      {activeTab === 'auth_portal' ? (
        <div className="min-h-screen flex flex-col justify-between relative bg-[#F8FAF9]">
          {/* Subtle Ambient Background */}
          <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-teal-100/50 blur-3xl"></div>
            <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-emerald-50/70 blur-3xl"></div>
          </div>

          {/* Top Header */}
          <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-primary/10">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white animate-pulse"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary">Ente Ward</span>
                <span className="text-sm font-semibold text-outline font-malayalam">(എന്റെ വാർഡ്)</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('resident')}
              className="px-4 py-2 rounded-xl bg-white border border-outline-light text-xs font-semibold text-primary hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">dashboard</span>
              <span>Open Civic Platform</span>
            </button>
          </header>

          {/* Dedicated Login Main */}
          <main className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 my-auto flex flex-col justify-center">
            {loginSuccessNotice && (
              <div className="p-3 mb-6 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                <span>{loginSuccessNotice}</span>
              </div>
            )}

            {/* Sub-view 1: Role Selection */}
            {loginView === 'select_role' && (
              <div className="space-y-10 animate-fadeIn">
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-outline-light shadow-xs text-xs font-medium text-primary">
                    <span className="material-symbols-outlined text-xs text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                    <span>Community · Transparency · Local Action</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal tracking-tight leading-tight">
                    Your ward. One conversation.<br className="hidden sm:inline" /> Real action.
                  </h1>
                  <p className="text-lg sm:text-xl font-semibold text-primary font-malayalam">
                    നിങ്ങളുടെ വാർഡ്. ഒരു സംഭാഷണം. യഥാർത്ഥ നടപടി.
                  </p>
                  <p className="text-sm sm:text-base text-outline max-w-lg mx-auto">
                    Choose how you want to access Ente Ward. / എന്റെ വാർഡിലേക്ക് പ്രവേശിക്കാൻ നിങ്ങളുടെ പങ്ക് തിരഞ്ഞെടുക്കുക.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* CARD 1: RESIDENT */}
                  <div
                    onClick={() => setLoginView('login_resident')}
                    role="button"
                    tabIndex={0}
                    className="group relative p-7 sm:p-8 rounded-2xl bg-white border-2 border-transparent hover:border-primary shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-mint border border-mint-border text-primary flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[11px] font-bold text-[#065F46] uppercase tracking-wider">Citizen Access</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-2xl font-bold text-charcoal group-hover:text-primary transition-colors">Resident</h2>
                          <span className="text-base font-semibold text-outline font-malayalam">(താമസക്കാരൻ)</span>
                        </div>
                        <p className="text-sm text-outline mt-2.5 leading-relaxed">
                          Report local problems, track your complaints, discover ward information and talk to Ward Sahayakan.
                        </p>
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t border-outline-light flex items-center justify-between">
                      <span className="text-xs font-medium text-outline">Geofenced Ward Access</span>
                      <button type="button" className="px-4 py-2.5 rounded-xl bg-primary group-hover:bg-primary-light text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all">
                        <span>Continue as Resident</span>
                        <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 2: REPRESENTATIVE */}
                  <div
                    onClick={() => setLoginView('login_representative')}
                    role="button"
                    tabIndex={0}
                    className="group relative p-7 sm:p-8 rounded-2xl bg-white border-2 border-transparent hover:border-secondary shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-[#E6FFFA] border border-[#9BF2E8] text-secondary flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#E6FFFA] border border-[#7FD5CC] text-[11px] font-bold text-[#00504A] uppercase tracking-wider">Elected Member</span>
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <h2 className="text-2xl font-bold text-charcoal group-hover:text-secondary transition-colors">Representative</h2>
                          <span className="text-base font-semibold text-outline font-malayalam">(പ്രതിനിധി)</span>
                        </div>
                        <p className="text-sm text-outline mt-2.5 leading-relaxed">
                          Manage your ward, respond to issues, support residents and keep your community informed.
                        </p>
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t border-outline-light flex items-center justify-between">
                      <span className="text-xs font-medium text-outline">Verified Credentials</span>
                      <button type="button" className="px-4 py-2.5 rounded-xl bg-secondary group-hover:bg-[#00504A] text-white font-semibold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all">
                        <span>Continue as Representative</span>
                        <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/70 border border-outline-light flex items-center justify-between text-xs text-outline">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-sm">security</span>
                    <span>End-to-end civic resolution flow</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">Kadakampally Grama Panchayat</span>
                    <span className="font-medium text-primary font-malayalam">വാർഡ് 7 · ചാക്ക</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 2: Resident Login Form */}
            {loginView === 'login_resident' && (
              <div className="w-full max-w-md mx-auto animate-fadeIn">
                <div className="p-8 rounded-2xl bg-white border border-outline-light shadow-xl space-y-6">
                  <button onClick={() => setLoginView('select_role')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Back to choose account type</span>
                  </button>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-mint text-primary text-xs font-semibold border border-mint-border">
                      <span className="material-symbols-outlined text-xs">person</span> Resident Portal
                    </div>
                    <h2 className="text-2xl font-bold text-charcoal">Welcome back.</h2>
                    <p className="text-sm font-semibold text-primary font-malayalam">തിരികെ സ്വാഗതം</p>
                    <p className="text-xs text-outline">Sign in to your Ente Ward account.</p>
                  </div>

                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    setLoginLoading(true);
                    setTimeout(() => {
                      setLoginLoading(false);
                      setLoginSuccessNotice('Signed in as Resident. Redirecting to Resident Dashboard...');
                      setTimeout(() => {
                        handleSwitchRole('resident');
                        setLoginSuccessNotice(null);
                      }, 500);
                    }, 600);
                  }}>
                    <div>
                      <label className="block text-xs font-bold uppercase text-outline mb-1.5">Mobile Number or Email</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">mail</span>
                        <input type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-light text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-outline mb-1.5">Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">lock</span>
                        <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-light text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F8FAF9] text-xs text-outline flex items-start gap-2 border border-outline-light">
                      <span className="material-symbols-outlined text-primary text-sm shrink-0">shield</span>
                      <span>Resident accounts are bound to Kadakampally GP · Ward 7.</span>
                    </div>
                    <button type="submit" disabled={loginLoading} className="w-full py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all">
                      {loginLoading ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In as Resident</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Sub-view 3: Representative Login Form */}
            {loginView === 'login_representative' && (
              <div className="w-full max-w-md mx-auto animate-fadeIn">
                <div className="p-8 rounded-2xl bg-white border border-outline-light shadow-xl space-y-6">
                  <button onClick={() => setLoginView('select_role')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-secondary transition-colors">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Back to choose account type</span>
                  </button>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#E6FFFA] text-secondary text-xs font-semibold border border-[#9BF2E8]">
                      <span className="material-symbols-outlined text-xs">badge</span> Representative Access
                    </div>
                    <h2 className="text-2xl font-bold text-charcoal">Representative access</h2>
                    <p className="text-sm font-semibold text-secondary font-malayalam">പ്രതിനിധി പ്രവേശനം</p>
                    <p className="text-xs text-outline">Sign in to manage your assigned ward.</p>
                  </div>

                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    setLoginLoading(true);
                    setTimeout(() => {
                      setLoginLoading(false);
                      setLoginSuccessNotice('Authorized as Ward Representative. Opening Action Hub...');
                      setTimeout(() => {
                        handleSwitchRole('representative');
                        setLoginSuccessNotice(null);
                      }, 500);
                    }, 600);
                  }}>
                    <div>
                      <label className="block text-xs font-bold uppercase text-outline mb-1.5">Official UID or Email</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">account_circle</span>
                        <input type="text" defaultValue="lathika.rep7@kadakampally.enteward.in" required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-light text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-outline mb-1.5">Password</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">vpn_key</span>
                        <input type="password" defaultValue="••••••••••••" required className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-light text-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#065F46] flex items-start gap-2">
                      <span className="material-symbols-outlined text-base shrink-0">verified_user</span>
                      <span><strong>Trust Policy:</strong> Representative accounts are created by Ente Ward administrators.</span>
                    </div>
                    <button type="submit" disabled={loginLoading} className="w-full py-3 rounded-xl bg-secondary hover:bg-[#00504A] text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all">
                      {loginLoading ? (
                        <>
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Ward Action Hub</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Sub-view 4: Admin Login Form */}
            {loginView === 'login_admin' && (
              <div className="w-full max-w-md mx-auto animate-fadeIn">
                <div className="p-8 rounded-2xl bg-white border border-outline-light shadow-xl space-y-6">
                  <button onClick={() => setLoginView('select_role')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-outline hover:text-charcoal transition-colors">
                    <span className="material-symbols-outlined text-base">arrow_back</span>
                    <span>Back to Ente Ward</span>
                  </button>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-semibold border border-[#FDE68A]">
                      <span className="material-symbols-outlined text-xs">shield_lock</span> Staff Access
                    </div>
                    <h2 className="text-2xl font-bold text-charcoal">Platform Administration</h2>
                    <p className="text-sm font-semibold text-[#92400E] font-malayalam">അഡ്മിനിസ്ട്രേഷൻ</p>
                    <p className="text-xs text-outline">Authorized Ente Ward administrators only.</p>
                  </div>

                  <form className="space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    setLoginLoading(true);
                    setTimeout(() => {
                      setLoginLoading(false);
                      setLoginSuccessNotice('Platform Administrator verified. Loading Console...');
                      setTimeout(() => {
                        handleSwitchRole('admin');
                        setLoginSuccessNotice(null);
                      }, 500);
                    }, 600);
                  }}>
                    <div>
                      <label className="block text-xs font-bold uppercase text-outline mb-1.5">Admin Credential</label>
                      <input type="email" defaultValue="mshibin042@gmail.com" required className="w-full px-4 py-2.5 rounded-xl border border-outline-light text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-outline mb-1.5">Password</label>
                      <input type="password" placeholder="Enter administrator password" required className="w-full px-4 py-2.5 rounded-xl border border-outline-light text-sm" />
                    </div>
                    <button type="submit" disabled={loginLoading} className="w-full py-3 rounded-xl bg-charcoal hover:bg-black text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all">
                      <span>Sign In as Administrator</span>
                      <span className="material-symbols-outlined text-sm">terminal</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6 border-t border-outline-light/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-outline">
            <div className="flex items-center gap-2">
              <span className="font-medium text-charcoal">Ente Ward Civic Tech</span>
              <span>•</span>
              <span className="text-[11px]">Private civic technology platform. Not affiliated with any government department.</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setLoginView('login_admin')} className="hover:text-charcoal text-outline font-medium underline-offset-2 hover:underline">
                Platform Administration (അഡ്മിനിസ്ട്രേഷൻ)
              </button>
            </div>
          </footer>
        </div>
      ) : (

        /* =======================================================
             VIEW B: MAIN ENTE WARD AI CIVIC PLATFORM
             ======================================================= */
        <div className="min-h-screen">
          {/* SIDEBAR NAVIGATION */}
          <aside className="fixed top-0 left-0 bottom-0 z-40 w-64 p-space-md flex flex-col justify-between bg-surface-container-lowest border-r border-outline-variant/30 shadow-sm">
            <div className="flex flex-col gap-y-4">
              {/* Header / Brand */}
              <div className="flex items-center gap-3 px-2 py-1 cursor-pointer" onClick={() => handleSwitchRole('resident')}>
                <div className="w-9 h-9 rounded-xl bg-primary-container text-white flex items-center justify-center font-bold shadow-sm">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div>
                  <h1 className="text-title-lg font-title-lg text-primary tracking-tight font-bold">Ente Ward (എന്റെ വാർഡ്)</h1>
                  <p className="text-label-sm font-label-sm text-outline font-medium">Kadakampally GP · Ward 7</p>
                </div>
              </div>

              {/* Quick CTA */}
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-primary-container hover:bg-[#125B42] text-white font-title-md text-title-md shadow-sm transition-all duration-150 active:scale-[0.99]"
                onClick={() => setIsReportModalOpen(true)}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>New Civic Report / പുതിയ പരാതി</span>
              </button>

              {/* Navigation Tabs */}
              <nav className="flex flex-col gap-1 mt-2" id="sidebarNav">
                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-title-md text-title-md transition-colors ${sidebarTabIndex === 0 ? 'bg-surface-container text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`}
                  href="#residentView"
                  onClick={(e) => { e.preventDefault(); handleSwitchRole('resident'); }}
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  <span>Dashboard / ഡാഷ്‌ബോർഡ്</span>
                </a>

                <a
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface font-title-md text-title-md transition-colors hover:bg-surface-container-low"
                  href="#wardSahayakan"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSwitchRole('resident');
                    handleRunAgenticWorkflow('റോഡ് മോശമാണ് - സ്കൂളിന് സമീപം വലിയ കുഴികൾ രൂപപ്പെട്ടു');
                  }}
                >
                  <span className="material-symbols-outlined">smart_toy</span>
                  <span>Ward Sahayakan / വാർഡ് സഹായി</span>
                </a>

                <a
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:text-on-surface font-title-md text-title-md transition-colors hover:bg-surface-container-low"
                  href="#issuesSection"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSwitchRole('resident');
                    const el = document.getElementById('issuesListContainer');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="material-symbols-outlined">report_problem</span>
                  <span>Issues & Petitions / പരാതികൾ</span>
                </a>

                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-title-md text-title-md transition-colors ${sidebarTabIndex === 3 ? 'bg-surface-container text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`}
                  href="#repHub"
                  onClick={(e) => { e.preventDefault(); handleSwitchRole('representative'); }}
                >
                  <span className="material-symbols-outlined">groups</span>
                  <span>Ward Directory / റസിഡന്റ്സ്</span>
                </a>

                <a
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-title-md text-title-md transition-colors ${sidebarTabIndex === 4 ? 'bg-surface-container text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'}`}
                  href="#adminConsole"
                  onClick={(e) => { e.preventDefault(); handleSwitchRole('admin'); }}
                >
                  <span className="material-symbols-outlined">account_tree</span>
                  <span>Hierarchy & Settings / ക്രമീകരണങ്ങൾ</span>
                </a>
              </nav>
            </div>

            {/* Sidebar Bottom */}
            <div className="border-t border-outline-variant/30 pt-3 flex flex-col gap-1">
              <div className="px-2 py-1.5 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-label-sm font-label-sm text-primary font-medium">Supabase Connected · Ward 7</span>
              </div>
              <button
                onClick={() => { setActiveTab('auth_portal'); setLoginView('select_role'); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-outline hover:text-on-surface text-body-sm font-body-sm transition-colors hover:bg-surface-container-low text-left"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Account Login / പോർട്ടൽ</span>
              </button>
            </div>
          </aside>

          {/* TOP NAVBAR */}
          <header className="sticky top-0 right-0 z-30 flex items-center justify-between px-space-lg h-16 w-full ml-64 bg-surface-container-lowest border-b border-outline-variant/30 shadow-sm backdrop-blur-md bg-opacity-95">
            {/* Search Bar */}
            <div className="flex items-center gap-3 w-72">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg pointer-events-none">search</span>
                <input className="w-full pl-9 pr-8 py-1.5 bg-surface-bright rounded-lg border border-outline-variant/50 text-body-sm font-body-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" placeholder="Search issues, ward memo, rules..." type="text" />
                <span className="absolute right-2.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-outline bg-surface-container border border-outline-variant/30">⌘K</span>
              </div>
            </div>

            {/* Direct Nav links & Role Switcher */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-5">
                <button
                  className={`${activeTab === 'resident' ? 'text-primary border-b-2 border-primary pb-1 font-semibold' : 'text-on-surface-variant hover:text-on-surface'} font-title-md text-title-md transition-colors`}
                  onClick={() => handleSwitchRole('resident')}
                >
                  Resident Portal
                </button>
                <button
                  className={`${activeTab === 'representative' ? 'text-primary border-b-2 border-primary pb-1 font-semibold' : 'text-on-surface-variant hover:text-on-surface'} font-title-md text-title-md transition-colors`}
                  onClick={() => handleSwitchRole('representative')}
                >
                  Ward Rep Hub
                </button>
                <button
                  className={`${activeTab === 'admin' ? 'text-primary border-b-2 border-primary pb-1 font-semibold' : 'text-on-surface-variant hover:text-on-surface'} font-title-md text-title-md transition-colors`}
                  onClick={() => handleSwitchRole('admin')}
                >
                  Admin Console
                </button>
              </nav>

              <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/40">
                <div className="px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-surface-container text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">translate</span>
                  <span>English / മലയാളം</span>
                </div>

                <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[#0B4634] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                  <span className="text-label-sm font-label-sm font-semibold text-[#0B4634]">
                    {activeTab === 'resident' ? 'Role: Resident (Ward 7)' : activeTab === 'representative' ? 'Role: Ward Rep (Ward 7)' : 'Role: Platform Admin'}
                  </span>
                </div>

                <button
                  onClick={() => { setActiveTab('auth_portal'); setLoginView('select_role'); }}
                  className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-medium text-xs shadow-inner cursor-pointer"
                  title="Switch Role / Sign In"
                >
                  {activeTab === 'resident' ? 'AV' : activeTab === 'representative' ? 'LK' : 'SP'}
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CANVAS */}
          <main className="ml-64 p-space-xl min-h-[calc(100vh-4rem)] relative max-w-[1440px]">

            {/* =======================================================
                 VIEW 1: RESIDENT VIEW
                 ======================================================= */}
            {activeTab === 'resident' && (
              <div className="space-y-8 animate-fadeIn" id="viewResident">
                {/* HERO HEADER */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B4634] via-[#0E523E] to-[#125B42] text-white p-8 shadow-md border border-[#16654C]/40">
                  <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium border border-white/20 text-[#b6efd5]">
                        <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
                        <span>Kadakampally GP · Ward 7 (Chakkai)</span>
                      </div>
                      <h1 className="text-display-lg font-headline-lg font-bold tracking-tight text-white leading-tight">
                        Tell your ward what needs attention.
                        <span className="block text-xl font-normal text-white/80 mt-1 font-headline-md">നിങ്ങളുടെ വാർഡിന് എന്താണ് വേണ്ടതെന്ന് പറയൂ</span>
                      </h1>
                      <p className="text-body-md font-body-md text-white/70 max-w-xl">
                        Voice local concerns, report infrastructure damage, or follow Grama Panchayat developments with transparent end-to-end civic resolution.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
                      <button
                        className="px-5 py-3 rounded-xl bg-white text-primary font-title-md font-semibold shadow-lg hover:bg-[#F9FAF8] transition-all flex items-center gap-2 active:scale-95"
                        onClick={() => setIsReportModalOpen(true)}
                      >
                        <span className="material-symbols-outlined text-xl text-primary">campaign</span>
                        <span>File New Issue / പരാതി നൽകുക</span>
                      </button>
                      <button
                        className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-title-md font-medium transition-all flex items-center gap-2"
                        onClick={() => {
                          const el = document.getElementById('issuesListContainer');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <span className="material-symbols-outlined text-xl">near_me</span>
                        <span>Track Ticket</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* WARD SAHAYAKAN AI COMPOSER & LIVE AGENTIC DRAWER */}
                <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#0B4634]">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-title-lg font-title-lg font-bold text-on-surface">Ward Sahayakan AI Composer</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#ECFDF5] text-[#0B4634] border border-[#A7F3D0]">Agentic Triage</span>
                        </div>
                        <p className="text-body-sm font-body-sm text-outline">Type naturally in Malayalam or English. Our automated civic agent categorizes, geotags, and prepares the petition for Ward 7 Representative.</p>
                      </div>
                    </div>
                    <span className="text-label-sm font-label-sm text-outline hidden sm:inline-block">Tool-Enabled Agent</span>
                  </div>

                  {/* Input Area */}
                  <div className="mt-4 relative">
                    <textarea
                      className="w-full p-4 rounded-xl border border-outline-variant/60 bg-surface-bright text-body-lg font-body-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                      id="aiPromptInput"
                      value={aiPromptInput}
                      onChange={(e) => setAiPromptInput(e.target.value)}
                      placeholder="റോഡ് മോശമാണ് - സ്കൂളിന് സമീപം, or describe a broken streetlight, stagnant water, waste accumulation..."
                      rows={3}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                      {/* Suggestion Chips */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-label-sm font-label-sm text-outline mr-1">Quick Prompts:</span>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-[#ECFDF5] text-on-surface-variant hover:text-[#0B4634] border border-outline-variant/40 text-label-sm font-label-sm transition-colors flex items-center gap-1"
                          onClick={() => {
                            const val = 'റോഡ് മോശമാണ് - സ്കൂളിന് സമീപം വലിയ കുഴികൾ രൂപപ്പെട്ടു';
                            setAiPromptInput(val);
                            handleRunAgenticWorkflow(val);
                          }}
                        >
                          <span>റോഡ് മോശമാണ് - സ്കൂളിന് സമീപം</span>
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-[#ECFDF5] text-on-surface-variant hover:text-[#0B4634] border border-outline-variant/40 text-label-sm font-label-sm transition-colors flex items-center gap-1"
                          onClick={() => handleOpenIssueDetail('EW-1042')}
                        >
                          <span className="material-symbols-outlined text-xs">search</span>
                          <span>Track EW-1042</span>
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-[#ECFDF5] text-on-surface-variant hover:text-[#0B4634] border border-outline-variant/40 text-label-sm font-label-sm transition-colors"
                          onClick={() => {
                            const val = 'Drinking water pipeline leak on Temple Road junction near Transformer';
                            setAiPromptInput(val);
                            handleRunAgenticWorkflow(val);
                          }}
                        >
                          <span>Drinking water pipeline leak</span>
                        </button>
                      </div>

                      {/* Run Agent Button */}
                      <button
                        className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-[#125B42] text-white font-title-md font-semibold text-title-md shadow-sm transition-all flex items-center gap-2 active:scale-95"
                        disabled={isAgentExecuting}
                        onClick={() => handleRunAgenticWorkflow()}
                      >
                        <span className="material-symbols-outlined text-base">psychology</span>
                        <span>{isAgentExecuting ? 'Agent Reasoning...' : 'Execute Sahayakan Agent'}</span>
                      </button>
                    </div>
                  </div>

                  {/* LIVE AGENTIC DRAWER */}
                  {isAgentPanelVisible && (
                    <div className="mt-6 p-5 rounded-xl bg-[#F4F9F6] border border-[#A7F3D0]/60 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                          </span>
                          <span className="font-headline-md text-headline-md font-bold text-primary">Ward Sahayakan · Live Multi-Step Execution</span>
                        </div>
                        <span className="text-label-sm font-label-sm text-outline">Autonomous Civic Agent</span>
                      </div>

                      <div className="space-y-2.5 font-mono text-body-sm">
                        {/* Step 1 */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg bg-white border border-outline-variant/30 text-on-surface transition-all duration-300 ${agentStepStatuses[0] ? 'opacity-100 shadow-xs' : 'opacity-40'}`}>
                          <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: agentStepStatuses[0] ? "'FILL' 1" : "'FILL' 0" }}>
                            {agentStepStatuses[0] ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div>
                            <strong className="font-semibold text-primary">1. UNDERSTAND:</strong> Parsed text: "Road deterioration near Govt LP School, Kadakampally Ward 7"
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg bg-white border border-outline-variant/30 text-on-surface transition-all duration-300 ${agentStepStatuses[1] ? 'opacity-100 shadow-xs' : 'opacity-40'}`}>
                          <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: agentStepStatuses[1] ? "'FILL' 1" : "'FILL' 0" }}>
                            {agentStepStatuses[1] ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div>
                            <strong className="font-semibold text-primary">2. CHECK CONTEXT:</strong> Verified Kadakampally Ward 7 boundaries & active representative Smt. Lathika Kumari.
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg bg-white border border-outline-variant/30 text-on-surface transition-all duration-300 ${agentStepStatuses[2] ? 'opacity-100 shadow-xs' : 'opacity-40'}`}>
                          <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: agentStepStatuses[2] ? "'FILL' 1" : "'FILL' 0" }}>
                            {agentStepStatuses[2] ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div>
                            <strong className="font-semibold text-primary">3. CLASSIFY:</strong> Category: Roads & Drainage · Suggested Priority: <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-sans text-xs font-bold">High (AI suggestion)</span>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg bg-white border border-outline-variant/30 text-on-surface transition-all duration-300 ${agentStepStatuses[3] ? 'opacity-100 shadow-xs' : 'opacity-40'}`}>
                          <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: agentStepStatuses[3] ? "'FILL' 1" : "'FILL' 0" }}>
                            {agentStepStatuses[3] ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div>
                            <strong className="font-semibold text-primary">4. PREPARE:</strong> Formulated ticket with verified coordinates (8.5085° N, 76.9214° E) and photo attachment.
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg bg-white border border-outline-variant/30 text-on-surface transition-all duration-300 ${agentStepStatuses[4] ? 'opacity-100 shadow-xs' : 'opacity-40'}`}>
                          <span className="material-symbols-outlined text-emerald-600 text-lg" style={{ fontVariationSettings: agentStepStatuses[4] ? "'FILL' 1" : "'FILL' 0" }}>
                            {agentStepStatuses[4] ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div>
                            <strong className="font-semibold text-primary">5. NOTIFY:</strong> Dispatched priority action item to Ward Representative Smt. Lathika Kumari.
                          </div>
                        </div>

                        {/* Step 6 */}
                        <div className={`flex items-start gap-3 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#0B4634] transition-all duration-300 ${agentStepStatuses[5] ? 'opacity-100 shadow-xs' : 'opacity-40'}`}>
                          <span className="material-symbols-outlined text-emerald-700 text-lg" style={{ fontVariationSettings: agentStepStatuses[5] ? "'FILL' 1" : "'FILL' 0" }}>
                            {agentStepStatuses[5] ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div className="flex-1 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <strong className="font-semibold">RESULT:</strong> Issue created with live citizen tracking link.
                            </div>
                            <button className="px-3 py-1 rounded bg-[#0B4634] text-white font-sans text-xs font-semibold hover:bg-opacity-90" onClick={() => handleOpenIssueDetail('EW-1042')}>
                              View Live Ticket
                            </button>
                          </div>
                        </div>
                      </div>

                      {agentSummaryMessage && (
                        <div className="p-3 bg-white rounded-lg border border-[#A7F3D0] text-xs text-primary font-sans">
                          {agentSummaryMessage}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* 2-COLUMN SECTION: MY ISSUES & QUICK WARD INFO */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: MY ISSUES LIST (2 Cols) */}
                  <div className="lg:col-span-2 space-y-4" id="issuesListContainer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-headline-md font-headline-md font-bold text-on-surface">My Ward Petitions & Issues</h2>
                        <p className="text-body-sm font-body-sm text-outline">Real-time status updates directly from Kadakampally Ward 7 desk.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-white text-label-sm font-label-sm font-medium">
                          All ({issuesList.length})
                        </span>
                      </div>
                    </div>

                    {/* Cards Stack */}
                    <div className="space-y-3">
                      {issuesList.map((issue) => (
                        <div
                          key={issue.id}
                          className="group p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => handleOpenIssueDetail(issue.issueNumber)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-semibold text-outline">#{issue.issueNumber}</span>
                                {issue.status === 'resolved' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#065F46]"></span>
                                    Resolved
                                  </span>
                                ) : issue.status === 'in_progress' ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] animate-pulse"></span>
                                    In Progress
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                    Submitted
                                  </span>
                                )}

                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-container text-on-surface-variant font-medium capitalize">
                                  {issue.category}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#ECFDF5] text-[#0B4634] font-medium border border-[#A7F3D0]">
                                  <span className="material-symbols-outlined text-xs">auto_awesome</span> Verified
                                </span>
                              </div>

                              <h3 className="text-title-lg font-title-lg font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {issue.titleMl}
                              </h3>
                              <p className="text-body-md font-body-md text-on-surface-variant line-clamp-2">
                                {issue.descriptionMl}
                              </p>
                            </div>

                            <div className="text-right whitespace-nowrap">
                              <span className="text-label-sm font-label-sm text-outline">Live Sync</span>
                              <div className="text-xs text-primary font-medium mt-2 flex items-center gap-1 justify-end">
                                <span>Inspect Timeline</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between text-xs text-outline">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-[#0B4634]">location_on</span>
                              <span>{issue.locationLandmark || 'Kadakampally Ward 7'}</span>
                            </div>
                            <div className="w-36 h-1.5 rounded-full bg-surface-container overflow-hidden">
                              <div className={`h-full rounded-full ${issue.status === 'resolved' ? 'w-full bg-emerald-600' : issue.status === 'in_progress' ? 'w-3/4 bg-[#0B4634]' : 'w-1/4 bg-amber-500'}`}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: QUICK WARD INFORMATION CARD (1 Col) */}
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                        <h3 className="text-title-lg font-title-lg font-bold text-on-surface">Ward 7 Directory & Office</h3>
                        <span className="material-symbols-outlined text-primary">location_city</span>
                      </div>

                      {/* Rep Profile Mini Banner */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-bright border border-outline-variant/40">
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                          LK
                        </div>
                        <div>
                          <h4 className="text-title-md font-title-md font-bold text-on-surface">Smt. Lathika Kumari</h4>
                          <p className="text-label-sm font-label-sm text-outline">Elected Representative · Ward 7</p>
                          <p className="text-[11px] text-primary font-medium">Kadakampally Grama Panchayat</p>
                        </div>
                      </div>

                      {/* Key Ward Facts */}
                      <div className="space-y-2.5 text-body-sm">
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="text-outline">Upcoming Ward Sabha:</span>
                          <span className="font-semibold text-on-surface flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs text-primary">event</span>
                            Sunday, Nov 12, 10:00 AM
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="text-outline">Venue:</span>
                          <span className="font-medium text-on-surface">Govt LP School Hall, Chakkai</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="text-outline">Emergency Water Desk:</span>
                          <span className="font-mono text-primary font-semibold">0471-2448911</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                          <span className="text-outline">KSEB Sub-station:</span>
                          <span className="font-mono text-primary font-semibold">1912 / 9496010101</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-outline">Total Active Petitions:</span>
                          <span className="font-bold text-primary">{issuesList.length} In System</span>
                        </div>
                      </div>

                      {/* Platform Notice */}
                      <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-amber-900 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="material-symbols-outlined text-sm text-amber-700">info</span>
                          <span>Private Civic Platform · Kadakampally Ward 7</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Connected directly to local Ward 7 representatives and panchayat infrastructure workflows.
                        </p>
                      </div>

                      <button
                        className="w-full py-2.5 rounded-xl border border-[#0B4634] text-[#0B4634] hover:bg-[#ECFDF5] font-title-md font-medium text-center transition-colors"
                        onClick={() => setIsReportModalOpen(true)}
                      >
                        Schedule Public Meeting Slot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =======================================================
                 VIEW 2: REPRESENTATIVE ACTION HUB
                 ======================================================= */}
            {activeTab === 'representative' && (
              <div className="space-y-8 animate-fadeIn" id="viewRepresentative">
                {/* REPRESENTATIVE HEADER / TRIAGE STATUS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#0B4634] border border-[#A7F3D0]">Ward Representative Desk</span>
                      <span className="text-label-sm font-label-sm text-outline">Ward 7 · Kadakampally</span>
                    </div>
                    <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface mt-1">Ward Action Hub / ജനപ്രതിനിധി കൺസോൾ</h1>
                    <p className="text-body-md font-body-md text-outline">Triage grievances, assign panchayat contractors, and publish official resolution logs.</p>
                  </div>
                  {/* Quick Stats Cards */}
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-center">
                      <span className="block text-2xl font-bold text-red-700 font-mono">
                        {issuesList.filter(i => i.status === 'submitted').length}
                      </span>
                      <span className="text-[11px] font-medium text-red-800 uppercase tracking-wide">Needs Action</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <span className="block text-2xl font-bold text-amber-700 font-mono">
                        {issuesList.filter(i => i.status === 'triaged').length}
                      </span>
                      <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wide">Triaged</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <span className="block text-2xl font-bold text-blue-700 font-mono">
                        {issuesList.filter(i => i.status === 'in_progress').length}
                      </span>
                      <span className="text-[11px] font-medium text-blue-800 uppercase tracking-wide">In Progress</span>
                    </div>
                  </div>
                </div>

                {/* AI WARD INSIGHT BANNER */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#ECFDF5] to-[#F0FDF4] border border-[#A7F3D0] flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-xs text-[#0B4634]">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-title-md font-title-md font-bold text-[#0B4634]">Voice of the Ward · AI Ward Insight</h4>
                      <span className="px-2 py-0.2 rounded text-[10px] bg-[#0B4634] text-white font-mono">LIVE SUMMARY</span>
                    </div>
                    <p className="text-body-sm font-body-sm text-[#065F46] mt-0.5">
                      "Road and monsoon drainage complaints surged near school zone. 3 repeat issues logged within 200m of Govt LP School. Recommended action: expedite culvert desilting before heavy rainfall on Thursday."
                    </p>
                  </div>
                </div>

                {/* ACTION TRIAGE CARDS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Urgent Triage Queue (Ward 7)</h3>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-surface-bright border border-outline-variant/40 text-label-sm font-medium">Filter by Department</button>
                    </div>
                  </div>

                  {issuesList.map((issue) => (
                    <div key={issue.id} className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-surface-container text-primary">#{issue.issueNumber}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                              {issue.status}
                            </span>
                            <span className="text-label-sm font-label-sm text-outline capitalize">Category: {issue.category}</span>
                          </div>
                          <h4 className="text-title-lg font-title-lg font-bold text-on-surface">{issue.titleMl}</h4>
                          <p className="text-body-md font-body-md text-on-surface-variant">{issue.descriptionMl}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {issue.status === 'submitted' && (
                            <button
                              className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#0B4634] border border-[#A7F3D0] text-title-md font-medium transition-all flex items-center gap-1.5"
                              onClick={() => handleAcknowledge(issue.issueNumber)}
                            >
                              <span className="material-symbols-outlined text-sm">done_all</span>
                              <span>Acknowledge</span>
                            </button>
                          )}

                          <button
                            className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-title-md font-medium transition-all flex items-center gap-1.5"
                            onClick={() => {
                              setIssuesList(prev => prev.map(i => i.id === issue.id ? { ...i, status: 'in_progress' } : i));
                              alert(`Status updated to In Progress for #${issue.issueNumber}`);
                            }}
                          >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            <span>Update Status</span>
                          </button>

                          {issue.status !== 'resolved' && (
                            <button
                              className="px-3 py-1.5 rounded-lg bg-[#0B4634] hover:bg-[#125B42] text-white text-title-md font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                              onClick={() => handleResolve(issue.issueNumber)}
                            >
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              <span>Resolve Issue</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* WARD RESIDENT MANAGEMENT TABLE */}
                <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Registered Ward 7 Residents</h3>
                      <p className="text-body-sm font-body-sm text-outline">142 verified residents enrolled via Kadakampally GP civic roster.</p>
                    </div>
                    <button
                      className="px-4 py-2 rounded-xl bg-primary-container hover:bg-[#125B42] text-white font-title-md font-semibold text-title-md flex items-center gap-2 self-start"
                      onClick={() => setIsAddResidentModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-base">person_add</span>
                      <span>+ Add Resident</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-outline-variant/30 rounded-xl">
                    <table className="w-full text-left border-collapse text-body-sm">
                      <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant/30">
                        <tr>
                          <th className="p-3 font-semibold">Resident Name</th>
                          <th className="p-3 font-semibold">House No. / Landmark</th>
                          <th className="p-3 font-semibold">Contact</th>
                          <th className="p-3 font-semibold">Bound Ward</th>
                          <th className="p-3 font-semibold">Petitions Logged</th>
                          <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 font-body-sm">
                        <tr className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="p-3 font-medium text-on-surface">Anoop V.</td>
                          <td className="p-3 text-outline">7/342, Temple View, Chakkai</td>
                          <td className="p-3 font-mono text-outline">+91 98470 *****</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-surface-container text-xs font-semibold">Ward 7 (Locked)</span></td>
                          <td className="p-3 font-mono font-medium">3 Petitions</td>
                          <td className="p-3 text-right">
                            <button className="text-primary hover:underline font-semibold text-xs">View Profile</button>
                          </td>
                        </tr>
                        <tr className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="p-3 font-medium text-on-surface">Sreedevi K.</td>
                          <td className="p-3 text-outline">7/118, Bypass Road, Chakkai</td>
                          <td className="p-3 font-mono text-outline">+91 94471 *****</td>
                          <td className="p-3"><span className="px-2 py-0.5 rounded bg-surface-container text-xs font-semibold">Ward 7 (Locked)</span></td>
                          <td className="p-3 font-mono font-medium">1 Petition</td>
                          <td className="p-3 text-right">
                            <button className="text-primary hover:underline font-semibold text-xs">View Profile</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* =======================================================
                 VIEW 3: ADMIN CIVIC STRUCTURE & HIERARCHY
                 ======================================================= */}
            {activeTab === 'admin' && (
              <div className="space-y-8 animate-fadeIn" id="viewAdmin">
                {/* ADMIN HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">Platform Super Admin</span>
                      <span className="text-label-sm font-label-sm text-outline">Civic Administration Node</span>
                    </div>
                    <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface mt-1">Kerala Civic Grid & Hierarchy / ഭരണക്രമം</h1>
                    <p className="text-body-md font-body-md text-outline">Provision Grama Panchayats, enforce Ward boundaries, and manage authorized Representative credentials.</p>
                  </div>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-[#125B42] text-white font-title-md font-semibold text-title-md shadow-sm transition-all flex items-center gap-2 self-start"
                    onClick={() => setIsCreateRepModalOpen(true)}
                  >
                    <span className="material-symbols-outlined text-base">person_add_alt</span>
                    <span>+ Create Representative</span>
                  </button>
                </div>

                {/* SECURITY NOTICE */}
                <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-red-900 flex items-start gap-3">
                  <span className="material-symbols-outlined text-xl text-red-600">shield_lock</span>
                  <div className="text-body-sm">
                    <strong className="font-bold">Strict Protocol Mandate:</strong> Representative accounts are exclusively provisioned by Ente Ward Administrators. Public self-registration is disabled to preserve institutional sovereignty.
                  </div>
                </div>

                {/* INTERACTIVE HIERARCHY VISUALIZER */}
                <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                    <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Administrative Tree Visualizer</h3>
                    <span className="text-label-sm font-label-sm text-outline">Interactive Cascade</span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-sm">KG</span>
                        <div>
                          <span className="text-xs uppercase font-bold text-outline">Tier 1 · State Grid</span>
                          <h4 className="text-title-lg font-title-lg font-bold text-on-surface">Kerala Civic Grid Architecture</h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-white border border-outline-variant/40 font-semibold">14 Districts Active</span>
                    </div>

                    <div className="pl-8 border-l-2 border-dashed border-outline-variant/60 ml-4 space-y-4">
                      <div className="p-4 rounded-xl bg-white border border-outline-variant/40 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary text-2xl">account_balance</span>
                          <div>
                            <span className="text-xs uppercase font-bold text-[#0B4634]">Tier 2 · Grama Panchayat</span>
                            <h4 className="text-title-lg font-title-lg font-bold text-on-surface">Kadakampally GP (തിരുവനന്തപുരം ജില്ല)</h4>
                            <p className="text-body-sm text-outline">21 Wards Constituted · GP Code: KL-TVM-024</p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs bg-[#ECFDF5] text-[#0B4634] font-semibold border border-[#A7F3D0]">Jurisdiction Verified</span>
                      </div>

                      <div className="pl-8 border-l-2 border-dashed border-outline-variant/60 ml-4 space-y-4">
                        <div className="p-4 rounded-xl bg-white border-2 border-primary/30 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-2xl">signpost</span>
                            <div>
                              <span className="text-xs uppercase font-bold text-[#0B4634]">Tier 3 · Electoral Ward</span>
                              <h4 className="text-title-lg font-title-lg font-bold text-primary">Ward 7 - Chakkai (ചാക്ക)</h4>
                              <p className="text-body-sm text-outline">Area: 3.42 sq km · Geofenced Bound Verified</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-xs bg-surface-container font-mono font-medium">Ward Sabha #4 Scheduled</span>
                          </div>
                        </div>

                        <div className="pl-8 border-l-2 border-dashed border-outline-variant/60 ml-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[#0B4634]">how_to_reg</span>
                              <span className="text-xs font-bold uppercase text-[#0B4634]">Authorized Representative</span>
                            </div>
                            <h5 className="text-title-md font-title-md font-bold text-on-surface">Smt. Lathika Kumari</h5>
                            <p className="text-xs text-outline font-mono">UID: REP-KL-TVM-W07-001</p>
                          </div>

                          <div className="p-4 rounded-xl bg-surface-bright border border-outline-variant/40 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-outline">groups</span>
                              <span className="text-xs font-bold uppercase text-outline">Citizen Base</span>
                            </div>
                            <h5 className="text-title-md font-title-md font-bold text-on-surface">142 Registered Residents</h5>
                            <p className="text-xs text-outline font-mono">100% Ward Boundary Validation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AUDIT LOG */}
                <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-sm space-y-4" id="auditLog">
                  <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">security</span>
                      <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Civic Platform Audit Log</h3>
                    </div>
                    <span className="text-xs font-mono text-outline">Live Supabase Sync</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-body-sm font-mono">
                      <thead className="bg-surface-container-low text-outline text-xs border-b border-outline-variant/30">
                        <tr>
                          <th className="p-2.5">Timestamp (IST)</th>
                          <th className="p-2.5">Actor</th>
                          <th className="p-2.5">Action</th>
                          <th className="p-2.5">Entity</th>
                          <th className="p-2.5">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20 text-xs">
                        <tr>
                          <td className="p-2.5 text-outline">2026-09-12 14:32:01</td>
                          <td className="p-2.5 font-bold text-primary">Ward Sahayakan AI</td>
                          <td className="p-2.5">AUTONOMOUS_TRIAGE</td>
                          <td className="p-2.5">Ticket #EW-1042</td>
                          <td className="p-2.5"><span className="text-emerald-700 font-bold">SUCCESS (DISPATCHED)</span></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-outline">2026-09-12 11:15:40</td>
                          <td className="p-2.5 font-bold text-on-surface">Rep. Lathika Kumari</td>
                          <td className="p-2.5">STATUS_UPDATE_PROGRESS</td>
                          <td className="p-2.5">Ticket #EW-1039</td>
                          <td className="p-2.5"><span className="text-blue-700 font-bold">COMMITTED</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* GLOBAL TRANSPARENCY FOOTER */}
            <footer className="mt-16 pt-8 pb-12 border-t border-outline-variant/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                <span>Ente Ward (എന്റെ വാർഡ്)</span>
              </div>
              <p className="text-body-sm font-body-sm text-outline max-w-xl mx-auto">
                Ente Ward is a private civic technology platform for local governance and citizen collaboration. Not affiliated with any official government department.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-outline pt-2">
                <span>Kadakampally GP · Ward 7</span>
                <span>•</span>
                <span>Supabase PostgreSQL Active</span>
                <span>•</span>
                <button
                  onClick={() => { setActiveTab('auth_portal'); setLoginView('login_admin'); }}
                  className="hover:text-primary underline"
                >
                  Admin Portal
                </button>
              </div>
            </footer>
          </main>
        </div>
      )}

      {/* =======================================================
           MODAL 1: 5-STEP CIVIC REPORT SUBMISSION
           ======================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant/30 bg-surface-bright flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-primary">Civic Grievance Redressal</span>
                <h3 className="text-headline-md font-headline-md font-bold text-on-surface">File New Issue / പുതിയ പരാതി</h3>
              </div>
              <button className="p-1 rounded-lg text-outline hover:text-on-surface" onClick={() => setIsReportModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Step Indicator Dots */}
            <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${reportStep === 1 ? 'bg-primary-container text-white' : reportStep > 1 ? 'bg-[#ECFDF5] text-[#0B4634]' : 'bg-surface-container text-outline'}`}>
                  {reportStep > 1 ? '✓' : '1'}
                </span>
                <span className="text-primary">Describe</span>
              </div>
              <div className="h-0.5 w-8 bg-outline-variant/40"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${reportStep === 2 ? 'bg-primary-container text-white' : reportStep > 2 ? 'bg-[#ECFDF5] text-[#0B4634]' : 'bg-surface-container text-outline'}`}>
                  {reportStep > 2 ? '✓' : '2'}
                </span>
                <span className="text-outline">Category</span>
              </div>
              <div className="h-0.5 w-8 bg-outline-variant/40"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${reportStep === 3 ? 'bg-primary-container text-white' : reportStep > 3 ? 'bg-[#ECFDF5] text-[#0B4634]' : 'bg-surface-container text-outline'}`}>
                  {reportStep > 3 ? '✓' : '3'}
                </span>
                <span className="text-outline">Location</span>
              </div>
              <div className="h-0.5 w-8 bg-outline-variant/40"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${reportStep === 4 ? 'bg-primary-container text-white' : reportStep > 4 ? 'bg-[#ECFDF5] text-[#0B4634]' : 'bg-surface-container text-outline'}`}>
                  {reportStep > 4 ? '✓' : '4'}
                </span>
                <span className="text-outline">Evidence</span>
              </div>
              <div className="h-0.5 w-8 bg-outline-variant/40"></div>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${reportStep === 5 ? 'bg-primary-container text-white' : 'bg-surface-container text-outline'}`}>
                  5
                </span>
                <span className="text-outline">AI Review</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {reportStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-title-md font-bold text-on-surface mb-1">Issue Title (Malayalam or English)</label>
                    <input
                      className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g. Broken water pipe near Temple junction"
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="block text-title-md font-bold text-on-surface mb-1">Detailed Description / വിശദാംശങ്ങൾ</label>
                    <textarea
                      className="w-full p-4 rounded-xl border border-outline-variant/60 focus:ring-1 focus:ring-primary focus:border-primary"
                      rows={4}
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {reportStep === 2 && (
                <div className="space-y-3">
                  <h4 className="text-title-md font-bold text-on-surface">Select Ward Department Category</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {['Roads & Bridges', 'Drinking Water', 'Streetlights & Power', 'Waste Management', 'Drainage & Canals', 'Public Health & PHC'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setReportCategory(cat)}
                        className={`cat-pill p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 text-left ${reportCategory === cat ? 'border-2 border-primary bg-[#ECFDF5] text-primary' : 'border-outline-variant/40 bg-white hover:bg-surface-container text-on-surface'}`}
                      >
                        <span className="material-symbols-outlined text-base">alt_route</span>
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {reportStep === 3 && (
                <div className="space-y-3">
                  <h4 className="text-title-md font-bold text-on-surface">Location & Ward 7 Verification</h4>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-outline font-medium">Auto-detected Geotag:</span>
                      <span className="font-mono text-primary font-bold">8.5085° N, 76.9214° E</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-outline-variant/40 flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-emerald-600">verified</span>
                      <span className="text-on-surface">Point falls inside <strong>Kadakampally GP · Ward 7 (Chakkai)</strong>.</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline mb-1">Local Landmark / House Identifier</label>
                      <input
                        className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/40 bg-white"
                        type="text"
                        value={reportLocation}
                        onChange={(e) => setReportLocation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {reportStep === 4 && (
                <div className="space-y-3">
                  <h4 className="text-title-md font-bold text-on-surface">Photographic Evidence / ഫോട്ടോ തെളിവ്</h4>
                  <div className="relative rounded-xl overflow-hidden border border-outline-variant/40 h-48 bg-surface-container-low">
                    <img
                      className="w-full h-full object-cover"
                      alt="Potholes Evidence"
                      src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-[11px] font-mono flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-xs">photo_camera</span>
                      <span>IMG_20260912_LP_School.jpg</span>
                    </div>
                  </div>
                </div>
              )}

              {reportStep === 5 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0B4634]">auto_awesome</span>
                      <h4 className="text-title-md font-bold text-[#0B4634]">Ward Sahayakan Pre-Submission Assessment</h4>
                    </div>
                    <div className="space-y-2 text-xs text-[#065F46]">
                      <div className="flex items-center justify-between">
                        <span>Category:</span>
                        <span className="font-bold">{reportCategory}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Routing:</span>
                        <span className="font-bold">Ward 7 Representative Desk</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-outline-variant/30 bg-surface-bright flex items-center justify-between">
              {reportStep > 1 ? (
                <button className="px-4 py-2 rounded-xl text-on-surface hover:bg-surface-container text-body-sm font-medium" onClick={() => setReportStep(reportStep - 1)}>
                  Back
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button className="px-4 py-2 rounded-xl text-outline hover:text-on-surface text-body-sm" onClick={() => setIsReportModalOpen(false)}>
                  Cancel
                </button>
                {reportStep < 5 ? (
                  <button className="px-5 py-2 rounded-xl bg-primary-container hover:bg-[#125B42] text-white text-body-sm font-semibold" onClick={() => setReportStep(reportStep + 1)}>
                    Next →
                  </button>
                ) : (
                  <button className="px-5 py-2 rounded-xl bg-primary-container hover:bg-[#125B42] text-white text-body-sm font-semibold" onClick={handleSubmitReportModal}>
                    Submit to Ward 7 Desk ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
           MODAL 2: ISSUE DETAIL & TIMELINE
           ======================================================= */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-2xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-outline-variant/30 bg-surface-bright flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-primary-container text-white font-mono text-xs font-bold">#{selectedIssueId}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Live Ticket</span>
              </div>
              <button className="p-1 rounded-lg text-outline hover:text-on-surface" onClick={() => setIsDetailModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              <div>
                <h3 className="text-headline-md font-headline-md font-bold text-on-surface">
                  {issuesList.find(i => i.issueNumber === selectedIssueId)?.titleMl || 'Road deterioration near Govt LP School'}
                </h3>
                <p className="text-body-sm text-outline mt-1">Ward 7 · Chakkai · Kadakampally Grama Panchayat</p>
              </div>

              {/* Vertical Timeline */}
              <div>
                <h4 className="text-title-md font-bold text-on-surface mb-4">Official Resolution Timeline</h4>
                <div className="space-y-4 pl-4 border-l-2 border-primary/40 ml-2">
                  {selectedIssueTimeline.map((t, idx) => (
                    <div key={idx} className="relative pl-6">
                      <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-white"></span>
                      <span className="text-[11px] font-mono text-outline">{new Date(t.createdAt || Date.now()).toLocaleTimeString()}</span>
                      <h5 className="text-title-md font-semibold text-on-surface">{t.titleMl}</h5>
                      <p className="text-body-sm text-on-surface-variant">{t.remarksMl}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback Rating */}
              <div className="p-5 rounded-xl bg-surface-bright border border-outline-variant/40 space-y-3">
                <h4 className="text-title-md font-bold text-on-surface">Resident Feedback & Verification</h4>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`text-2xl ${ratedStars >= star ? 'text-amber-500' : 'text-slate-300'}`}
                      onClick={() => setRatedStars(star)}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: ratedStars >= star ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                      </span>
                    </button>
                  ))}
                  <span className="text-xs text-primary font-semibold ml-2">
                    {ratedStars > 0 ? `Rated ${ratedStars} / 5 Stars` : 'Click to rate resolution'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
           MODAL 3: ADD RESIDENT MODAL
           ======================================================= */}
      {isAddResidentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant/30 bg-surface-bright flex items-center justify-between">
              <div>
                <h3 className="text-title-lg font-title-lg font-bold text-on-surface">+ Add Ward Resident</h3>
                <p className="text-xs text-outline">Strictly locked to Kadakampally Ward 7 jurisdiction.</p>
              </div>
              <button className="text-outline hover:text-on-surface" onClick={() => setIsAddResidentModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              setIsAddResidentModalOpen(false);
              alert('Resident enrolled to Ward 7 roster.');
            }}>
              <div>
                <label className="block text-body-sm font-bold text-on-surface mb-1">Resident Full Name</label>
                <input className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 text-body-sm" placeholder="e.g. Radhakrishnan Nair" required type="text" />
              </div>
              <div>
                <label className="block text-body-sm font-bold text-on-surface mb-1">House Number & Street / വീട്ടുപേര്</label>
                <input className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 text-body-sm" placeholder="7/620, Near Devi Temple" required type="text" />
              </div>
              <div>
                <label className="block text-body-sm font-bold text-on-surface mb-1">Mobile Number for SMS Notifications</label>
                <input className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 text-body-sm font-mono" placeholder="+91 98470 00000" required type="tel" />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button className="px-4 py-2 text-body-sm text-outline" onClick={() => setIsAddResidentModalOpen(false)} type="button">Cancel</button>
                <button className="px-5 py-2 rounded-xl bg-primary-container text-white text-body-sm font-semibold hover:bg-[#125B42]" type="submit">Enroll Resident</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
           MODAL 4: CREATE REPRESENTATIVE MODAL
           ======================================================= */}
      {isCreateRepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-xl border border-outline-variant/40 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-outline-variant/30 bg-surface-bright flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-red-700">Administrator Provisioning Flow</span>
                <h3 className="text-title-lg font-title-lg font-bold text-on-surface">+ Authorize Representative</h3>
              </div>
              <button className="text-outline hover:text-on-surface" onClick={() => setIsCreateRepModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              setIsCreateRepModalOpen(false);
              alert('Representative credential provisioned and dispatched to ward official.');
            }}>
              <div>
                <label className="block text-body-sm font-bold text-on-surface mb-1">Representative Full Name</label>
                <input className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 text-body-sm" required type="text" defaultValue="Smt. Lathika Kumari" />
              </div>
              <div>
                <label className="block text-body-sm font-bold text-on-surface mb-1">State Election Commission Gazette Ref / ID</label>
                <input className="w-full px-3 py-2 rounded-lg border border-outline-variant/60 text-body-sm font-mono" required type="text" defaultValue="SEC-KL-2020-W7-9821" />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button className="px-4 py-2 text-body-sm text-outline" onClick={() => setIsCreateRepModalOpen(false)} type="button">Cancel</button>
                <button className="px-5 py-2 rounded-xl bg-primary-container text-white text-body-sm font-semibold hover:bg-[#125B42]" type="submit">Provision Credential Key</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
