/**
 * useAgentStatus — Agent control hooks.
 *
 * GET /agents/status — all agent statuses
 * POST /agents/start — start an agent
 * POST /agents/stop — stop an agent
 * Falls back to simulatedAuditData when backend is unreachable.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../../config/apiClient';
import { getAgents as getSimulatedAgents, type AgentStatus } from '../../config/simulatedAuditData';

export function useAgentStatus() {
    return useQuery<AgentStatus[]>({
        queryKey: ['audit', 'agents'],
        queryFn: async () => {
            try {
                return await apiGet<AgentStatus[]>('/agents/status');
            } catch {
                console.warn('[useAgentStatus] Backend unreachable, using simulated data');
                return getSimulatedAgents();
            }
        },
        refetchInterval: 15_000,
        staleTime: 10_000,
    });
}

export function useStartAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (agentId: string) => {
            return await apiPost('/agents/start', { agent_id: agentId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit', 'agents'] });
        },
    });
}

export function useStopAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (agentId: string) => {
            return await apiPost('/agents/stop', { agent_id: agentId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit', 'agents'] });
        },
    });
}

export function useStartAllAgents() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            return await apiPost('/agents/start-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit', 'agents'] });
        },
    });
}

export function useStopAllAgents() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            return await apiPost('/agents/stop-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audit', 'agents'] });
        },
    });
}
