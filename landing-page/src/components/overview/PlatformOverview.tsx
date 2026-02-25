import { useEffect, useState } from 'react';
import CountUp from 'react-countup';
// TODO: Replace with aggregated hook data once all 4 microservices have backends
import { getAverageComplianceScore, getOnlineCount, getTotalServices, getDegradedCount } from '../../config/simulatedData';

export default function PlatformOverview() {
  const score = getAverageComplianceScore();
  const online = getOnlineCount();
  const total = getTotalServices();
  const degraded = getDegradedCount();
  const offline = total - online - degraded;
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(score), 50);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <section
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Platform Compliance
      </h2>

      {/* Compliance bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            flex: 1,
            height: '8px',
            borderRadius: '4px',
            background: 'var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${barWidth}%`,
              borderRadius: '4px',
              background: 'var(--brand)',
              transition: 'width 600ms ease-out',
            }}
          />
        </div>
        <span
          className="font-mono"
          style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '48px', textAlign: 'right' }}
        >
          <CountUp end={score} duration={0.8} />%
        </span>
      </div>

      {/* Status line */}
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {total} Services
        <Dot />
        <span style={{ color: 'var(--status-online)' }}>{online} Online</span>
        {degraded > 0 && (
          <>
            <Dot />
            <span style={{ color: 'var(--status-warning)' }}>{degraded} Degraded</span>
          </>
        )}
        {offline > 0 && (
          <>
            <Dot />
            <span style={{ color: 'var(--status-error)' }}>{offline} Offline</span>
          </>
        )}
        <Dot />
        Synced 30s ago
      </p>
    </section>
  );
}

function Dot() {
  return (
    <span style={{ margin: '0 8px', color: 'var(--text-tertiary)' }}>·</span>
  );
}
