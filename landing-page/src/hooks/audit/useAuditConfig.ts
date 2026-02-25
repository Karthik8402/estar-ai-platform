/**
 * useAuditConfig — Threshold and compliance rule hooks.
 *
 * GET /config/thresholds — detection thresholds
 * GET /config/rules — compliance rules
 * PUT /config/rules — update thresholds
 * Falls back to simulatedAuditData when backend is unreachable.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '../../config/apiClient';
import {
    getThresholds as getSimulatedThresholds,
    getComplianceRules as getSimulatedRules,
    type AuditThresholds,
    type ComplianceRule,
} from '../../config/simulatedAuditData';

export function useThresholds() {
    return useQuery<AuditThresholds>({
        queryKey: ['audit', 'thresholds'],
        queryFn: async () => {
            try {
                return await apiGet<AuditThresholds>('/config/thresholds');
            } catch {
                console.warn('[useThresholds] Backend unreachable, using simulated data');
                return getSimulatedThresholds();
            }
        },
        staleTime: 60_000,
    });
}

export function useComplianceRules() {
    return useQuery<ComplianceRule[]>({
        queryKey: ['audit', 'compliance-rules'],
        queryFn: async () => {
            try {
                return await apiGet<ComplianceRule[]>('/config/rules');
            } catch {
                console.warn('[useComplianceRules] Backend unreachable, using simulated data');
                return getSimulatedRules();
            }
        },
        staleTime: 60_000,
    });
}

export function useUpdateThresholds() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (thresholds: Partial<AuditThresholds>) => {
            return await apiPut('/config/rules', thresholds);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit', 'thresholds'] });
        },
    });
}
