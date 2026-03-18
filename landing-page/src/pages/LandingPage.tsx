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
            width: '140px', height: '140px', borderRadius: '50%', 
            background: 'radial-gradient(circle at 30% 30%, #93c5fd, #3b82f6, #1e3a8a)',
            boxShadow: '0 12px 28px rgba(37, 99, 235, 0.4), inset 0 8px 16px rgba(255,255,255,0.5), inset 0 -8px 16px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto', position: 'relative',
            border: '2px solid rgba(255,255,255,0.4)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <span 
            className="font-sans"
            style={{ 
              color: 'white', fontWeight: 800, fontSize: '32px', 
              letterSpacing: '-0.02em', textShadow: '0 2px 6px rgba(0,0,0,0.4)' 
            }}
          >
            eSTAR
          </span>
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: '40%', height: '30%', background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)', borderRadius: '50%', transform: 'rotate(-20deg)' }}></div>
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
