import { formatDistanceToNow } from 'date-fns';
import MetricCard from '../shared/MetricCard';
import { getAuditActivity } from '../../config/simulatedAuditData';

export default function AuditOverview() {
  const activity = getAuditActivity();

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Audit Trail &amp; Log Integrity
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 12px 0' }}>
          21 CFR Part 11 Compliance Monitoring
        </p>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--status-online)', display: 'inline-block' }} />
            Online
          </span>
          <span>·</span>
          <span>v1.0.0</span>
          <span>·</span>
          <span>Uptime 4h 23m</span>
          <span>·</span>
          <span>Last run 2m ago</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '16px', marginBottom: '24px' }}>
        <MetricCard value={1204} label="LOGS ANALYZED" />
        <MetricCard value={3} label="ALERTS TODAY" accent="warning" />
        <MetricCard value={94} label="COMPLIANCE SCORE" suffix="%" />
        <MetricCard value={887} label="INTEGRITY PASSED" />
      </div>

      {/* Quick stats */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
          Quick Stats
        </h3>
        {[
          { key: 'Logs analyzed today', value: '890' },
          { key: 'Anomalies flagged', value: '3' },
          { key: 'Integrity checks', value: '887' },
          { key: 'Human errors detected', value: '2' },
        ].map((row, i, arr) => (
          <div
            key={row.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{row.key}</span>
            <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
          Recent Activity
        </h3>
        {activity.map((item, i, arr) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '10px 0',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: '4px',
                flexShrink: 0,
                marginTop: '2px',
                color: ({ warn: 'var(--status-warning)', error: 'var(--status-error)' } as Record<string, string>)[item.severity] ?? 'var(--text-secondary)',
                background: ({ warn: 'rgba(245,158,11,0.1)', error: 'rgba(239,68,68,0.1)' } as Record<string, string>)[item.severity] ?? 'transparent',
              }}
            >
              {item.severity.toUpperCase()}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{item.message}</div>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
