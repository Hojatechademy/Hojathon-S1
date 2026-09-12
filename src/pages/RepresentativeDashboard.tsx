import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';
import { Issue, WardContact, ResidentRecord, GovernmentContact, GovernmentContactLevel } from '../types/database';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ActionHub } from '../components/representative/ActionHub';
import { IssueDetailModal } from '../components/issues/IssueDetailModal';
import { issueService } from '../services/issueService';
import { wardService } from '../services/wardService';
import { contactService } from '../services/contactService';
import { WardSahayakanComposer } from '../components/agent/WardSahayakanComposer';

interface RepresentativeDashboardProps {
  user: UserProfile;
  onSignOut: () => void;
}

export const RepresentativeDashboard: React.FC<RepresentativeDashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'residents' | 'contacts' | 'gov_directory'>('issues');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Residents State
  const [residents, setResidents] = useState<ResidentRecord[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [resName, setResName] = useState('');
  const [resUsername, setResUsername] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resPassword, setResPassword] = useState('');
  const [resFeedback, setResFeedback] = useState<{ success?: string; error?: string } | null>(null);
  const [isSubmittingResident, setIsSubmittingResident] = useState(false);

  // Ward Contacts State
  const [wardContacts, setWardContacts] = useState<WardContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactDesc, setContactDesc] = useState('');
  const [contactFeedback, setContactFeedback] = useState<{ success?: string; error?: string } | null>(null);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  // Global Government Directory State
  const [govContacts, setGovContacts] = useState<GovernmentContact[]>([]);
  const [govLevelFilter, setGovLevelFilter] = useState<GovernmentContactLevel | 'all'>('all');
  const [govSearch, setGovSearch] = useState('');
  const [loadingGov, setLoadingGov] = useState(false);

  // Load issues for the representative's authorized ward
  const loadIssues = async () => {
    const list = await issueService.getIssues(user.wardId);
    setIssues(list);
  };

  // Load residents belonging strictly to the representative's authorized ward
  const loadResidents = async () => {
    setLoadingResidents(true);
    const list = await wardService.getWardResidents(user.wardId);
    setResidents(list);
    setLoadingResidents(false);
  };

  // Load ward contacts belonging strictly to the representative's authorized ward
  const loadWardContacts = async () => {
    setLoadingContacts(true);
    const list = await contactService.getWardContacts(user.wardId);
    setWardContacts(list);
    setLoadingContacts(false);
  };

  // Load Common Kerala Government Directory
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
    loadResidents();
    loadWardContacts();
    loadGovContacts();
  }, [user.wardId]);

  useEffect(() => {
    loadGovContacts();
  }, [govLevelFilter, govSearch]);

  const handleIssueUpdated = (updated: Issue) => {
    setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  // Create Resident Handler
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim() || !resUsername.trim()) {
      setResFeedback({ error: 'Please enter resident full name and username.' });
      return;
    }

    setIsSubmittingResident(true);
    setResFeedback(null);

    // Ward is strictly derived from the authenticated representative's user object
    const result = await wardService.createResident(
      {
        fullName: resName.trim(),
        username: resUsername.trim().toLowerCase(),
        email: resEmail.trim() || undefined,
        password: resPassword.trim() || undefined,
        phone: resPhone.trim() || undefined
      },
      user
    );

    setIsSubmittingResident(false);
    if (result.success) {
      setResFeedback({ success: result.message });
      setResName('');
      setResUsername('');
      setResEmail('');
      setResPhone('');
      setResPassword('');
      await loadResidents();
      setTimeout(() => {
        setIsAddResidentOpen(false);
        setResFeedback(null);
      }, 1200);
    } else {
      setResFeedback({ error: result.message });
    }
  };

  // Create Ward Contact Handler
  const handleAddWardContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactDesignation.trim() || !contactPhone.trim()) {
      setContactFeedback({ error: 'Contact name, designation, and phone number are required.' });
      return;
    }

    setIsSubmittingContact(true);
    setContactFeedback(null);

    // Ward is strictly derived from the authenticated representative's user object
    const result = await contactService.addWardContact(
      {
        name: contactName.trim(),
        designation: contactDesignation.trim(),
        phone: contactPhone.trim(),
        email: contactEmail.trim() || undefined,
        description: contactDesc.trim() || undefined
      },
      user
    );

    setIsSubmittingContact(false);
    if (result.success) {
      setContactFeedback({ success: result.message });
      setContactName('');
      setContactDesignation('');
      setContactPhone('');
      setContactEmail('');
      setContactDesc('');
      await loadWardContacts();
      setTimeout(() => {
        setIsAddContactOpen(false);
        setContactFeedback(null);
      }, 1200);
    } else {
      setContactFeedback({ error: result.message });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Remove this ward contact?')) return;
    await contactService.deleteWardContact(contactId, user);
    await loadWardContacts();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface-bg)' }}>
      <Navbar
        user={user}
        onSignOut={onSignOut}
      />

      <main className="container animate-fadeIn" style={{ flex: 1, padding: '2rem 1.25rem' }}>
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #004d40 0%, #006a63 60%, #00897b 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 30px -6px rgba(0, 106, 99, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="badge badge-teal" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>ഔദ്യോഗിക വാർഡ് പ്രതിനിധി പാനൽ</span>
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {user.fullName}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.95rem', color: '#9bf2e8', fontWeight: 600 }}>
                  {user.district} District
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
                <span style={{ fontSize: '0.95rem', color: '#ffffff' }}>
                  {user.localBodyName}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#e6fffa' }}>അധികാരപരിധി (Authorized Ward):</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fef08a' }}>
                Ward {user.wardNumber}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#ccfbf1' }}>{user.district}</div>
            </div>
          </div>
        </div>

        {/* Representative Dashboard Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.75rem',
          background: '#ffffff',
          padding: '0.4rem',
          borderRadius: '14px',
          border: '1px solid var(--outline-light)',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('issues')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'issues' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'issues' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">assignment</span>
            <span>Issues / പരാതികൾ ({issues.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('residents')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'residents' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'residents' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">group</span>
            <span>Residents / പൗരന്മാർ ({residents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
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
            <span className="material-symbols-outlined text-sm">contact_phone</span>
            <span>Ward Contacts / വാർഡ് കോൺടാക്റ്റുകൾ ({wardContacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gov_directory')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.15s ease',
              background: activeTab === 'gov_directory' ? 'var(--primary-dark)' : 'transparent',
              color: activeTab === 'gov_directory' ? '#ffffff' : 'var(--charcoal)'
            }}
          >
            <span className="material-symbols-outlined text-sm">account_balance</span>
            <span>Kerala Govt Directory / സർക്കാർ ഡയറക്ടറി</span>
          </button>
        </div>

        {/* TAB 1: ISSUES (Action Hub) */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            <WardSahayakanComposer user={user} onIssueCreated={loadIssues} />
            <ActionHub
              user={user}
              issues={issues}
              onSelectIssue={setSelectedIssue}
              onIssueUpdated={handleIssueUpdated}
            />
          </div>
        )}

        {/* TAB 2: RESIDENTS MANAGEMENT */}
        {activeTab === 'residents' && (
          <div className="space-y-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  വാർഡ് പൗരന്മാർ (Ward {user.wardNumber} Residents)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
                  Manage residents registered for {user.localBodyName} · Ward {user.wardNumber}.
                </p>
              </div>
              <button
                onClick={() => setIsAddResidentOpen(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <span className="material-symbols-outlined text-sm">person_add</span>
                <span>+ Add Resident</span>
              </button>
            </div>

            {loadingResidents ? (
              <div className="civic-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="material-symbols-outlined text-outline animate-spin" style={{ fontSize: '1.8rem' }}>progress_activity</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', marginTop: '0.5rem' }}>Loading residents...</p>
              </div>
            ) : residents.length === 0 ? (
              <div className="civic-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff', borderRadius: '16px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>group</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
                  No residents registered yet
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                  Add your first ward resident to enable them to report civic issues and receive official ward updates.
                </p>
                <button
                  onClick={() => setIsAddResidentOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>+ Add First Resident</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {residents.map((res) => (
                  <div key={res.id} className="civic-card" style={{ padding: '1.25rem', background: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-container)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {res.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--charcoal)', lineHeight: 1.2 }}>
                            {res.fullName}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>{res.email}</span>
                        </div>
                      </div>
                      <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                        {res.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--outline)', borderTop: '1px solid var(--outline-light)', paddingTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div><strong>Authorized Ward:</strong> Ward {user.wardNumber} ({user.localBodyName})</div>
                      {res.phone && <div><strong>Phone:</strong> {res.phone}</div>}
                      <div><strong>Registered:</strong> {new Date(res.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WARD CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  വാർഡ് കോൺടാക്റ്റുകൾ (Ward {user.wardNumber} Contacts)
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
                  Public contact information accessible exclusively to residents of Ward {user.wardNumber}.
                </p>
              </div>
              <button
                onClick={() => setIsAddContactOpen(true)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <span className="material-symbols-outlined text-sm">add_call</span>
                <span>+ Add Ward Contact</span>
              </button>
            </div>

            {loadingContacts ? (
              <div className="civic-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="material-symbols-outlined text-outline animate-spin" style={{ fontSize: '1.8rem' }}>progress_activity</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', marginTop: '0.5rem' }}>Loading contacts...</p>
              </div>
            ) : wardContacts.length === 0 ? (
              <div className="civic-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', background: '#ffffff', borderRadius: '16px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>contact_phone</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.35rem' }}>
                  No ward contacts published yet
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                  Publish important ward-level contacts such as Panchayat President, Ward Member, Ward Health Nurse, or local utility helpers.
                </p>
                <button
                  onClick={() => setIsAddContactOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <span className="material-symbols-outlined text-sm">add_call</span>
                  <span>+ Add First Contact</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {wardContacts.map((contact) => (
                  <div key={contact.id} className="civic-card" style={{ padding: '1.25rem', background: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                          {contact.name}
                        </h4>
                        <span className="badge badge-outline" style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                          {contact.designation}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }}
                        title="Remove contact"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', color: 'var(--charcoal)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#047857', fontWeight: 600 }}>
                        <span className="material-symbols-outlined text-sm">call</span>
                        <a href={`tel:${contact.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{contact.phone}</a>
                      </div>
                      {contact.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--outline)' }}>
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

                    <div style={{ borderTop: '1px solid var(--outline-light)', marginTop: '0.75rem', paddingTop: '0.5rem', fontSize: '0.7rem', color: 'var(--outline)' }}>
                      Authorized for Ward {user.wardNumber} Residents
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMMON KERALA GOVERNMENT DIRECTORY */}
        {activeTab === 'gov_directory' && (
          <div className="space-y-4">
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                കേരള സർക്കാർ ഔദ്യോഗിക ഡയറക്ടറി (Kerala Government Directory)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
                Authoritative public contact directory for 2026 Council of Ministers, 14 District Collectors, Senior Officials & Secretariat.
              </p>
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                fontSize: '0.75rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Source: Kerala Government Official Directory (12 Sept 2026). Please verify numbers before urgent official communication.</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
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
                    {level === 'all' && 'All Contacts (46)'}
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
              <div className="civic-card" style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="material-symbols-outlined text-outline animate-spin" style={{ fontSize: '1.8rem' }}>progress_activity</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--outline)', marginTop: '0.5rem' }}>Loading directory...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {govContacts.map((c) => (
                  <div key={c.id} className="civic-card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                          {c.name}
                        </h4>
                        <span className="badge badge-outline" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                          {c.level.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.4rem' }}>
                        {c.designation} {c.district ? `(${c.district})` : ''}
                      </div>

                      {c.department && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--outline)', marginBottom: '0.65rem', lineHeight: 1.4 }}>
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
                          <span style={{ color: '#9ca3af', fontWeight: 500, fontSize: '0.78rem' }}>Not listed (Preserved from PDF)</span>
                        )}
                      </div>
                      {c.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
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
        )}
      </main>

      {/* MODAL: ADD RESIDENT */}
      {isAddResidentOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="civic-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  Add Ward Resident
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>
                  Automatically assigned to Ward {user.wardNumber} ({user.localBodyName})
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddResidentOpen(false);
                  setResFeedback(null);
                }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {resFeedback?.error && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {resFeedback.error}
              </div>
            )}

            {resFeedback?.success && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {resFeedback.success}
              </div>
            )}

            <form onSubmit={handleAddResident} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh K"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Username (Login ID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. resident001"
                  value={resUsername}
                  onChange={(e) => setResUsername(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: '0.25rem' }}>
                  Letters, numbers, underscores or hyphens (3-30 chars).
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 94470 00000"
                  value={resPhone}
                  onChange={(e) => setResPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Password (Optional, default: Resident@123)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={resPassword}
                  onChange={(e) => setResPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{
                padding: '0.65rem',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.72rem',
                color: 'var(--outline)'
              }}>
                <strong>Authorized Ward Binding:</strong> {user.district} &rarr; {user.localBodyName} &rarr; Ward {user.wardNumber}. Derived securely from your authenticated representative session.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddResidentOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--outline-light)', background: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingResident}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  {isSubmittingResident ? 'Creating Account...' : 'Add Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WARD CONTACT */}
      {isAddContactOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="civic-card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                  Add Ward Contact
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>
                  Visible only to residents of Ward {user.wardNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddContactOpen(false);
                  setContactFeedback(null);
                }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {contactFeedback?.error && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {contactFeedback.error}
              </div>
            )}

            {contactFeedback?.success && (
              <div style={{ padding: '0.5rem 0.75rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {contactFeedback.success}
              </div>
            )}

            <form onSubmit={handleAddWardContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grama Panchayat President / Ward Nurse"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. President / Health Nurse / Utility Officer"
                  value={contactDesignation}
                  onChange={(e) => setContactDesignation(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0491-2505266 / +91 94470 00000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@panchayat.lsgd.kerala.gov.in"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Description / Service Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Available Mon-Fri 9am-5pm for primary health consultations."
                  value={contactDesc}
                  onChange={(e) => setContactDesc(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--outline-light)', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--outline-light)', background: '#ffffff', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContact}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  {isSubmittingContact ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />

      <Footer onOpenAdminLogin={() => {}} />
    </div>
  );
};

