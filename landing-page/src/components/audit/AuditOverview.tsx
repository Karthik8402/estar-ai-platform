import { formatDistanceToNow } from 'date-fns';
import MetricCard from '../shared/MetricCard';
import SectionLoader from '../shared/SectionLoader';
import SectionError from '../shared/SectionError';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import { useServiceSummary } from '../../hooks/useServiceSummary';

export default function AuditOverview() {
  const { data: activity = [], isLoading: activityLoading, isError: activityError } = useActivityFeed(5);
  const { data: summary, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useServiceSummary('audit-trail', '/api/audit');

  const isLoading = activityLoading || summaryLoading;

  // Compute dynamic last run display from summary
  const lastRunStr = summary?.last_run
    ? formatDistanceToNow(new Date(summary.last_run), { addSuffix: true })
    : 'loading...';

  // Dynamic quick stats from the backend /summary endpoint
  const quickStats = [
    { key: 'Logs analyzed', value: String(summary?.quick_stats?.logs_analyzed_today ?? '—') },
    { key: 'Anomalies flagged', value: String(summary?.quick_stats?.anomalies_flagged ?? '—') },
    { key: 'Integrity checks passed', value: String(summary?.quick_stats?.integrity_checks_passed ?? '—') },
    { key: 'Human errors detected', value: String(summary?.quick_stats?.human_errors_detected ?? '—') },
  ];

  if (isLoading) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          Audit Trail &amp; Log Integrity
        </h1>
        <SectionLoader lines={8} label="Loading overview data…" />
      </div>
    );
  }

  if (summaryError) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          Audit Trail &amp; Log Integrity
        </h1>
        <SectionError
          message="Could not load audit overview data."
          onRetry={() => refetchSummary()}
        />
      </div>
    );
  }

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
          <span>Last run {lastRunStr}</span>
        </div>
      </div>

      {/* Metric cards — values from /summary API */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '16px', marginBottom: '24px' }}>
        <MetricCard value={summary?.total_processed ?? 0} label="LOGS ANALYZED" />
        <MetricCard value={summary?.alerts_today ?? 0} label="ALERTS TODAY" accent="warning" />
        <MetricCard value={summary?.compliance_score ?? 0} label="COMPLIANCE SCORE" suffix="%" />
        <MetricCard value={summary?.quick_stats?.integrity_checks_passed ?? 0} label="INTEGRITY PASSED" />
      </div>

      {/* Quick stats — dynamic from /summary API */}
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
        {quickStats.map((row, i, arr) => (
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
        {activityError && (
          <div style={{ padding: '12px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            Activity feed unavailable
          </div>
        )}
        {!activityError && activity.length === 0 && (
          <div style={{ padding: '12px 0', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No recent activity
          </div>
        )}
        {!activityError && activity.map((item, i, arr) => (
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
