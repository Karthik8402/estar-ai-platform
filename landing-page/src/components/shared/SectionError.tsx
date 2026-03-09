/**
 * SectionError — Reusable inline error card for audit dashboard sections.
 * Displays a subtle error banner with optional retry action.
 */

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function SectionError({
  message = 'Failed to load data. Please try again.',
  onRetry,
}: Props) {
  return (
    <div
      style={{
        background: 'rgba(239, 68, 68, 0.06)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '16px',
      }}>
        ⚠
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-raised)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
