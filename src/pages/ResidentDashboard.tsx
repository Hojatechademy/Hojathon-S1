import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { Issue, WardContact, GovernmentContact, GovernmentContactLevel } from '../types/database';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { WardSahayakanComposer } from '../components/agent/WardSahayakanComposer';
import { IssueFeed } from '../components/issues/IssueFeed';
import { IssueDetailModal } from '../components/issues/IssueDetailModal';
import { NewIssueModal } from '../components/issues/NewIssueModal';
import { issueService } from '../services/issueService';
import { contactService } from '../services/contactService';

interface ResidentDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'civic' | 'announcements' | 'schemes' | 'contacts'>('civic');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Ward Contacts (Source B: My Ward Contacts only)
  const [wardContacts, setWardContacts] = useState<WardContact[]>([]);
  const [loadingWardContacts, setLoadingWardContacts] = useState(false);

  // Global Government Directory (Source A: Common Kerala Government Contacts)
  const [govContacts, setGovContacts] = useState<GovernmentContact[]>([]);
  const [govLevelFilter, setGovLevelFilter] = useState<GovernmentContactLevel | 'all'>('all');
  const [govSearch, setGovSearch] = useState('');
  const [loadingGov, setLoadingGov] = useState(false);

  const loadIssues = async () => {
    const list = await issueService.getIssues(user.wardId);
    setIssues(list);
  };

  const loadWardContacts = async () => {
    setLoadingWardContacts(true);
    const list = await contactService.getWardContacts(user.wardId);
    setWardContacts(list);
    setLoadingWardContacts(false);
  };

  const loadGovContacts = async () => {
    setLoadingGov(true);
    const list = await contactService.getGovernmentContacts({
      level: govLevelFilter,
      search: govSearch
    });
    setGovContacts(list);
    setLoadingGov(false);
  };

  useEffect(() => {
    loadIssues();
    loadWardContacts();
    loadGovContacts();
  }, [user.wardId]);

  useEffect(() => {
    if (activeTab === 'contacts') {
      loadGovContacts();
    }
  }, [govLevelFilter, govSearch, activeTab]);

  const handleIssueCreated = (newIssue: Issue) => {
    setIssues(prev => [newIssue, ...prev]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>
      <Navbar
        user={user}
        onSignOut={onSignOut}
      />

      <main className="container animate-fadeIn" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {/* Civic Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #002e20 0%, #0b4634 60%, #125b42 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 30px -6px rgba(0, 46, 32, 0.3)'
        }}>
          <div style={{ maxWidth: '800px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '0.3rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '1rem',
              backdropFilter: 'blur(8px)'
            }}>
              <span className="material-symbols-outlined text-xs">location_on</span>
              <span>{user.localBodyName} · {user.wardNameMl}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.5rem' }}>
              Tell your ward what needs attention.
            </h1>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '0.85rem' }}>
              നിങ്ങളുടെ വാർഡിന് എന്താണ് ശ്രദ്ധിക്കേണ്ടതെന്ന് പറയുക.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#d1fae5', lineHeight: 1.6, maxWidth: '650px' }}>
              പൊതുവഴികൾ, കുടിവെള്ളം, തെരുവ് വിളക്കുകൾ, ശുചിത്വം എന്നിവയുമായി ബന്ധപ്പെട്ട പ്രശ്നങ്ങൾ വാർഡ് സഹായിയോട് നേരിട്ട് പറയൂ.
            </p>
          </div>
        </div>

        {/* Top View Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.75rem',
          background: '#ffffff',
          padding: '0.4rem',
          borderRadius: '14px',
          border: '1px solid var(--outline-light)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setActiveTab('civic')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'civic' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'civic' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">record_voice_over</span>
            <span>Civic Reports & AI / വാർഡ് സഹായി</span>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'announcements' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'announcements' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">campaign</span>
            <span>Announcements / അറിയിപ്പുകൾ</span>
          </button>

          <button
            onClick={() => setActiveTab('schemes')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'schemes' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'schemes' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">medical_services</span>
            <span>Health & Schemes / സേവനങ്ങൾ</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'contacts' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'contacts' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">contacts</span>
            <span>Public Contacts / പൊതു കോൺടാക്റ്റുകൾ</span>
          </button>
        </div>

        {/* VIEW 1: CIVIC COMPOSER & FEED */}
        {activeTab === 'civic' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
            {/* Left: Ward Sahayakan AI Composer */}
            <div>
              <WardSahayakanComposer
                user={user}
                onIssueCreated={handleIssueCreated}
              />
            </div>

            {/* Right: Active Issue Feed */}
            <div>
              <IssueFeed
                issues={issues}
                onSelectIssue={setSelectedIssue}
                onOpenNewReportModal={() => setIsNewModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: ANNOUNCEMENTS & WARD NOTICES */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="badge badge-mint" style={{ marginBottom: '0.35rem' }}>
                <span className="material-symbols-outlined text-xs">campaign</span>
                <span>വാർഡ് നോട്ടീസ് ബോർഡ്</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                {user.localBodyName} · {user.wardNameMl} Announcements
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
                Official notices, Grama Sabha schedules, and alerts for Ward {user.wardNumber}.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div className="civic-card" style={{ padding: '1.5rem', background: '#ffffff', borderLeft: '4px solid var(--primary-container)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="badge badge-mint">വാർഡ് സഭ</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Official Schedule</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                  പ്രതിമാസ വാർഡ് വികസന സഭ (Monthly Grama Sabha)
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  എല്ലാ മാസവും രണ്ടാമത്തെ ശനിയാഴ്ച ഉച്ചക്ക് 2:00 മണിക്ക് പഞ്ചായത്ത് കമ്മ്യൂണിറ്റി ഹാളിൽ വെച്ച് വാർഡ് സഭ ചേരുന്നതാണ്.
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                  സ്ഥലം: {user.localBodyName} വാർഡ് കമ്മ്യൂണിറ്റി ഹാൾ
                </div>
              </div>

              <div className="civic-card" style={{ padding: '1.5rem', background: '#ffffff', borderLeft: '4px solid #059669' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span className="badge" style={{ background: '#ecfdf5', color: '#065f46' }}>ഹരിതകർമ്മസേന</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>മാലിന്യ ശേഖരണം</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.5rem' }}>
                  അജൈവ മാലിന്യ ശേഖരണ കലണ്ടർ
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  ഓരോ മാസവും ആദ്യത്തെയും മൂന്നാമത്തെയും ചൊവ്വാഴ്ച വീടുകളിൽ നിന്ന് പ്ലാസ്റ്റിക് മാലിന്യങ്ങൾ ഹരിതകർമ്മസേന ശേഖരിക്കും.
                </p>
                <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
                  വാർഡ് {user.wardNumber} ഹരിതകർമ്മസേന കൺവീനർ വഴി ഏകോപിപ്പിക്കുന്നു
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: HEALTH & GOVERNMENT SERVICES */}
        {activeTab === 'schemes' && (
          <div className="space-y-6">
            <div style={{ marginBottom: '1.25rem' }}>
              <div className="badge badge-mint" style={{ marginBottom: '0.35rem' }}>
                <span className="material-symbols-outlined text-xs">medical_services</span>
                <span>ആരോഗ്യ സേവനങ്ങളും പദ്ധതികളും</span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                Government Schemes & Primary Health Facilities
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--outline)' }}>
                Verified Kerala public welfare schemes and ward health infrastructure.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div className="civic-card" style={{ padding: '1.5rem', background: '#ffffff' }}>
                <span className="badge badge-outline" style={{ marginBottom: '0.5rem' }}>പാർപ്പിട പദ്ധതി</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
                  LIFE Mission (ലൈഫ് മിഷൻ)
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--outline)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  ഭൂരഹിത-ഭവനരഹിതർക്ക് സുരക്ഷിതമായ പാർപ്പിടം ഉറപ്പാക്കുന്ന സമഗ്ര സംസ്ഥാന പദ്ധതി.
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: '6px' }}>
                  <strong>അർഹത:</strong> വാർഷിക വരുമാന പരിധിയും ഭൂമി ലഭ്യതയും അടിസ്ഥാനമാക്കി.
                </div>
              </div>

              <div className="civic-card" style={{ padding: '1.5rem', background: '#ffffff' }}>
                <span className="badge badge-outline" style={{ marginBottom: '0.5rem' }}>ആരോഗ്യ ഇൻഷുറൻസ്</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
                  Karunya Arogya Suraksha (KASP)
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--outline)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  സാമ്പത്തികമായി പിന്നോക്കം നിൽക്കുന്ന കുടുംബങ്ങൾക്ക് പ്രതിവർഷം 5 ലക്ഷം രൂപയുടെ സൗജന്യ ചികിത്സാ സഹായം.
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--charcoal)', background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: '6px' }}>
                  <strong>അർഹത:</strong> റേഷൻ കാർഡ് മുൻഗണനാ വിഭാഗങ്ങൾ.
                </div>
              </div>

              <div className="civic-card" style={{ padding: '1.5rem', background: '#ffffff' }}>
                <span className="badge badge-mint" style={{ marginBottom: '0.5rem' }}>ആരോഗ്യ കേന്ദ്രം</span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
                  പ്രാഥമിക ആരോഗ്യ കേന്ദ്രം (PHC)
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--outline)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                  കുലുക്കല്ലൂർ ജംഗ്ഷൻ · സമയം: രാവിലെ 9:00 മുതൽ വൈകുന്നേരം 4:00 വരെ.
                </p>
                <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>
                  ഫോൺ: 0466-2277320 (അടിയന്തര സേവനങ്ങൾക്ക് ലഭ്യമാണ്)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: PUBLIC CONTACTS (SOURCE A & SOURCE B) */}
        {activeTab === 'contacts' && (
          <div className="space-y-8">
            {/* SOURCE B: MY WARD CONTACTS (Authorized for this resident's ward only) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div className="badge badge-teal" style={{ marginBottom: '0.25rem' }}>
                    <span className="material-symbols-outlined text-xs">local_police</span>
                    <span>വാർഡ് കോൺടാക്റ്റുകൾ (My Ward Contacts)</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                    {user.localBodyName} · {user.wardNameMl} Contacts
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
                    Published by your elected ward representative for residents of Ward {user.wardNumber}.
                  </p>
                </div>
              </div>

              {loadingWardContacts ? (
                <div className="civic-card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <span className="material-symbols-outlined text-outline animate-spin">progress_activity</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '0.5rem' }}>Loading ward contacts...</p>
                </div>
              ) : wardContacts.length === 0 ? (
                <div className="civic-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#ffffff', borderRadius: '16px' }}>
                  <span className="material-symbols-outlined text-outline" style={{ fontSize: '2rem', color: 'var(--outline)' }}>
                    contact_phone
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--charcoal)', marginTop: '0.5rem' }}>
                    No ward-specific contacts published yet
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--outline)', maxWidth: '380px', margin: '0 auto' }}>
                    Your ward representative has not yet added custom public service contacts for Ward {user.wardNumber}.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {wardContacts.map((contact) => (
                    <div key={contact.id} className="civic-card" style={{ padding: '1.25rem', background: '#ffffff', borderLeft: '4px solid var(--secondary)' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                        {contact.name}
                      </h4>
                      <span className="badge badge-outline" style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                        {contact.designation}
                      </span>

                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 700 }}>
                          <span className="material-symbols-outlined text-sm">call</span>
                          <a href={`tel:${contact.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{contact.phone}</a>
                        </div>
                        {contact.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--outline)', fontSize: '0.78rem' }}>
                            <span className="material-symbols-outlined text-sm">mail</span>
                            <a href={`mailto:${contact.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{contact.email}</a>
                          </div>
                        )}
                        {contact.description && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--outline)', margin: '0.25rem 0 0 0' }}>
                            {contact.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SOURCE A: COMMON KERALA GOVERNMENT DIRECTORY (Global, readable by all residents) */}
            <div style={{ borderTop: '1px solid var(--outline-light)', paddingTop: '2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div className="badge badge-outline" style={{ marginBottom: '0.25rem' }}>
                  <span className="material-symbols-outlined text-xs">account_balance</span>
                  <span>സർക്കാർ ഡയറക്ടറി (Kerala Government Directory)</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  Statewide Official Public Contacts
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
                  Official 2026 directory of Kerala Council of Ministers, District Collectors, Senior Government Officials & Key Secretariat Contacts.
                </p>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  fontSize: '0.73rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <span>Source: Kerala Government Official Directory. Please verify before making urgent official communications.</span>
                </div>
              </div>

              {/* Filter Buttons & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {(['all', 'minister', 'district_collector', 'senior_official', 'secretariat'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setGovLevelFilter(level)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid var(--outline-light)',
                        cursor: 'pointer',
                        background: govLevelFilter === level ? 'var(--primary-dark)' : '#ffffff',
                        color: govLevelFilter === level ? '#ffffff' : 'var(--charcoal)'
                      }}
                    >
                      {level === 'all' && 'All (46)'}
                      {level === 'minister' && 'Ministers (21)'}
                      {level === 'district_collector' && 'District Collectors (14)'}
                      {level === 'senior_official' && 'Senior Officials (8)'}
                      {level === 'secretariat' && 'Secretariat (3)'}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <input
                    type="text"
                    placeholder="Search by name, portfolio, district, or phone..."
                    value={govSearch}
                    onChange={(e) => setGovSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      border: '1px solid var(--outline-light)',
                      background: '#ffffff'
                    }}
                  />
                </div>
              </div>

              {loadingGov ? (
                <div className="civic-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <span className="material-symbols-outlined text-outline animate-spin">progress_activity</span>
                  <p style={{ fontSize: '0.8rem', color: 'var(--outline)', marginTop: '0.5rem' }}>Loading government contacts...</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {govContacts.map((c) => (
                    <div key={c.id} className="civic-card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                            {c.name}
                          </h4>
                          <span className="badge badge-outline" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                            {c.level.replace('_', ' ')}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.35rem' }}>
                          {c.designation} {c.district ? `(${c.district})` : ''}
                        </div>

                        {c.department && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
                            {c.department}
                          </p>
                        )}
                      </div>

                      <div style={{ borderTop: '1px solid var(--outline-light)', paddingTop: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <span className="material-symbols-outlined text-sm" style={{ color: c.phone ? '#047857' : '#9ca3af' }}>call</span>
                          {c.phone ? (
                            <a href={`tel:${c.phone}`} style={{ color: '#047857', textDecoration: 'none' }}>{c.phone}</a>
                          ) : (
                            <span style={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.75rem' }}>Not listed (Preserved from PDF)</span>
                          )}
                        </div>
                        {c.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.2rem' }}>
                            <span className="material-symbols-outlined text-sm">mail</span>
                            <a href={`mailto:${c.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.email}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />

      <NewIssueModal
        user={user}
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onIssueCreated={handleIssueCreated}
      />

      <Footer onOpenAdminLogin={() => {}} />
    </div>
  );
};

