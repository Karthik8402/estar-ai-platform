interface Props {
  companyName: string;
  platformName: string;
  version: string;
}

export default function PlatformFooter({ companyName, platformName, version }: Props) {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 0',
        marginTop: '48px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)', lineHeight: 1.8 }}>
        {platformName} v{version} · {companyName}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
        21 CFR Part 11 · ICH Q1A · ICH Q1E · GMP
      </p>
    </footer>
  );
}
