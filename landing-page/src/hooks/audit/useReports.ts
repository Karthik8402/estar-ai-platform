/**
 * useReports — Report list + generation.
 *
 * GET /reports/summary — list of generated reports
 * POST /reports/generate — trigger new AI-generated report
 * Falls back to simulatedAuditData when backend is unreachable.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../config/apiClient';
import { getReports as getSimulatedReports, type AuditReport } from '../../config/simulatedAuditData';

export function useReports() {
    return useQuery<AuditReport[]>({
        queryKey: ['audit', 'reports'],
        queryFn: async () => {
            try {
                return await apiGet<AuditReport[]>('/reports/summary');
            } catch {
                console.warn('[useReports] Backend unreachable, using simulated data');
                return getSimulatedReports();
            }
        },
        staleTime: 30_000,
    });
}

export function useGenerateReport() {
    const queryClient = useQueryClient();

    return useMutation<AuditReport>({
        mutationFn: async () => {
            return await apiPost<AuditReport>('/reports/generate');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit', 'reports'] });
        },
    });
}
