/**
 * useServiceHealth — Polls GET /health for each microservice.
 *
 * Falls back to simulated data when the backend is unreachable.
 * Used by ServiceCardGrid and PlatformOverview.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet, API_BASE_URL } from '../config/apiClient';
import { getSimulatedHealth, type HealthData } from '../config/simulatedData';

const LIVE_MULTI_SERVICE = import.meta.env.VITE_ENABLE_MULTI_SERVICE_LIVE === 'true';

function shouldUseSimulatedOnly(serviceId: string) {
    if (serviceId === 'audit-trail') return false;
    if (LIVE_MULTI_SERVICE) return false;

    // Single-service deployments (like only audit-trail backend) should not spam 404s.
    return API_BASE_URL.includes('audit-trail-service') || API_BASE_URL.endsWith(':8001');
}

export function useServiceHealth(serviceId: string, statusEndpoint: string) {
    return useQuery<HealthData>({
        queryKey: ['service-health', serviceId],
        queryFn: async () => {
            if (shouldUseSimulatedOnly(serviceId)) {
                const simulated = getSimulatedHealth(serviceId);
                if (simulated) return simulated;
            }

            try {
                const data = await apiGet<HealthData>(statusEndpoint.replace('/api/audit', ''));
                return data;
            } catch {
                console.warn(`[useServiceHealth] Backend unreachable for ${serviceId}, using simulated data`);
                const simulated = getSimulatedHealth(serviceId);
                if (simulated) return simulated;
                throw new Error(`No data for ${serviceId}`);
            }
        },
        refetchInterval: 30_000,
        retry: 1,
        staleTime: 25_000,
    });
}
