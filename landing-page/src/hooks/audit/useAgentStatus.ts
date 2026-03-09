/**
 * useAgentStatus — Agent control hooks.
 *
 * GET /agents/status — all agent statuses
 * POST /agents/start — start an agent
 * POST /agents/stop — stop an agent
 * Falls back to simulatedAuditData when backend is unreachable.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
            toast.success('Agent started successfully');
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message
                : (error as { detail?: string })?.detail ?? 'Unknown error';
            toast.error('Failed to start agent', { description: msg });
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
            toast.success('Agent stopped');
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message
                : (error as { detail?: string })?.detail ?? 'Unknown error';
            toast.error('Failed to stop agent', { description: msg });
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
            toast.success('All agents started');
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message
                : (error as { detail?: string })?.detail ?? 'Unknown error';
            toast.error('Failed to start all agents', { description: msg });
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
            toast.success('All agents stopped');
        },
        onError: (error: unknown) => {
            const msg = error instanceof Error ? error.message
                : (error as { detail?: string })?.detail ?? 'Unknown error';
            toast.error('Failed to stop all agents', { description: msg });
        },
    });
}
