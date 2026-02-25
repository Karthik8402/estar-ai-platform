import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import LandingPage from './pages/LandingPage';
import AuditDashboard from './pages/AuditDashboard';
import PlatformHeader from './components/layout/PlatformHeader';
import PlatformFooter from './components/layout/PlatformFooter';
import { initServiceRegistry, type ServiceConfig } from './config/services';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
});

export default function App() {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [platformInfo, setPlatformInfo] = useState({ platform: '', company: '', version: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initServiceRegistry()
      .then((data) => {
        setServices(data.services);
        setPlatformInfo({ platform: data.platform, company: data.company, version: data.version });
        setLoading(false);

        toast.success('Connected to eSTAR AI Platform', {
          description: `${data.services.length} microservices registered`,
          duration: 4000,
        });
      })
      .catch((err) => {
        console.error('Failed to load service registry:', err);
        setLoading(false);
        toast.error('Failed to load service registry');
      });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--brand)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Loading services...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <PlatformHeader companyName={platformInfo.company} platformName={platformInfo.platform} />

        <div style={{ flex: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  services={services}
                  platformName={platformInfo.platform}
                  companyName={platformInfo.company}
                  version={platformInfo.version}
                />
              }
            />
            <Route path="/audit" element={<AuditDashboard />} />
            {/* Future: /stability, /oot, /data-entry */}
          </Routes>
        </div>

        <PlatformFooter
          companyName={platformInfo.company}
          platformName={platformInfo.platform}
          version={platformInfo.version}
        />
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            borderRadius: '8px',
          },
        }}
      />
    </BrowserRouter>
    </QueryClientProvider>
  );
}
