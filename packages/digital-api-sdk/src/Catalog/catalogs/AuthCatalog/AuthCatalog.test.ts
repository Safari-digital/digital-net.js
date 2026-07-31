import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../../../HttpClient';
import {
    AuthCatalog,
    DN_API_AUTH_USER_IS_LOCKED,
    DN_API_AUTH_USER_LOGIN,
    DN_API_AUTH_USER_LOGOUT,
    DN_API_AUTH_USER_LOGOUT_ALL,
} from './AuthCatalog';

const BASE_URL = 'https://api.example.test';

function resultResponse(value: unknown, status = 200): Response {
    return new Response(JSON.stringify({ value, hasError: false, errors: [], infos: [] }), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function callOf(fetchMock: ReturnType<typeof vi.fn>, index: number): { url: string; init: RequestInit } {
    const [input, init] = fetchMock.mock.calls[index] as [RequestInfo | URL, RequestInit | undefined];
    return { url: String(input), init: init ?? {} };
}

describe('AuthCatalog', () => {
    let catalog: AuthCatalog;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        catalog = new AuthCatalog(new HttpClient({ baseUrl: BASE_URL }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('no longer exposes a refresh method', () => {
        expect((catalog as unknown as Record<string, unknown>).refresh).toBeUndefined();
    });

    describe('login()', () => {
        it('posts the payload with the cookie policy that carries the session back', async () => {
            fetchMock.mockResolvedValueOnce(resultResponse(null));

            const result = await catalog.login({ login: 'alice', password: 'pwd' });

            const { url, init } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/${DN_API_AUTH_USER_LOGIN}`);
            expect(init.method).toBe('POST');
            expect(init.credentials).toBe('include');
            expect(result.hasError).toBe(false);
        });

        it('returns no user — the identity comes from user/self', async () => {
            fetchMock.mockResolvedValueOnce(resultResponse(null));

            const result = await catalog.login({ login: 'alice', password: 'pwd' });

            expect(result.value).toBeNull();
        });

        it('never writes to localStorage — the session lives in an HttpOnly cookie', async () => {
            const setItem = vi.fn();
            vi.stubGlobal('localStorage', { getItem: () => null, setItem, removeItem: vi.fn() });
            fetchMock.mockResolvedValueOnce(resultResponse(null));

            await catalog.login({ login: 'alice', password: 'pwd' });

            expect(setItem).not.toHaveBeenCalled();
        });

        it('reports a 401 through onStatus without throwing', async () => {
            fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
            const onUnauthorized = vi.fn();

            const result = await catalog.login(
                { login: 'alice', password: 'wrong' },
                { onStatus: { 401: onUnauthorized } }
            );

            expect(onUnauthorized).toHaveBeenCalledTimes(1);
            expect(result.hasError).toBe(true);
        });
    });

    describe('logout()', () => {
        it('posts to the logout route with the cookie attached', async () => {
            fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

            await catalog.logout();

            const { url, init } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/${DN_API_AUTH_USER_LOGOUT}`);
            expect(init.method).toBe('POST');
            expect(init.credentials).toBe('include');
        });
    });

    describe('logoutAll()', () => {
        it('posts to the logout-all route', async () => {
            fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

            await catalog.logoutAll();

            expect(callOf(fetchMock, 0).url).toBe(`${BASE_URL}/${DN_API_AUTH_USER_LOGOUT_ALL}`);
        });
    });

    describe('isLocked()', () => {
        it('gets the public route without credentials headers', async () => {
            fetchMock.mockResolvedValueOnce(resultResponse(true));

            const result = await catalog.isLocked();

            const { url, init } = callOf(fetchMock, 0);
            expect(url).toBe(`${BASE_URL}/${DN_API_AUTH_USER_IS_LOCKED}`);
            expect(init.method).toBe('GET');
            expect(result.value).toBe(true);
        });
    });
});
