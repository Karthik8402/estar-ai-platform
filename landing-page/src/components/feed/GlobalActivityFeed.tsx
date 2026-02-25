import { formatDistanceToNow } from 'date-fns';
import { useActivityFeed } from '../../hooks/useActivityFeed';
import type { ActivityItem } from '../../config/simulatedData';

export default function GlobalActivityFeed() {
  const { data: activities = [], isLoading } = useActivityFeed(10);

  if (isLoading) {
    return (
      <section style={{ marginTop: '48px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Recent Activity
        </h2>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '100px', height: '16px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
              <div style={{ flex: 1, height: '16px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
              <div style={{ width: '60px', height: '16px', background: 'var(--border)', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginTop: '48px' }}>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '16px',
        }}
      >
        Recent Activity
      </h2>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '4px 0',
          maxHeight: '480px',
          overflowY: 'auto',
        }}
      >
        {activities.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            No recent activity
          </p>
        ) : (
          activities.map((item, i) => (
            <FeedRow key={item.id} item={item} isLast={i === activities.length - 1} />
          ))
        )}
      </div>
    </section>
  );
}

const severityColor: Record<string, string> = {
  info: 'var(--status-info)',
  warn: 'var(--status-warning)',
  error: 'var(--status-error)',
  critical: 'var(--status-error)',
};

function FeedRow({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Service + Severity */}
      <div style={{ minWidth: '120px', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {item.service.replace(/-/g, ' ')}
        </div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: severityColor[item.severity] ?? 'var(--text-tertiary)',
            marginTop: '2px',
          }}
        >
          {item.severity}
        </div>
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
        {item.message}
      </div>

      {/* Time */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {timeAgo}
      </div>
    </div>
  );
}
