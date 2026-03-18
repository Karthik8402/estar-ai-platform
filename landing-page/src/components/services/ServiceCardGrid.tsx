import type { ServiceConfig } from '../../config/services';
import ServiceCard from './ServiceCard';

interface Props {
  services: ServiceConfig[];
}

export default function ServiceCardGrid({ services }: Props) {
  return (
    <section style={{ marginTop: '32px' }}>
      {/* Hidden h2 for a11y, since the orb is the visual anchor now */}
      <h2 className="sr-only">Services</h2>
      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{ columnGap: '64px', rowGap: '24px' }}
      >
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
