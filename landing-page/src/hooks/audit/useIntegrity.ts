/**
 * useIntegrity — Fetches integrity check results from Agent 2.
 *
 * GET /reports/integrity
 * Falls back to simulatedAuditData when backend is unreachable.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../config/apiClient';
import { getIntegrity as getSimulatedIntegrity, type IntegrityReport } from '../../config/simulatedAuditData';

export function useIntegrity() {
    return useQuery<IntegrityReport>({
        queryKey: ['audit', 'integrity'],
        queryFn: async () => {
            try {
                return await apiGet<IntegrityReport>('/reports/integrity');
            } catch {
                console.warn('[useIntegrity] Backend unreachable, using simulated data');
                return getSimulatedIntegrity();
            }
        },
        refetchInterval: 15_000, // Refresh every 15s to show Agent 2 updates
        staleTime: 10_000,
    });
}
