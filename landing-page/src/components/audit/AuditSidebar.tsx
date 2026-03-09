import { useNavigate } from 'react-router-dom';

type Section = 'overview' | 'anomalies' | 'integrity' | 'reports' | 'agents' | 'settings';

interface Props {
  activeSection: Section;
  onNavigate: (section: Section) => void;
}

const NAV_ITEMS: { id: Section; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'integrity', label: 'Integrity' },
  { id: 'reports', label: 'Reports' },
  { id: 'agents', label: 'Agents' },
  { id: 'settings', label: 'Settings' },
];

export default function AuditSidebar({ activeSection, onNavigate }: Props) {
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop sidebar — visible at md+ */}
      <aside className="audit-sidebar-desktop">
        {/* ← Back at top — always visible */}
        <button
          onClick={() => navigate('/')}
          style={{
            marginBottom: '16px',
            padding: '6px 12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          ← Back
        </button>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-tertiary)',
            marginBottom: '12px',
            padding: '0 12px',
          }}
        >
          Audit Trail
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 500 : 400,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile tab bar — visible below md */}
      <div className="audit-tabbar-mobile">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                padding: '10px 14px',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 500 : 400,
                fontSize: '13px',
                fontFamily: 'inherit',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export type { Section };
