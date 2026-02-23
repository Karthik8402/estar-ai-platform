import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getIntegrity } from '../../config/simulatedAuditData';

export default function IntegrityView() {
  const data = getIntegrity();
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(data.integrity_score), 100);
    return () => clearTimeout(timer);
  }, [data.integrity_score]);

  const barColor = data.integrity_score >= 90
    ? 'var(--status-online)'
    : data.integrity_score >= 70
      ? 'var(--status-warning)'
      : 'var(--status-error)';

  return (
    <div>
      {/* Header */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
        Log Integrity
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '0 0 24px 0' }}>
        Last check: {formatDistanceToNow(new Date(data.last_check), { addSuffix: true })}
      </p>

      {/* Score block */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Integrity Score
          </h3>
          <span className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data.integrity_score}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden', marginBottom: '12px' }}>
          <div
            style={{
              height: '100%',
              width: `${barWidth}%`,
              borderRadius: '4px',
              background: barColor,
              transition: 'width 600ms ease-out',
            }}
          />
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          {data.entries_verified} entries verified · {data.violations.length} violations found
        </p>
      </div>

      {/* Violations */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          marginBottom: '24px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Violations
          </h3>
        </div>
        {data.violations.map((v, i) => (
          <div
            key={i}
            style={{
              padding: '14px 20px',
              borderBottom: i < data.violations.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{
                color: v.severity === 'error' ? 'var(--status-error)' : 'var(--status-warning)',
                lineHeight: 1.4,
              }}>●</span>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{v.message}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {v.user && <span>User: {v.user}</span>}
                  {v.user && v.action && <span>·</span>}
                  {v.action && <span>Action: {v.action}</span>}
                  <span>·</span>
                  <span>{new Date(v.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checks performed */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
          Checks Performed
        </h3>
        {data.checks.map((check, i) => {
          const resultColor = check.passed
            ? (check.detail.includes('warnings') ? 'var(--status-warning)' : 'var(--status-online)')
            : 'var(--status-error)';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: i < data.checks.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--status-online)', marginRight: '6px' }}>✓</span>
                {check.name}
              </span>
              <span style={{ fontSize: '14px', color: resultColor, textAlign: 'right' }}>
                {check.detail}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
