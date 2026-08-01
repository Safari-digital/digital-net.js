import { DigitalEvent, URLResolver } from '@digital-net-org/digital-core';
import { HttpClientError } from './HttpClientError';
import { HttpSerializer } from './HttpSerializer';
import {
    DN_API_KEY_HEADER,
    DN_APPLICATION_KEY_HEADER,
    DN_CLIENT_ID_HEADER,
    DN_DEFAULT_HEADERS,
    DN_REQUESTED_WITH_HEADER,
    DN_REQUESTED_WITH_VALUE,
} from './constants';
import type { HttpClientConfig, HttpRequestConfig, HttpResponse } from './types';

export class HttpClient {
    private readonly baseUrl: string;
    private readonly apiKey?: string;
    private readonly applicationKey?: string;
    private readonly applicationKeyAuth: boolean;
    private readonly apiKeyHeader: string;
    private readonly clientId: string = HttpClient.generateClientId();

    private readonly authErrorEvent: DigitalEvent<void> = new DigitalEvent();

    public constructor(config: HttpClientConfig) {
        this.baseUrl = config.baseUrl;
        this.apiKey = config.apiKey;
        this.applicationKey = config.applicationKey;
        this.applicationKeyAuth = config.applicationKeyAuth ?? false;
        this.apiKeyHeader = (config.keyPrefix ?? '') + DN_API_KEY_HEADER;
    }

    public getBaseUrl(): string {
        return this.baseUrl;
    }

    /** The shared application key, if configured. Sent raw (no `keyPrefix`) by consumers like the SSE stream. */
    public getApplicationKey(): string | undefined {
        return this.applicationKey;
    }

    /** This client's per-tab id — compare against a mutation signal's `originClientId` to detect own echoes. */
    public getClientId(): string {
        return this.clientId;
    }

    private static generateClientId(): string {
        try {
            return globalThis.crypto.randomUUID();
        } catch {
            return `dn-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        }
    }

    /**
     * Sends a request and returns the deserialized response. Throws {@link HttpClientError} on any non-2xx
     * status; a 401 additionally emits the auth error event (see {@link subscribeAuthErrorEvent}).
     */
    public async request<T = any, B = any>(config: HttpRequestConfig<B>): Promise<HttpResponse<T>> {
        return this.doRequest<T, B>(config);
    }

    /** Fires whenever the API rejects an authenticated request. */
    public subscribeAuthErrorEvent(listener: () => void): () => void {
        return this.authErrorEvent.subscribe(listener);
    }

    private async doRequest<T = unknown, B = unknown>(config: HttpRequestConfig<B>): Promise<HttpResponse<T>> {
        const effectiveConfig = !config.skipHooks && config.onRequest ? await config.onRequest(config) : config;

        const url = this.resolveUrl(effectiveConfig.path, effectiveConfig.slugs, effectiveConfig.params);
        const headers = this.resolveHeaders(effectiveConfig);
        const body = HttpSerializer.serializeBody(effectiveConfig.body);

        const response = await fetch(url, {
            method: effectiveConfig.method ?? 'GET',
            headers,
            body,
            credentials: effectiveConfig.credentials ?? 'include',
            signal: effectiveConfig.signal,
        });

        const data = (await HttpSerializer.deserializeBody(response)) as T;
        const httpResponse: HttpResponse<T> = {
            data,
            status: response.status,
            headers: response.headers,
            ok: response.ok,
        };

        if (!effectiveConfig.skipHooks && effectiveConfig.onResponse) {
            await effectiveConfig.onResponse(httpResponse as HttpResponse<unknown>);
        }

        if (response.status === 401 && !effectiveConfig.skipAuth) {
            this.authErrorEvent.emit();
        }

        if (!response.ok) {
            throw new HttpClientError(response.status, data);
        }
        return httpResponse;
    }

    private resolveUrl(
        path: string,
        slugs?: Record<string, string | number>,
        params?: Record<string, unknown>
    ): string {
        const resolved = URLResolver.resolveSlugs(path, slugs ?? {});
        const full = URLResolver.resolve(this.baseUrl, resolved);
        return params ? URLResolver.buildQuery(full, params) : full;
    }

    private resolveHeaders<B>(config: HttpRequestConfig<B>): Record<string, string> {
        const headers: Record<string, string> = { ...DN_DEFAULT_HEADERS, ...(config.headers ?? {}) };
        headers[DN_CLIENT_ID_HEADER] = this.clientId;
        headers[DN_REQUESTED_WITH_HEADER] = DN_REQUESTED_WITH_VALUE;

        if (!config.skipAuth) {
            if (this.apiKey !== undefined) {
                headers[this.apiKeyHeader] = this.apiKey;
            }
            if (this.applicationKeyAuth && this.applicationKey !== undefined) {
                headers[DN_APPLICATION_KEY_HEADER] = this.applicationKey;
            }
        }
        if (config.body instanceof FormData || config.body instanceof Blob) {
            delete headers['Content-Type'];
        }
        return headers;
    }
}
