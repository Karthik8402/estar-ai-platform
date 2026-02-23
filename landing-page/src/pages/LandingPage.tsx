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

export default function LandingPage({ services }: Props) {
  return (
    <main style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', flex: 1 }}>
      <PlatformOverview />
      <ServiceCardGrid services={services} />
      <GlobalActivityFeed />
    </main>
  );
}
