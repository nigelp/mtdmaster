import { safeStorage } from 'electron';

const BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

export interface GoCardlessConfig {
    secretId: string;
    secretKey: string;
}

export interface TokenSet {
    access: string;
    access_expires: number;
    refresh: string;
    refresh_expires: number;
}

export class GoCardlessService {
    private config: GoCardlessConfig;
    private tokens: TokenSet | null = null;

    constructor(config: GoCardlessConfig) {
        this.config = config;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        } as HeadersInit;

        // Auto-inject token if available and not a token request
        if (this.tokens && !endpoint.includes('/token/')) {
            // Check if access token is expired
            if (Date.now() / 1000 > this.tokens.access_expires) {
                await this.refreshToken();
            }
            (headers as any)['Authorization'] = `Bearer ${this.tokens.access}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GoCardless API Error (${response.status}): ${errorText}`);
        }

        return response.json();
    }

    async getAccessToken(): Promise<TokenSet> {
        const response = await fetch(`${BASE_URL}/token/new/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret_id: this.config.secretId,
                secret_key: this.config.secretKey,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get access token');
        }

        const data = await response.json();
        this.tokens = {
            access: data.access,
            access_expires: Date.now() / 1000 + data.access_expires,
            refresh: data.refresh,
            refresh_expires: Date.now() / 1000 + data.refresh_expires,
        };

        return this.tokens!;
    }

    async refreshToken() {
        if (!this.tokens?.refresh) {
            return this.getAccessToken();
        }

        const response = await fetch(`${BASE_URL}/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: this.tokens.refresh }),
        });

        if (!response.ok) {
            // If refresh fails, try getting a new token
            return this.getAccessToken();
        }

        const data = await response.json();
        this.tokens.access = data.access;
        this.tokens.access_expires = Date.now() / 1000 + data.access_expires;
    }

    async createRequisition(redirectUrl: string, reference: string, institutionId: string) {
        return this.request('/requisitions/', {
            method: 'POST',
            body: JSON.stringify({
                redirect: redirectUrl,
                reference: reference,
                institution_id: institutionId,
            }),
        });
    }

    async getRequisition(id: string) {
        return this.request(`/requisitions/${id}/`);
    }

    async getAccountDetails(id: string) {
        return this.request(`/accounts/${id}/details/`);
    }

    async getTransactions(id: string, dateFrom?: string, dateTo?: string) {
        const params = new URLSearchParams();
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);

        return this.request(`/accounts/${id}/transactions/?${params.toString()}`);
    }

    async getBanks(country: string = 'GB') {
        return this.request(`/institutions/?country=${country}`);
    }
}
