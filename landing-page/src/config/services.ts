export interface ServiceConfig {
    id: string;
    name: string;
    owner: string;
    description: string;
    icon: string;
    color: string;
    status_endpoint: string;
    dashboard_path: string;
    gateway_prefix: string;
    port: number;
    repo?: string;
    features: string[];
    compliance: string[];
}

export interface ServiceRegistry {
    platform: string;
    company: string;
    version: string;
    services: ServiceConfig[];
}

let cachedRegistry: ServiceRegistry | null = null;

export async function loadServiceRegistry(): Promise<ServiceRegistry> {
    if (cachedRegistry) return cachedRegistry;
    const res = await fetch('/service-registry.json');
    cachedRegistry = await res.json();
    return cachedRegistry!;
}

// Sync version for components — loaded at app start
export let SERVICES: ServiceConfig[] = [];
export let PLATFORM_INFO = { platform: '', company: '', version: '' };

export async function initServiceRegistry() {
    const data = await loadServiceRegistry();
    SERVICES = data.services;
    PLATFORM_INFO = { platform: data.platform, company: data.company, version: data.version };
    return data;
}
