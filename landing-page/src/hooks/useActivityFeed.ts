/**
 * useActivityFeed — Fetches GET /activity/recent and merges across services.
 *
 * Falls back to simulated data when backend is unreachable.
 * Used by GlobalActivityFeed on the landing page and AuditOverview on the dashboard.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../config/apiClient';
import { getSimulatedActivity, type ActivityItem } from '../config/simulatedData';

interface ActivityResponse {
    items: ActivityItem[];
}

export function useActivityFeed(limit: number = 10) {
    return useQuery<ActivityItem[]>({
        queryKey: ['activity-feed', limit],
        queryFn: async () => {
            try {
                const data = await apiGet<ActivityResponse>(`/activity/recent?limit=${limit}`);
                return data.items;
            } catch {
                console.warn('[useActivityFeed] Backend unreachable, using simulated data');
                return getSimulatedActivity().slice(0, limit);
            }
        },
        refetchInterval: 30_000,
        retry: 1,
        staleTime: 25_000,
    });
}
