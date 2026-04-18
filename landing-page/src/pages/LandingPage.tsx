import type { ServiceConfig } from '../config/services';
import PlatformOverview from '../components/overview/PlatformOverview';
import ServiceCardGrid from '../components/services/ServiceCardGrid';
import GlobalActivityFeed from '../components/feed/GlobalActivityFeed';

interface Props {
  services: ServiceConfig[];
  platformName: string;
  companyName: string;
  version: string;
}

export default function LandingPage({ services, version }: Props) {
  return (
    <main style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Platform Activity/Overview - Top Banner */}
      <div style={{ width: '100%', maxWidth: '1080px' }}>
        <PlatformOverview />
      </div>

      {/* Central eSTAR Orb / Branding */}
      <div style={{ margin: '48px 0', textAlign: 'center', position: 'relative' }}>
        <div 
          style={{ 
            width: '140px', height: '140px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', position: 'relative',
            filter: 'drop-shadow(0 12px 28px rgba(37, 99, 235, 0.3)) drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
            transition: 'transform 300ms ease, filter 300ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.filter = 'drop-shadow(0 16px 36px rgba(37, 99, 235, 0.4)) drop-shadow(0 6px 16px rgba(0,0,0,0.15))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'drop-shadow(0 12px 28px rgba(37, 99, 235, 0.3)) drop-shadow(0 4px 12px rgba(0,0,0,0.1))';
          }}
        >
          <img 
            src="/estar.png" 
            alt="eSTAR AI Platform Logo" 
            style={{ 
              width: '100%', height: '100%', 
              objectFit: 'cover',
            }} 
          />
        </div>
        <h1 style={{ marginTop: '20px', fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>
          Electronic Stability Testing, Analyses & Reporting
        </h1>
        <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {new Date().toDateString()} · V{version}
        </p>
      </div>

      {/* App Grid */}
      <div style={{ width: '100%', maxWidth: '1080px' }}>
        <ServiceCardGrid services={services} />
      </div>

      <div style={{ width: '100%', maxWidth: '1080px', marginTop: '48px' }}>
        <GlobalActivityFeed />
      </div>
    </main>
  );
}
