import { Clock, MapPin, Tag } from 'lucide-react';
import { Issue, IssueTimeline } from '../types/database';

interface IssueCardProps {
  issue: Issue;
  timeline?: IssueTimeline[];
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, timeline }) => {
  const getStatusBadge = (status: Issue['status']) => {
    switch (status) {
      case 'submitted':
        return <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>രേഖപ്പെടുത്തി (Submitted)</span>;
      case 'in_progress':
        return <span className="badge" style={{ background: '#dbeafe', color: '#1e40af' }}>നടപടിയിൽ (In Progress)</span>;
      case 'resolved':
        return <span className="badge" style={{ background: '#d1fae5', color: '#065f46' }}>പരിഹരിച്ചു (Resolved)</span>;
      default:
        return <span className="badge badge-outline">{status}</span>;
    }
  };

  const getCategoryLabel = (cat: Issue['category']) => {
    const map: Record<Issue['category'], string> = {
      roads: 'റോഡുകൾ (Roads)',
      streetlights: 'തെരുവ് വിളക്കുകൾ (Streetlights)',
      water_supply: 'കുടിവെള്ളം (Water Supply)',
      sanitation: 'ശുചിത്വം (Sanitation)',
      drainage: 'ഓടകൾ (Drainage)',
      public_health: 'പൊതുജനാരോഗ്യം (Public Health)',
      other: 'മറ്റു കാര്യങ്ങൾ (Other)'
    };
    return map[cat] || cat;
  };

  return (
    <div className="civic-card" style={{ marginBottom: '1rem' }}>
      {/* Top Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-600)', fontFamily: 'monospace' }}>
            {issue.issueNumber}
          </span>
          <span className="badge badge-outline" style={{ fontSize: '0.75rem' }}>
            <Tag size={12} />
            <span>{getCategoryLabel(issue.category)}</span>
          </span>
        </div>
        {getStatusBadge(issue.status)}
      </div>

      {/* Title & Description */}
      <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.4rem' }}>
        {issue.titleMl}
      </h4>
      <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginBottom: '0.85rem' }}>
        {issue.descriptionMl}
      </p>

      {/* Location Landmark if any */}
      {issue.locationLandmark && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
          <MapPin size={14} color="var(--civic-600)" />
          <span>സ്ഥലം: {issue.locationLandmark}</span>
        </div>
      )}

      {/* Timeline preview */}
      {timeline && timeline.length > 0 && (
        <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', marginBottom: '0.4rem' }}>
            സമയക്രമം (Timeline History):
          </div>
          {timeline.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--slate-700)' }}>
              <Clock size={12} color="var(--civic-600)" />
              <span style={{ fontWeight: 500 }}>{t.titleMl}</span>
              {t.remarksMl && <span style={{ color: 'var(--slate-600)' }}>— {t.remarksMl}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
