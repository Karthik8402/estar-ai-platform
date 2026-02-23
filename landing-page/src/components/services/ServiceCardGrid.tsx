import type { ServiceConfig } from '../../config/services';
import ServiceCard from './ServiceCard';

interface Props {
  services: ServiceConfig[];
}

export default function ServiceCardGrid({ services }: Props) {
  return (
    <section style={{ marginTop: '32px' }}>
      <h2
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '16px',
        }}
      >
        Services
      </h2>
      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: '16px' }}
      >
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  );
}
