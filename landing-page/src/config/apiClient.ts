/**
 * API Client — thin wrapper around fetch for backend communication.
 *
 * - Base URL from VITE_API_GATEWAY_URL env var (defaults to localhost:8001)
 * - No JWT enforcement for now (dev mode)
 * - Throws typed errors on non-OK responses
 */

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8001';

interface ApiError {
    status: number;
    statusText: string;
    detail?: string;
}

/**
 * Performs a GET request to the backend.
 * @throws ApiError on non-OK response
 */
export async function apiGet<T>(path: string): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw { status: res.status, statusText: res.statusText, detail } as ApiError;
    }

    return res.json();
}

/**
 * Performs a POST request to the backend.
 * @throws ApiError on non-OK response
 */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw { status: res.status, statusText: res.statusText, detail } as ApiError;
    }

    return res.json();
}

/**
 * Performs a PUT request to the backend.
 * @throws ApiError on non-OK response
 */
export async function apiPut<T>(path: string, body: unknown): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw { status: res.status, statusText: res.statusText, detail } as ApiError;
    }

    return res.json();
}

/**
 * Check if the backend is reachable (quick health check).
 */
export async function isBackendAvailable(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export { API_BASE_URL };
export type { ApiError };
