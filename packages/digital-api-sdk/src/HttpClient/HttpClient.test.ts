import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from './HttpClient';
import { HttpClientError } from './HttpClientError';
import {
    DN_API_KEY_HEADER,
    DN_APPLICATION_KEY_HEADER,
    DN_REQUESTED_WITH_HEADER,
    DN_REQUESTED_WITH_VALUE,
} from './constants';

const BASE_URL = 'https://api.example.test';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function emptyResponse(status: number): Response {
    return new Response(null, { status });
}

function callOf(fetchMock: ReturnType<typeof vi.fn>, index: number): { url: string; init: RequestInit } {
    const [input, init] = fetchMock.mock.calls[index] as [RequestInfo | URL, RequestInit | undefined];
    return { url: String(input), init: init ?? {} };
}

function headersOf(fetchMock: ReturnType<typeof vi.fn>, index: number): Record<string, string> {
    return callOf(fetchMock, index).init.headers as Record<string, string>;
}

describe('HttpClient', () => {
    let client: HttpClient;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        client = new HttpClient({ baseUrl: BASE_URL });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    describe('request()', () => {
        it('performs a basic GET and returns data/status/ok', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1, name: 'Alice' }));
            const response = await client.request<{ id: number; name: string }>({
                path: 'user/self',
                method: 'GET',
            });

            expect(response.status).toBe(200);
            expect(response.ok).toBe(true);
            expect(response.data).toEqual({ id: 1, name: 'Alice' });

            const { url, init } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/user/self`);
            expect(init.method).toBe('GET');
        });

        it('never sends an Authorization header', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await client.request({ path: 'user/self', method: 'GET' });

            expect(headersOf(fetchMock, 0)['Authorization']).toBeUndefined();
        });

        it('resolves slugs in the URL', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await client.request({
                path: 'user/:id/avatar',
                method: 'GET',
                slugs: { id: 42 },
            });

            const { url } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/user/42/avatar`);
        });

        it('appends params as query string', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await client.request({
                path: 'admin/user',
                method: 'GET',
                params: { isActive: true, search: 'foo bar' },
            });

            const { url } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/admin/user?isActive=true&search=foo%20bar`);
        });

        it('JSON-stringifies an object body and sends application/json', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await client.request<unknown, { login: string; password: string }>({
                path: 'authentication/user/login',
                method: 'POST',
                body: { login: 'alice', password: 'pwd' },
            });

            const { init } = callOf(fetchMock, 0);
            expect(headersOf(fetchMock, 0)['Content-Type']).toBe('application/json');
            expect(init.body).toBe('{"login":"alice","password":"pwd"}');
        });

        it('does not stringify FormData and removes Content-Type', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));
            const form = new FormData();
            form.append('file', new Blob(['hello']), 'hello.txt');

            await client.request({
                path: 'user/self/avatar',
                method: 'PUT',
                body: form,
            });

            const { init } = callOf(fetchMock, 0);
            expect(headersOf(fetchMock, 0)['Content-Type']).toBeUndefined();
            expect(init.body).toBe(form);
        });

        it('returns null data on 204 No Content', async () => {
            fetchMock.mockResolvedValueOnce(emptyResponse(204));

            const response = await client.request<null>({
                path: 'authentication/user/logout',
                method: 'POST',
            });

            expect(response.status).toBe(204);
            expect(response.data).toBeNull();
        });

        it('throws HttpClientError with status and data when response is not ok', async () => {
            fetchMock
                .mockResolvedValueOnce(jsonResponse({ errors: ['nope'] }, 400))
                .mockResolvedValueOnce(jsonResponse({ errors: ['nope'] }, 400));

            await expect(client.request({ path: 'admin/user', method: 'POST' })).rejects.toMatchObject({
                status: 400,
                data: { errors: ['nope'] },
            });

            await expect(client.request({ path: 'admin/user', method: 'POST' })).rejects.toBeInstanceOf(
                HttpClientError
            );
        });
    });

    describe('session cookie transport', () => {
        it('sends credentials: include by default — this is what carries the session', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));
            await client.request({ path: 'user/self', method: 'GET' });
            expect(callOf(fetchMock, 0).init.credentials).toBe('include');
        });

        it('honours an explicit credentials override', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));
            await client.request({ path: 'ping', method: 'GET', credentials: 'omit' });
            expect(callOf(fetchMock, 0).init.credentials).toBe('omit');
        });

        it('does not retry on 401 — there is nothing left to refresh', async () => {
            fetchMock.mockResolvedValueOnce(emptyResponse(401));

            await expect(client.request({ path: 'user/self', method: 'GET' })).rejects.toBeInstanceOf(HttpClientError);

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('CSRF header', () => {
        it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const)('is sent on %s', async method => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await client.request({ path: 'user/self', method });

            expect(headersOf(fetchMock, 0)[DN_REQUESTED_WITH_HEADER]).toBe(DN_REQUESTED_WITH_VALUE);
        });

        it('is sent even under skipAuth — it marks the transport, it is not a credential', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await client.request({ path: 'authentication/user/login', method: 'POST', skipAuth: true });

            expect(headersOf(fetchMock, 0)[DN_REQUESTED_WITH_HEADER]).toBe(DN_REQUESTED_WITH_VALUE);
        });
    });

    describe('API key authentication', () => {
        const API_KEY = 'KEY-XYZ-123';

        it('sends the API key header instead of relying on the cookie', async () => {
            const apiKeyClient = new HttpClient({ baseUrl: BASE_URL, apiKey: API_KEY });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await apiKeyClient.request({ path: 'user/self', method: 'GET' });

            const headers = headersOf(fetchMock, 0);
            expect(headers[DN_API_KEY_HEADER]).toBe(API_KEY);
            expect(headers['Authorization']).toBeUndefined();
        });

        it('omits the API key header when skipAuth is true', async () => {
            const apiKeyClient = new HttpClient({ baseUrl: BASE_URL, apiKey: API_KEY });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await apiKeyClient.request({ path: 'ping', method: 'GET', skipAuth: true });

            expect(headersOf(fetchMock, 0)[DN_API_KEY_HEADER]).toBeUndefined();
        });

        it('throws HttpClientError on 401 without retrying', async () => {
            const apiKeyClient = new HttpClient({ baseUrl: BASE_URL, apiKey: API_KEY });
            fetchMock.mockResolvedValueOnce(emptyResponse(401));

            await expect(apiKeyClient.request({ path: 'user/self', method: 'GET' })).rejects.toBeInstanceOf(
                HttpClientError
            );

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('application key authentication', () => {
        it('sends the application key header when applicationKeyAuth is enabled', async () => {
            const appClient = new HttpClient({
                baseUrl: BASE_URL,
                applicationKey: 'app-secret',
                applicationKeyAuth: true,
            });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await appClient.request({ path: 'cms/pages', method: 'GET' });

            expect(headersOf(fetchMock, 0)[DN_APPLICATION_KEY_HEADER]).toBe('app-secret');
        });

        it('does not send it when applicationKeyAuth is off', async () => {
            const appClient = new HttpClient({ baseUrl: BASE_URL, applicationKey: 'app-secret' });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await appClient.request({ path: 'cms/pages', method: 'GET' });

            expect(headersOf(fetchMock, 0)[DN_APPLICATION_KEY_HEADER]).toBeUndefined();
        });

        it('does not send it when no application key is configured', async () => {
            const appClient = new HttpClient({ baseUrl: BASE_URL, applicationKeyAuth: true });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await appClient.request({ path: 'cms/pages', method: 'GET' });

            expect(headersOf(fetchMock, 0)[DN_APPLICATION_KEY_HEADER]).toBeUndefined();
        });

        it('never prefixes the application key header', async () => {
            const appClient = new HttpClient({
                baseUrl: BASE_URL,
                applicationKey: 'app-secret',
                applicationKeyAuth: true,
                keyPrefix: 'TENANT_',
            });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await appClient.request({ path: 'cms/pages', method: 'GET' });

            const headers = headersOf(fetchMock, 0);
            expect(headers[DN_APPLICATION_KEY_HEADER]).toBe('app-secret');
            expect(headers[`TENANT_${DN_APPLICATION_KEY_HEADER}`]).toBeUndefined();
        });

        it('is removed by skipAuth', async () => {
            const appClient = new HttpClient({
                baseUrl: BASE_URL,
                applicationKey: 'app-secret',
                applicationKeyAuth: true,
            });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await appClient.request({ path: 'ping', method: 'GET', skipAuth: true });

            expect(headersOf(fetchMock, 0)[DN_APPLICATION_KEY_HEADER]).toBeUndefined();
        });
    });

    describe('keyPrefix', () => {
        it('sends the API key under the prefixed header name', async () => {
            const prefixed = new HttpClient({ baseUrl: BASE_URL, apiKey: 'key-123', keyPrefix: 'TENANT_' });
            fetchMock.mockResolvedValueOnce(jsonResponse({}));

            await prefixed.request({ path: 'user/self', method: 'GET' });

            const headers = headersOf(fetchMock, 0);
            expect(headers[`TENANT_${DN_API_KEY_HEADER}`]).toBe('key-123');
            expect(headers[DN_API_KEY_HEADER]).toBeUndefined();
        });
    });

    describe('auth error event', () => {
        it('emits on a 401 so consumers can drop their user state', async () => {
            const listener = vi.fn();
            client.subscribeAuthErrorEvent(listener);
            fetchMock.mockResolvedValueOnce(emptyResponse(401));

            await expect(client.request({ path: 'user/self', method: 'GET' })).rejects.toBeInstanceOf(HttpClientError);

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it('does not emit on a 401 from a skipAuth request', async () => {
            const listener = vi.fn();
            client.subscribeAuthErrorEvent(listener);
            fetchMock.mockResolvedValueOnce(emptyResponse(401));

            await expect(
                client.request({ path: 'authentication/user/login', method: 'POST', skipAuth: true })
            ).rejects.toBeInstanceOf(HttpClientError);

            expect(listener).not.toHaveBeenCalled();
        });

        it('does not emit on other error statuses', async () => {
            const listener = vi.fn();
            client.subscribeAuthErrorEvent(listener);
            fetchMock.mockResolvedValueOnce(emptyResponse(403));

            await expect(client.request({ path: 'admin/user', method: 'POST' })).rejects.toBeInstanceOf(
                HttpClientError
            );

            expect(listener).not.toHaveBeenCalled();
        });

        it('stops emitting once unsubscribed', async () => {
            const listener = vi.fn();
            const unsubscribe = client.subscribeAuthErrorEvent(listener);
            unsubscribe();
            fetchMock.mockResolvedValueOnce(emptyResponse(401));

            await expect(client.request({ path: 'user/self', method: 'GET' })).rejects.toBeInstanceOf(HttpClientError);

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('onRequest / onResponse hooks', () => {
        it('calls onRequest before fetch and uses the returned config', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
            const onRequest = vi.fn(cfg => ({
                ...cfg,
                headers: { ...cfg.headers, 'X-Trace': 'abc' },
            }));

            await client.request({ path: 'user/self', method: 'GET', onRequest });

            expect(onRequest).toHaveBeenCalledTimes(1);
            expect(headersOf(fetchMock, 0)['X-Trace']).toBe('abc');
        });

        it('onRequest hook can mutate path, slugs and params', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
            const onRequest = vi.fn(cfg => ({
                ...cfg,
                path: 'user/:id',
                slugs: { id: 99 },
                params: { q: 'abc' },
            }));

            await client.request({ path: 'placeholder', method: 'GET', onRequest });

            const { url } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/user/99?q=abc`);
        });

        it('onRequest hook returning a Promise is awaited', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
            const onRequest = vi.fn(async cfg => {
                await new Promise<void>(r => setTimeout(r, 5));
                return { ...cfg, headers: { ...cfg.headers, 'X-Async': '1' } };
            });

            await client.request({ path: 'user/self', method: 'GET', onRequest });

            expect(headersOf(fetchMock, 0)['X-Async']).toBe('1');
        });

        it('calls onResponse with the deserialized response on success', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }));
            const onResponse = vi.fn();

            await client.request({ path: 'user/self', method: 'GET', onResponse });

            expect(onResponse).toHaveBeenCalledTimes(1);
            const response = onResponse.mock.calls[0][0];
            expect(response).toMatchObject({ status: 200, ok: true, data: { id: 1 } });
        });

        it('calls onResponse on 4xx before throwing', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'nope' }, 400));
            const onResponse = vi.fn();

            await expect(client.request({ path: 'admin/user', method: 'POST', onResponse })).rejects.toBeInstanceOf(
                HttpClientError
            );

            expect(onResponse).toHaveBeenCalledTimes(1);
            const response = onResponse.mock.calls[0][0];
            expect(response).toMatchObject({ status: 400, ok: false });
            expect(response.data).toEqual({ error: 'nope' });
        });

        it('runs hooks exactly once per request', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ id: 1 }));
            const onRequest = vi.fn(cfg => cfg);
            const onResponse = vi.fn();

            await client.request({ path: 'user/self', method: 'GET', onRequest, onResponse });

            expect(onRequest).toHaveBeenCalledTimes(1);
            expect(onResponse).toHaveBeenCalledTimes(1);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('propagates exceptions thrown by onResponse', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
            const onResponse = vi.fn(() => {
                throw new Error('instrumentation broke');
            });

            await expect(client.request({ path: 'user/self', method: 'GET', onResponse })).rejects.toThrow(
                'instrumentation broke'
            );
        });

        it('propagates exceptions thrown by onRequest', async () => {
            const onRequest = vi.fn(() => {
                throw new Error('config broke');
            });

            await expect(client.request({ path: 'user/self', method: 'GET', onRequest })).rejects.toThrow(
                'config broke'
            );

            expect(fetchMock).not.toHaveBeenCalled();
        });
    });
});
