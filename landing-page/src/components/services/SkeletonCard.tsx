export default function SkeletonCard() {
  return (
    <div
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <div className="animate-pulse" style={{ height: '20px', width: '75%', borderRadius: '4px', background: 'var(--border)' }} />
      <div className="animate-pulse" style={{ height: '16px', width: '50%', borderRadius: '4px', background: 'var(--border)', marginTop: '12px' }} />
      <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
        <div className="animate-pulse" style={{ height: '40px', width: '80px', borderRadius: '4px', background: 'var(--border)' }} />
        <div className="animate-pulse" style={{ height: '40px', width: '80px', borderRadius: '4px', background: 'var(--border)' }} />
        <div className="animate-pulse" style={{ height: '40px', width: '80px', borderRadius: '4px', background: 'var(--border)' }} />
      </div>
      <div className="animate-pulse" style={{ height: '6px', width: '100%', borderRadius: '4px', background: 'var(--border)', marginTop: '20px' }} />
    </div>
  );
}
