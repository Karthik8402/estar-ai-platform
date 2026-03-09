/**
 * SectionLoader — Reusable loading skeleton for audit dashboard sections.
 * Shows a pulsing skeleton placeholder while data is being fetched.
 */

interface Props {
  lines?: number;
  label?: string;
}

export default function SectionLoader({ lines = 4, label = 'Loading…' }: Props) {
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        fontSize: '13px',
        color: 'var(--text-tertiary)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: '16px',
          height: '16px',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--brand)',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spin 0.8s linear infinite',
        }} />
        {label}
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: '14px',
            borderRadius: '6px',
            background: 'var(--border)',
            opacity: 0.5,
            marginBottom: '12px',
            width: `${70 + Math.random() * 30}%`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
