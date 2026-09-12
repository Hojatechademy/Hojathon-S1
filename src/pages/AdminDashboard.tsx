import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { wardService, RepresentativeRecord } from '../services/wardService';
import {
  locationService,
  District,
  GramaPanchayat,
  LocationWard
} from '../services/locationService';
import { Ward } from '../types/database';

interface AdminDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'representatives' | 'account'>('representatives');
  const [representatives, setRepresentatives] = useState<RepresentativeRecord[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddRepModalOpen, setIsAddRepModalOpen] = useState(false);
  const [isAddWardModalOpen, setIsAddWardModalOpen] = useState(false);

  // Location Master Data State for Add Representative Flow
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('dist-pkd');
  const [gramPanchayats, setGramPanchayats] = useState<GramaPanchayat[]>([]);
  const [selectedPanchayatId, setSelectedPanchayatId] = useState<string>('');
  const [availableWards, setAvailableWards] = useState<LocationWard[]>([]);
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [wardAvailabilityStatus, setWardAvailabilityStatus] = useState<{
    hasNoMasterData: boolean;
    allAssigned: boolean;
    allWardsCount: number;
    assignedWardsCount: number;
  }>({ hasNoMasterData: false, allAssigned: false, allWardsCount: 0, assignedWardsCount: 0 });

  // Dynamic Loading States
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingPanchayats, setLoadingPanchayats] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // Add Representative Form Personal Fields
  const [repName, setRepName] = useState('');
  const [repUsername, setRepUsername] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repPassword, setRepPassword] = useState('');
  const [isSubmittingRep, setIsSubmittingRep] = useState(false);
  const [repFeedback, setRepFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Add Ward Form
  const [wardNumber, setWardNumber] = useState<number>(1);
  const [wardNameMl, setWardNameMl] = useState('');
  const [wardNameEn, setWardNameEn] = useState('');
  const [localBodyName, setLocalBodyName] = useState('കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത്');
  const [district, setDistrict] = useState('തിരുവനന്തപുരം');
  const [isSubmittingWard, setIsSubmittingWard] = useState(false);
  const [wardFeedback, setWardFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    setLoadingDistricts(true);
    const [fetchedWards, fetchedReps, fetchedDistricts] = await Promise.all([
      wardService.getAllWards(),
      wardService.getRepresentatives(),
      locationService.getDistricts()
    ]);
    setWards(fetchedWards);
    setRepresentatives(fetchedReps);
    setDistricts(fetchedDistricts);
    if (fetchedDistricts.length > 0 && !fetchedDistricts.some(d => d.id === selectedDistrictId)) {
      setSelectedDistrictId(fetchedDistricts[0].id);
    }
    setLoadingDistricts(false);
    setIsLoading(false);
  };

  const handleToggleRepStatus = async (rep: RepresentativeRecord) => {
    setIsTogglingStatus(rep.id);
    if (rep.status === 'Active') {
      const confirmed = window.confirm(
        `Deactivate representative ${rep.fullName}? Their assigned ward (Ward ${rep.wardNumber}) will become available again for new assignments.`
      );
      if (!confirmed) {
        setIsTogglingStatus(null);
        return;
      }
      await wardService.deactivateRepresentative(rep.id);
    } else {
      await wardService.reactivateRepresentative(rep.id);
    }

    await loadData();

    // Immediately refresh available wards for the currently viewed panchayat so availability reflects right away
    if (selectedPanchayatId) {
      const refreshedWards = await locationService.getAvailableWards(selectedPanchayatId);
      setAvailableWards(refreshedWards.availableWards);
      setWardAvailabilityStatus({
        hasNoMasterData: refreshedWards.hasNoMasterData,
        allAssigned: refreshedWards.allAssigned,
        allWardsCount: refreshedWards.allWardsCount,
        assignedWardsCount: refreshedWards.assignedWardsCount
      });
      if (refreshedWards.availableWards.length > 0) {
        setSelectedWardId(refreshedWards.availableWards[0].id);
      }
    }
    setIsTogglingStatus(null);
  };

  useEffect(() => {
    loadData();
  }, []);

  // When Add Representative modal opens or district changes: load Grama Panchayats
  useEffect(() => {
    if (!isAddRepModalOpen) return;

    let isMounted = true;
    const fetchPanchayats = async () => {
      setLoadingPanchayats(true);
      setSelectedPanchayatId('');
      setSelectedWardId('');
      setAvailableWards([]);

      const list = await locationService.getGramaPanchayats(selectedDistrictId);
      if (isMounted) {
        setGramPanchayats(list);
        setLoadingPanchayats(false);
        if (list.length > 0) {
          setSelectedPanchayatId(list[0].id);
        }
      }
    };

    fetchPanchayats();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrictId, isAddRepModalOpen]);

  // When Grama Panchayat changes: load available wards (filtering out assigned ones)
  useEffect(() => {
    if (!selectedPanchayatId) {
      setAvailableWards([]);
      setSelectedWardId('');
      return;
    }

    let isMounted = true;
    const fetchWards = async () => {
      setLoadingWards(true);
      setSelectedWardId('');

      const result = await locationService.getAvailableWards(selectedPanchayatId);
      if (isMounted) {
        setAvailableWards(result.availableWards);
        setWardAvailabilityStatus({
          hasNoMasterData: result.hasNoMasterData,
          allAssigned: result.allAssigned,
          allWardsCount: result.allWardsCount,
          assignedWardsCount: result.assignedWardsCount
        });
        setLoadingWards(false);
        if (result.availableWards.length > 0) {
          setSelectedWardId(result.availableWards[0].id);
        }
      }
    };

    fetchWards();
    return () => {
      isMounted = false;
    };
  }, [selectedPanchayatId]);

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardNameMl.trim()) {
      setWardFeedback({ error: 'ദയവായി വാർഡിന്റെ പേര് മലയാളത്തിൽ നൽകുക.' });
      return;
    }
    setIsSubmittingWard(true);
    setWardFeedback(null);

    const res = await wardService.createWard({
      wardNumber,
      nameMl: wardNameMl.trim(),
      nameEn: wardNameEn.trim() || `Ward ${wardNumber}`,
      localBodyName: localBodyName.trim(),
      district: district.trim()
    });

    setIsSubmittingWard(false);
    if (res.success && res.ward) {
      setWardFeedback({ success: res.message });
      setWardNameMl('');
      setWardNameEn('');
      setWardNumber(prev => prev + 1);
      await loadData();
      setTimeout(() => {
        setIsAddWardModalOpen(false);
        setWardFeedback(null);
      }, 1200);
    } else {
      setWardFeedback({ error: res.message || 'വാർഡ് ചേർക്കാൻ കഴിഞ്ഞില്ല.' });
    }
  };

  const handleCreateRepresentative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim() || !repUsername.trim()) {
      setRepFeedback({ error: 'ദയവായി പ്രതിനിധിയുടെ പേരും യൂസർനെയിമും നൽകുക.' });
      return;
    }

    if (!selectedWardId) {
      setRepFeedback({ error: 'ദയവായി അനുവദനീയമായ ഒരു വാർഡ് തിരഞ്ഞെടുക്കുക.' });
      return;
    }

    // 1. Server/Service-side Hierarchy & Duplicate Assignment Validation
    const validation = await locationService.validateHierarchy(
      selectedDistrictId,
      selectedPanchayatId,
      selectedWardId
    );

    if (!validation.isValid) {
      setRepFeedback({ error: validation.error || 'സ്ഥാനക്രമം അസാധുവാണ്.' });
      return;
    }

    const selectedWard = availableWards.find(w => w.id === selectedWardId);
    const selectedPanchayat = gramPanchayats.find(p => p.id === selectedPanchayatId);
    const selectedDistrict = districts.find(d => d.id === selectedDistrictId);

    if (!selectedWard || !selectedPanchayat) {
      setRepFeedback({ error: 'വാർഡ് അല്ലെങ്കിൽ ഗ്രാമപഞ്ചായത്ത് കണ്ടെത്താനായില്ല.' });
      return;
    }

    setIsSubmittingRep(true);
    setRepFeedback(null);

    const res = await wardService.createRepresentative({
      fullName: repName.trim(),
      username: repUsername.trim().toLowerCase(),
      email: repEmail.trim() || undefined,
      phone: repPhone.trim() || undefined,
      districtId: selectedDistrictId,
      districtName: selectedDistrict?.name || 'Kerala',
      gramPanchayatId: selectedPanchayatId,
      wardId: selectedWard.id,
      wardNumber: selectedWard.wardNumber,
      wardNameMl: selectedWard.name || null,
      localBodyName: selectedWard.localBodyName || selectedPanchayat.nameMl,
      password: repPassword || undefined
    });

    setIsSubmittingRep(false);
    if (res.success && res.representative) {
      setRepFeedback({ success: `പ്രതിനിധി ${res.representative.fullName} വിജയകരമായി ചേർത്തു!` });
      setRepName('');
      setRepUsername('');
      setRepEmail('');
      setRepPhone('');
      setRepPassword('');
      await loadData();

      // Refresh available wards for current panchayat so assigned ward disappears immediately
      const refreshedWards = await locationService.getAvailableWards(selectedPanchayatId);
      setAvailableWards(refreshedWards.availableWards);
      setWardAvailabilityStatus({
        hasNoMasterData: refreshedWards.hasNoMasterData,
        allAssigned: refreshedWards.allAssigned,
        allWardsCount: refreshedWards.allWardsCount,
        assignedWardsCount: refreshedWards.assignedWardsCount
      });
      if (refreshedWards.availableWards.length > 0) {
        setSelectedWardId(refreshedWards.availableWards[0].id);
      } else {
        setSelectedWardId('');
      }

      setTimeout(() => {
        setIsAddRepModalOpen(false);
        setRepFeedback(null);
      }, 1400);
    } else {
      setRepFeedback({ error: res.message || 'പ്രതിനിധിയെ ചേർക്കാൻ സാധിച്ചില്ല.' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-[#1c1917] font-sans">
      {/* Friendly Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-stone-900 tracking-tight text-base">എന്റെ വാർഡ്</span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Admin
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">Portal Administration</p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('representatives')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'representatives'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">badge</span>
              <span>Representatives</span>
              {representatives.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-800 text-white text-[10px] flex items-center justify-center">
                  {representatives.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'account'
                  ? 'bg-white text-emerald-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">account_circle</span>
              <span>Account</span>
            </button>
          </nav>

          {/* Sign Out Button */}
          <button
            onClick={onSignOut}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-red-700 hover:bg-red-50 border border-stone-200 transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome Greeting Banner */}
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👋</span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Good morning / നമസ്കാരം</h1>
            </div>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl leading-relaxed">
              Manage your ward platform, provision ward representatives, and organize local wards using verified Kerala LSGD master data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddWardModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">add_location</span>
              <span>+ Create Ward</span>
            </button>
            <button
              onClick={() => setIsAddRepModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">person_add</span>
              <span>+ Add Representative</span>
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Districts & Wards</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">location_city</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-stone-900">{districts.length} Districts</div>
                <p className="text-xs text-stone-500 mt-1">14 Official Kerala Revenue Districts Active</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Representatives</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">badge</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-stone-900">{representatives.length}</div>
                <p className="text-xs text-stone-500 mt-1">
                  {representatives.length === 0 ? 'No representatives provisioned' : `${representatives.length} active ward representatives`}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Location Master</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">verified</span>
                  </div>
                </div>
                <div className="text-base font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Kerala LSGD Hierarchy
                </div>
                <p className="text-xs text-stone-500 mt-1">Authoritative Grama Panchayat Directory</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <h2 className="text-sm font-bold text-stone-900 mb-3">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setIsAddRepModalOpen(true)}
                  className="p-4 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Add Ward Representative</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Select State → District → Panchayat → Ward to provision an official representative.</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsAddWardModalOpen(true)}
                  className="p-4 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center shrink-0 group-hover:bg-emerald-800 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">add_location</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Create New Ward</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Register a specific Panchayat or Municipal delimitation ward.</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. REPRESENTATIVES TAB */}
        {activeTab === 'representatives' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Ward Representatives</h2>
                <p className="text-xs text-stone-500">
                  {representatives.length} {representatives.length === 1 ? 'Representative' : 'Representatives'} registered
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddWardModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  <span>Wards ({wards.length})</span>
                </button>
                <button
                  onClick={() => setIsAddRepModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>+ Add Representative</span>
                </button>
              </div>
            </div>

            {/* LOADING STATE */}
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 text-xs flex items-center justify-center gap-2 shadow-xs">
                <span className="material-symbols-outlined animate-spin text-lg text-emerald-800">progress_activity</span>
                <span>പ്രതിനിധികളുടെ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നു (Loading representatives)...</span>
              </div>
            ) : representatives.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <span className="material-symbols-outlined text-3xl">badge</span>
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">No representatives yet</h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mb-6">
                  Add your first ward representative to get started. Representatives receive civic complaints and manage local action.
                </p>
                <button
                  onClick={() => setIsAddRepModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  <span>+ Add Representative</span>
                </button>
              </div>
            ) : (
              /* POPULATED STATE: Friendly Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {representatives.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-base flex items-center justify-center shrink-0">
                          {rep.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900 leading-tight">{rep.fullName}</h4>
                          <span className="text-xs text-stone-500 font-medium">{rep.email}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        rep.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border border-stone-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">District:</span>
                        <span className="font-semibold text-stone-800">{rep.districtName || 'Palakkad'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Grama Panchayat:</span>
                        <span className="text-stone-700">{rep.localBodyName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Ward:</span>
                        <span className="font-semibold text-emerald-800">
                          Ward {rep.wardNumber}{rep.wardNameMl && rep.wardNameMl !== `Ward ${rep.wardNumber}` && rep.wardNameMl !== `വാർഡ് ${rep.wardNumber}` ? ` — ${rep.wardNameMl}` : ''}
                        </span>
                      </div>
                      {rep.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-400">Phone:</span>
                          <span className="text-stone-700">{rep.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                        <span>Added:</span>
                        <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action: Deactivate / Reactivate button */}
                    <div className="pt-3 mt-2 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-[11px] text-stone-400">
                        {rep.status === 'Active' ? 'Active Representative' : 'Deactivated (Ward Released)'}
                      </div>
                      {rep.status === 'Active' ? (
                        <button
                          onClick={() => handleToggleRepStatus(rep)}
                          disabled={isTogglingStatus === rep.id}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Deactivate representative and release assigned ward"
                        >
                          <span className="material-symbols-outlined text-sm">person_off</span>
                          <span>{isTogglingStatus === rep.id ? 'Updating...' : 'Deactivate'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleRepStatus(rep)}
                          disabled={isTogglingStatus === rep.id}
                          className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                          title="Reactivate representative"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span>{isTogglingStatus === rep.id ? 'Updating...' : 'Reactivate'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">{user.fullName || 'Platform Administrator'}</h2>
                <p className="text-xs text-stone-500">{user.email}</p>
                <div className="mt-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Administrator (mshibin042@gmail.com)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs text-stone-600">
              <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Role Authority</span>
                <span className="font-semibold text-stone-900">Authorized Platform Administrator</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                <span className="text-stone-500">Security Standard</span>
                <span className="font-semibold text-emerald-700">Supabase Auth (Zero Hardcoded Passwords)</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-stone-500">Jurisdiction</span>
                <span className="font-semibold text-stone-900">All Wards / Kerala (14 Districts)</span>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Sign Out of Portal Administration</span>
            </button>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD REPRESENTATIVE WITH REAL KERALA LOCATION MASTER DATA */}
      {isAddRepModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-fadeIn my-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Add Ward Representative</h3>
                  <p className="text-[11px] text-stone-400">Kerala LSGD Location Master</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddRepModalOpen(false);
                  setRepFeedback(null);
                }}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {repFeedback?.error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{repFeedback.error}</span>
              </div>
            )}

            {repFeedback?.success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{repFeedback.success}</span>
              </div>
            )}

            <form onSubmit={handleCreateRepresentative} className="space-y-3.5">
              {/* STEP 1: STATE */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  1. State / സംസ്ഥാനം
                </label>
                <div className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 font-bold text-emerald-950 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span>Kerala (കേരളം)</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Supported State</span>
                </div>
              </div>

              {/* STEP 2: DISTRICT (Prototype Locations) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    2. District / ജില്ല (Prototype: Palakkad & Ernakulam)
                  </label>
                  {loadingDistricts && (
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <span className="material-symbols-outlined animate-spin text-xs">progress_activity</span>
                      <span>Loading districts...</span>
                    </span>
                  )}
                </div>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-medium"
                >
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.nameMl}) — {d.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* STEP 3: GRAMA PANCHAYAT (Dynamic Query) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    3. Grama Panchayat / ഗ്രാമപഞ്ചായത്ത്
                  </label>
                  {loadingPanchayats && (
                    <span className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined animate-spin text-xs">progress_activity</span>
                      <span>Loading Grama Panchayats...</span>
                    </span>
                  )}
                </div>
                {loadingPanchayats ? (
                  <div className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-400 flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Querying Grama Panchayats for selected district...</span>
                  </div>
                ) : gramPanchayats.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-700">info</span>
                    <span>No Grama Panchayats available.</span>
                  </div>
                ) : (
                  <select
                    value={selectedPanchayatId}
                    onChange={(e) => setSelectedPanchayatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-medium"
                  >
                    {gramPanchayats.map((gp) => (
                      <option key={gp.id} value={gp.id}>
                        {gp.name} ({gp.nameMl})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* STEP 4: WARD NUMBER (Dynamic Query & Active Representative Deduplication) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700">
                    4. Ward / വാർഡ് (Available Wards)
                  </label>
                  {loadingWards && (
                    <span className="text-[11px] text-emerald-800 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined animate-spin text-xs">progress_activity</span>
                      <span>Checking ward availability...</span>
                    </span>
                  )}
                </div>

                {loadingWards ? (
                  <div className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 text-stone-400 flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    <span>Checking unassigned delimitation wards...</span>
                  </div>
                ) : wardAvailabilityStatus.hasNoMasterData ? (
                  <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                      <span className="material-symbols-outlined text-sm text-stone-500">info</span>
                      <span>No ward data available.</span>
                    </div>
                  </div>
                ) : wardAvailabilityStatus.allAssigned ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-amber-700">assignment_turned_in</span>
                    <div>
                      <span className="font-bold">All wards in this Grama Panchayat already have representatives.</span>
                    </div>
                  </div>
                ) : (
                  <select
                    value={selectedWardId}
                    onChange={(e) => setSelectedWardId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white font-medium"
                  >
                    {availableWards.map((w) => (
                      <option key={w.id} value={w.id}>
                        Ward {w.wardNumber}{w.name ? ` — ${w.name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* REPRESENTATIVE DETAILS */}
              <div className="pt-2 border-t border-stone-100 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="e.g. Lathika Kumari"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    value={repUsername}
                    onChange={(e) => setRepUsername(e.target.value)}
                    placeholder="e.g. ward7_rep"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">Letters, numbers, underscores or hyphens (3-30 chars).</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Account Password</label>
                  <input
                    type="password"
                    required
                    value={repPassword}
                    onChange={(e) => setRepPassword(e.target.value)}
                    placeholder="Set representative login password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    placeholder="+91 94470 00000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent"
                  />
                </div>

                <p className="text-[11px] text-stone-400 mt-1">Managed securely through Supabase Auth.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRepModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRep || availableWards.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingRep ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Creating representative...</span>
                    </>
                  ) : (
                    <span>+ Create Representative</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE WARD */}
      {isAddWardModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">add_location</span>
                </div>
                <h3 className="text-base font-bold text-stone-900">Create Official Ward</h3>
              </div>
              <button
                onClick={() => {
                  setIsAddWardModalOpen(false);
                  setWardFeedback(null);
                }}
                className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {wardFeedback?.error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{wardFeedback.error}</span>
              </div>
            )}

            {wardFeedback?.success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{wardFeedback.success}</span>
              </div>
            )}

            <form onSubmit={handleCreateWard} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Ward Number</label>
                  <input
                    type="number"
                    min={1}
                    max={150}
                    required
                    value={wardNumber}
                    onChange={(e) => setWardNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Ward Name (മലയാളം)</label>
                  <input
                    type="text"
                    required
                    value={wardNameMl}
                    onChange={(e) => setWardNameMl(e.target.value)}
                    placeholder="e.g. ചാക്ക (Chacka)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Ward Name (English)</label>
                <input
                  type="text"
                  value={wardNameEn}
                  onChange={(e) => setWardNameEn(e.target.value)}
                  placeholder="e.g. Chacka"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Local Body / Panchayat</label>
                <input
                  type="text"
                  required
                  value={localBodyName}
                  onChange={(e) => setLocalBodyName(e.target.value)}
                  placeholder="e.g. കടകംപള്ളി ഗ്രാമപഞ്ചായത്ത്"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="തിരുവനന്തപുരം"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddWardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWard}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  {isSubmittingWard ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Create Ward</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
