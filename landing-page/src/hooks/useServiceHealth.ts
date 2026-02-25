/**
 * useServiceHealth — Polls GET /health for each microservice.
 *
 * Falls back to simulated data when the backend is unreachable.
 * Used by ServiceCardGrid and PlatformOverview.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../config/apiClient';
import { getSimulatedHealth, type HealthData } from '../config/simulatedData';

export function useServiceHealth(serviceId: string, statusEndpoint: string) {
    return useQuery<HealthData>({
        queryKey: ['service-health', serviceId],
        queryFn: async () => {
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
