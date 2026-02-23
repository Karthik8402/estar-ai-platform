import CountUp from 'react-countup';

interface Props {
  value: number;
  label: string;
  suffix?: string;
  accent?: 'warning' | 'error';
}

export default function MetricCard({ value, label, suffix = '', accent }: Props) {
  const valueColor = accent === 'warning'
    ? 'var(--status-warning)'
    : accent === 'error'
      ? 'var(--status-error)'
      : 'var(--text-primary)';

  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        transition: 'box-shadow 200ms ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div
        className="font-mono"
        style={{
          fontSize: '24px',
          fontWeight: 700,
          lineHeight: 1.2,
          color: valueColor,
        }}
      >
        <CountUp end={value} duration={0.8} separator="," />{suffix}
      </div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-tertiary)',
          marginTop: '6px',
        }}
      >
        {label}
      </div>
    </div>
  );
}
