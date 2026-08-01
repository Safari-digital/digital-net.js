import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../HttpClient';
import type { Result } from '../Result';
import { CatalogRunner } from './CatalogRunner';

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

function createLocalStorageStub(): Storage {
    const store = new Map<string, string>();
    return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, String(value)),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
        key: (index: number): string | null => Array.from(store.keys())[index] ?? null,
        get length(): number {
            return store.size;
        },
    };
}

function ok<T>(value: T): Result<T> {
    return { value, hasError: false, errors: [], infos: [] };
}

function err<T>(messages: { code?: string; reference?: string; message?: string }[]): Result<T> {
    return { value: null as T, hasError: true, errors: messages, infos: [] };
}

describe('CatalogRunner.run', () => {
    let client: HttpClient;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.stubGlobal('localStorage', createLocalStorageStub());
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        client = new HttpClient({ baseUrl: BASE_URL });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('returns the parsed Result and calls onSuccess with result.value on 2xx', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(ok('bearer-tok')));
        const onSuccess = vi.fn();

        const result = await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'authentication/user/login' },
            { onSuccess }
        );

        expect(result.hasError).toBe(false);
        expect(result.value).toBe('bearer-tok');
        expect(onSuccess).toHaveBeenCalledWith('bearer-tok');
    });

    it('synthesizes an empty success Result on 204 No Content', async () => {
        fetchMock.mockResolvedValueOnce(emptyResponse(204));
        const onSuccess = vi.fn();

        const result = await CatalogRunner.run<null>(
            client,
            { method: 'POST', path: 'authentication/user/logout' },
            { onSuccess }
        );

        expect(result.hasError).toBe(false);
        expect(result.value).toBeNull();
        expect(result.errors).toEqual([]);
        expect(onSuccess).toHaveBeenCalledWith(null);
    });

    it('preserves a non-Result raw string value on 200', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse('plain-string-not-a-result'));
        const onSuccess = vi.fn();

        const result = await CatalogRunner.run<string>(client, { method: 'GET', path: 'foo' }, { onSuccess });

        expect(result.hasError).toBe(false);
        expect(result.value).toBe('plain-string-not-a-result');
        expect(onSuccess).toHaveBeenCalledWith('plain-string-not-a-result');
    });

    it('preserves a non-Result raw object value on 200', async () => {
        const payload = { id: 1, name: 'Alice' };
        fetchMock.mockResolvedValueOnce(jsonResponse(payload));
        const onSuccess = vi.fn();

        const result = await CatalogRunner.run<{ id: number; name: string }>(
            client,
            { method: 'GET', path: 'user/self' },
            { onSuccess }
        );

        expect(result.hasError).toBe(false);
        expect(result.value).toEqual(payload);
        expect(onSuccess).toHaveBeenCalledWith(payload);
    });

    it('does not throw on 4xx: returns the server Result and dispatches onError', async () => {
        const serverResult = err<string>([
            { reference: 'INVALID_CREDENTIALS_EXCEPTION', message: 'Invalid credentials' },
        ]);
        fetchMock.mockResolvedValueOnce(jsonResponse(serverResult, 401));
        const onError = vi.fn();
        const onSuccess = vi.fn();

        const result = await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'authentication/user/login' },
            { onError, onSuccess }
        );

        expect(result.hasError).toBe(true);
        expect(result.errors).toHaveLength(1);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toMatchObject({
            status: 401,
            result: serverResult,
        });
    });

    it('dispatches onReference for each matching ResultMessage.reference', async () => {
        const serverResult = err<string>([
            { reference: 'INVALID_CREDENTIALS_EXCEPTION', message: 'A' },
            { reference: 'TOO_MANY_ATTEMPTS_EXCEPTION', message: 'B' },
            { reference: 'INVALID_CREDENTIALS_EXCEPTION', message: 'C' },
        ]);
        fetchMock.mockResolvedValueOnce(jsonResponse(serverResult, 401));

        const onInvalid = vi.fn();
        const onTooMany = vi.fn();
        const onUnused = vi.fn();

        await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'authentication/user/login' },
            {
                onReference: {
                    INVALID_CREDENTIALS_EXCEPTION: onInvalid,
                    TOO_MANY_ATTEMPTS_EXCEPTION: onTooMany,
                    SOMETHING_ELSE: onUnused,
                },
            }
        );

        expect(onInvalid).toHaveBeenCalledTimes(2);
        expect(onTooMany).toHaveBeenCalledTimes(1);
        expect(onUnused).not.toHaveBeenCalled();
    });

    it('dispatches onStatus for the matching HTTP status code', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(err<string>([{ message: 'rate limited' }]), 429));
        const on429 = vi.fn();
        const on401 = vi.fn();
        const onError = vi.fn();

        await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'authentication/user/login' },
            { onStatus: { 429: on429, 401: on401 }, onError }
        );

        expect(on429).toHaveBeenCalledTimes(1);
        expect(on401).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it('handles a Result with hasError=true on a 200 response (server-side soft error)', async () => {
        const serverResult = err<string>([{ reference: 'BUSINESS_RULE', message: 'nope' }]);
        fetchMock.mockResolvedValueOnce(jsonResponse(serverResult, 200));
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onReference = vi.fn();

        const result = await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'authentication/user/login' },
            { onSuccess, onError, onReference: { BUSINESS_RULE: onReference } }
        );

        expect(result.hasError).toBe(true);
        expect(onSuccess).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onReference).toHaveBeenCalledTimes(1);
    });

    it('returns a synthetic error Result when the server returns a 4xx without a body', async () => {
        fetchMock.mockResolvedValueOnce(emptyResponse(500));
        const onError = vi.fn();

        const result = await CatalogRunner.run<string>(client, { method: 'GET', path: 'admin/user' }, { onError });

        expect(result.hasError).toBe(true);
        expect(result.errors[0].message).toBe('HTTP 500');
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toMatchObject({ status: 500, result: null });
    });

    it('rethrows non-HttpClientError errors (network failure)', async () => {
        const networkError = new Error('ECONNREFUSED');
        fetchMock.mockRejectedValueOnce(networkError);
        const onError = vi.fn();

        await expect(
            CatalogRunner.run<string>(client, { method: 'GET', path: 'admin/user' }, { onError })
        ).rejects.toBe(networkError);

        expect(onError).not.toHaveBeenCalled();
    });

    it('invokes onReference, onStatus and onError together on a single error', async () => {
        const serverResult = err<string>([{ reference: 'INVALID_CREDENTIALS_EXCEPTION', message: 'bad' }]);
        fetchMock.mockResolvedValueOnce(jsonResponse(serverResult, 401));

        const calls: string[] = [];
        const onReference = vi.fn(() => {
            calls.push('reference');
        });
        const onStatus = vi.fn(() => {
            calls.push('status');
        });
        const onError = vi.fn(() => {
            calls.push('error');
        });

        await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'authentication/user/login' },
            {
                onReference: { INVALID_CREDENTIALS_EXCEPTION: onReference },
                onStatus: { 401: onStatus },
                onError,
            }
        );

        expect(calls).toEqual(['reference', 'status', 'error']);
    });

    it('verifies the error path with HttpClientError.data is properly surfaced', async () => {
        const data = { hasError: true, errors: [{ message: 'oops' }], infos: [], value: null };
        fetchMock.mockResolvedValueOnce(jsonResponse(data, 400));

        const result = await CatalogRunner.run<string>(client, { method: 'POST', path: 'admin/user' });

        expect(result.hasError).toBe(true);
        expect(result.errors[0].message).toBe('oops');
    });

    it('throws when fetch yields a non-HttpClientError instance (sanity check)', async () => {
        // Defensive: confirm run() does not silently swallow random throwables.
        fetchMock.mockImplementation(() => {
            throw new TypeError('boom');
        });

        await expect(CatalogRunner.run<string>(client, { method: 'GET', path: 'admin/user' })).rejects.toBeInstanceOf(
            TypeError
        );
    });

    it('does not call onReference if no reference matches in the result errors', async () => {
        const serverResult = err<string>([{ message: 'no reference here' }]);
        fetchMock.mockResolvedValueOnce(jsonResponse(serverResult, 400));
        const onReference = vi.fn();
        const onError = vi.fn();

        await CatalogRunner.run<string>(
            client,
            { method: 'POST', path: 'admin/user' },
            { onReference: { ANY_REFERENCE: onReference }, onError }
        );

        expect(onReference).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
    });

    describe('callback isolation', () => {
        let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

        beforeEach(() => {
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
            consoleErrorSpy.mockRestore();
        });

        it('continues dispatching when an onReference handler throws', async () => {
            const serverResult = err<string>([
                { reference: 'REF_A', message: 'A' },
                { reference: 'REF_B', message: 'B' },
            ]);
            fetchMock.mockResolvedValueOnce(jsonResponse(serverResult, 400));

            const onRefA = vi.fn(() => {
                throw new Error('boom');
            });
            const onRefB = vi.fn();

            await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'admin/user' },
                { onReference: { REF_A: onRefA, REF_B: onRefB } }
            );

            expect(onRefA).toHaveBeenCalledTimes(1);
            expect(onRefB).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('calls onError even when onStatus throws', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(err<string>([{ message: 'x' }]), 401));

            const onStatus = vi.fn(() => {
                throw new Error('boom');
            });
            const onError = vi.fn();

            await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'admin/user' },
                { onStatus: { 401: onStatus }, onError }
            );

            expect(onStatus).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('does not crash run() when onError throws', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(err<string>([{ message: 'x' }]), 500));

            const onError = vi.fn(() => {
                throw new Error('boom');
            });

            const result = await CatalogRunner.run<string>(client, { method: 'GET', path: 'admin/user' }, { onError });

            expect(result.hasError).toBe(true);
            expect(onError).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('does not crash run() when onSuccess throws', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(ok('bearer-tok')));

            const onSuccess = vi.fn(() => {
                throw new Error('boom');
            });

            const result = await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'authentication/user/login' },
                { onSuccess }
            );

            expect(result.hasError).toBe(false);
            expect(result.value).toBe('bearer-tok');
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    describe('hook forwarding (onRequest / onResponse)', () => {
        it('forwards a catalog-only onRequest to the underlying http request', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(ok('tok')));
            const onRequest = vi.fn(cfg => ({
                ...cfg,
                headers: { ...cfg.headers, 'X-Catalog': '1' },
            }));

            await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'authentication/user/login' },
                { onRequest }
            );

            expect(onRequest).toHaveBeenCalledTimes(1);
            const init = fetchMock.mock.calls[0][1] as RequestInit;
            const headers = init.headers as Record<string, string>;
            expect(headers['X-Catalog']).toBe('1');
        });

        it('forwards a catalog-only onResponse to the underlying http request', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(ok('tok')));
            const onResponse = vi.fn();

            await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'authentication/user/login' },
                { onResponse }
            );

            expect(onResponse).toHaveBeenCalledTimes(1);
            const response = onResponse.mock.calls[0][0];
            expect(response).toMatchObject({ status: 200, ok: true });
        });

        it('composes onRequest: catalog runs first, request runs second (last-write-wins)', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(ok('tok')));
            const callOrder: string[] = [];

            const catalogOnRequest = vi.fn(cfg => {
                callOrder.push('catalog');
                return { ...cfg, headers: { ...cfg.headers, 'X-Catalog': 'yes', 'X-Shared': 'catalog' } };
            });
            const requestOnRequest = vi.fn(cfg => {
                callOrder.push('request');
                return { ...cfg, headers: { ...cfg.headers, 'X-Request': 'yes', 'X-Shared': 'request' } };
            });

            await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'authentication/user/login', onRequest: requestOnRequest },
                { onRequest: catalogOnRequest }
            );

            expect(callOrder).toEqual(['catalog', 'request']);

            const init = fetchMock.mock.calls[0][1] as RequestInit;
            const headers = init.headers as Record<string, string>;
            expect(headers['X-Catalog']).toBe('yes');
            expect(headers['X-Request']).toBe('yes');
            expect(headers['X-Shared']).toBe('request'); // last-write-wins
        });

        it('composes onResponse in the same catalog → request order', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(ok('tok')));
            const callOrder: string[] = [];

            const catalogOnResponse = vi.fn(() => {
                callOrder.push('catalog');
            });
            const requestOnResponse = vi.fn(() => {
                callOrder.push('request');
            });

            await CatalogRunner.run<string>(
                client,
                { method: 'POST', path: 'authentication/user/login', onResponse: requestOnResponse },
                { onResponse: catalogOnResponse }
            );

            expect(callOrder).toEqual(['catalog', 'request']);
        });

        it('passes the request-level hook through untouched when no catalog hook is set', async () => {
            fetchMock.mockResolvedValueOnce(jsonResponse(ok('tok')));
            const requestOnRequest = vi.fn(cfg => ({ ...cfg, headers: { ...cfg.headers, 'X-Only': '1' } }));

            await CatalogRunner.run<string>(client, {
                method: 'POST',
                path: 'authentication/user/login',
                onRequest: requestOnRequest,
            });

            expect(requestOnRequest).toHaveBeenCalledTimes(1);
            const init = fetchMock.mock.calls[0][1] as RequestInit;
            const headers = init.headers as Record<string, string>;
            expect(headers['X-Only']).toBe('1');
        });
    });
});
