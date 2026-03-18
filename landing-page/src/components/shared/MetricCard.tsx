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

  const formatCompact = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return Math.round(n).toLocaleString();
  };

  const compactLabel = `${formatCompact(value)}${suffix}`;
  const compactOnly = /[KMB]$/.test(compactLabel.replace('%', ''));

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
        title={`${value.toLocaleString()}${suffix}`}
        style={{
          fontSize: 'clamp(20px, 2.2vw, 34px)',
          fontWeight: 700,
          lineHeight: 1.2,
          color: valueColor,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {compactOnly ? compactLabel : <><CountUp end={value} duration={0.8} separator="," />{suffix}</>}
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
