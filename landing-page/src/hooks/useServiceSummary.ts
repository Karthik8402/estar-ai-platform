/**
 * useServiceSummary — Fetches GET /summary for each microservice.
 *
 * Falls back to simulated data when the backend is unreachable.
 * Used by ServiceCard and PlatformOverview for metrics.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../config/apiClient';
import { getSimulatedSummary, type SummaryData } from '../config/simulatedData';

export function useServiceSummary(serviceId: string, gatewayPrefix: string) {
    return useQuery<SummaryData>({
        queryKey: ['service-summary', serviceId],
        queryFn: async () => {
            try {
                const path = gatewayPrefix.replace('/api/audit', '') + '/summary';
                // For audit-trail, endpoint is at root /summary
                const finalPath = serviceId === 'audit-trail' ? '/summary' : path;
                const data = await apiGet<SummaryData>(finalPath);
                return data;
            } catch {
                console.warn(`[useServiceSummary] Backend unreachable for ${serviceId}, using simulated data`);
                const simulated = getSimulatedSummary(serviceId);
                if (simulated) return simulated;
                throw new Error(`No data for ${serviceId}`);
            }
        },
        refetchInterval: 30_000,
        retry: 1,
        staleTime: 25_000,
    });
}
