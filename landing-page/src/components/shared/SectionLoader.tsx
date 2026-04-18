/**
 * SectionLoader - Reusable loading skeleton for audit dashboard sections.
 * Shows a pulsing skeleton placeholder while data is being fetched.
 */

type LoaderType = 'lines' | 'overview' | 'table' | 'cards';

interface Props {
  lines?: number;
  label?: string;
  type?: LoaderType;
}

const SHIMMER_STYLE = {
  background: 'var(--surface-raised)',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  opacity: 0.8,
  animation: 'glass-pulse 1.8s ease-in-out infinite',
};

const LINE_WIDTHS = ['72%', '84%', '96%', '78%', '90%', '75%', '88%'];

export default function SectionLoader({ lines = 4, label = 'Loading...', type = 'lines' }: Props) {
  const Header = (
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
  );

  let Content = null;

  if (type === 'overview') {
    Content = (
      <div>
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((k) => (
            <div key={k} style={{ ...SHIMMER_STYLE, height: '100px', borderRadius: '12px' }} />
          ))}
        </div>
        {/* Stats list skeleton */}
        <div style={{ ...SHIMMER_STYLE, height: '200px', borderRadius: '12px', marginBottom: '24px' }} />
        {/* Activity skeleton */}
        <div style={{ ...SHIMMER_STYLE, height: '300px', borderRadius: '12px' }} />
      </div>
    );
  } else if (type === 'table') {
    Content = (
      <div>
        {/* Header row skeleton */}
        <div style={{ ...SHIMMER_STYLE, height: '40px', borderRadius: '12px 12px 0 0', marginBottom: '1px' }} />
        {/* Data rows */}
        {[1, 2, 3, 4, 5].map((k) => (
          <div key={k} style={{ ...SHIMMER_STYLE, height: '60px', borderRadius: '0', marginBottom: '1px' }} />
        ))}
        {/* Footer */}
        <div style={{ ...SHIMMER_STYLE, height: '40px', borderRadius: '0 0 12px 12px' }} />
      </div>
    );
  } else if (type === 'cards') {
    Content = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[1, 2, 3].map((k) => (
          <div key={k} style={{ ...SHIMMER_STYLE, height: '140px', borderRadius: '12px' }} />
        ))}
      </div>
    );
  } else {
    Content = (
      <div>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              ...SHIMMER_STYLE,
              height: '14px',
              borderRadius: '6px',
              marginBottom: '12px',
              width: LINE_WIDTHS[i % LINE_WIDTHS.length],
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {Header}
      {Content}
      <style>{`
        @keyframes glass-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.995); }
          50% { opacity: 0.9; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
