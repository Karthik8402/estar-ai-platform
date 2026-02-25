/**
 * useAnomalies — Paginated anomaly list with filters.
 *
 * Fetches GET /reports/anomalies?page=&limit=&severity=&type=&search=
 * Falls back to simulatedAuditData when backend is unreachable.
 */

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../config/apiClient';
import { getAnomalies as getSimulatedAnomalies, type Anomaly } from '../../config/simulatedAuditData';

interface AnomalyResponse {
    items: Anomaly[];
    total: number;
    page: number;
    totalPages: number;
}

export function useAnomalies(
    page: number = 1,
    limit: number = 10,
    severity?: string,
    type?: string,
    search?: string,
) {
    return useQuery<AnomalyResponse>({
        queryKey: ['audit', 'anomalies', { page, limit, severity, type, search }],
        queryFn: async () => {
            try {
                const params = new URLSearchParams();
                params.set('page', String(page));
                params.set('limit', String(limit));
                if (severity && severity !== 'all') params.set('severity', severity);
                if (type && type !== 'all') params.set('type', type);
                if (search) params.set('search', search);

                return await apiGet<AnomalyResponse>(`/reports/anomalies?${params.toString()}`);
            } catch {
                console.warn('[useAnomalies] Backend unreachable, using simulated data');
                return getSimulatedAnomalies(page, limit, severity, type, search);
            }
        },
        placeholderData: (prev) => prev, // keep previous data during pagination
        staleTime: 20_000,
    });
}
