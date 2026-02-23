type Status = 'online' | 'degraded' | 'offline' | 'loading';

interface Props {
  status: Status;
}

const config: Record<Status, { label: string; color: string; bg: string }> = {
  online:   { label: 'Online',   color: 'var(--status-online)',  bg: 'var(--status-online-bg)' },
  degraded: { label: 'Degraded', color: 'var(--status-warning)', bg: 'var(--status-warning-bg)' },
  offline:  { label: 'Offline',  color: 'var(--status-error)',   bg: 'var(--status-error-bg)' },
  loading:  { label: '',         color: 'var(--text-tertiary)',  bg: 'var(--border)' },
};

export default function ServiceStatusBadge({ status }: Props) {
  if (status === 'loading') {
    return (
      <span
        className="animate-pulse"
        style={{
          display: 'inline-block',
          width: '64px',
          height: '24px',
          borderRadius: '9999px',
          background: 'var(--border)',
        }}
      />
    );
  }

  const { label, color, bg } = config[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        color,
        background: bg,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
