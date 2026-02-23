
interface Props {
  activeSeverity: string;
  activeType: string;
  search: string;
  onSeverityChange: (s: string) => void;
  onTypeChange: (t: string) => void;
  onSearchChange: (q: string) => void;
  onExport: () => void;
}

const SEVERITIES = ['all', 'warn', 'error', 'critical'] as const;
const TYPES = ['all', 'human_error', 'integrity_fail', 'unauthorized'] as const;

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
        background: active ? 'var(--brand-subtle)' : 'transparent',
        color: active ? 'var(--brand)' : 'var(--text-secondary)',
        fontWeight: active ? 500 : 400,
        fontSize: '13px',
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  );
}

export default function FilterBar({ activeSeverity, activeType, search, onSeverityChange, onTypeChange, onSearchChange, onExport }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
      {/* Severity pills */}
      {SEVERITIES.map((s) => (
        <Pill key={s} label={s === 'all' ? 'All' : s.toUpperCase()} active={activeSeverity === s} onClick={() => onSeverityChange(s)} />
      ))}

      <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>·</span>

      {/* Type pills */}
      {TYPES.map((t) => (
        <Pill key={t} label={t === 'all' ? 'All Types' : t} active={activeType === t} onClick={() => onTypeChange(t)} />
      ))}

      <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>·</span>

      {/* Search */}
      <input
        type="text"
        placeholder="Search anomalies…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          fontSize: '14px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--surface-raised)',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          outline: 'none',
          width: '180px',
        }}
      />

      {/* Export */}
      <button
        onClick={onExport}
        style={{
          marginLeft: 'auto',
          border: 'none',
          background: 'transparent',
          color: 'var(--brand)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        Export
      </button>
    </div>
  );
}
