import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import type { LoginPayload } from './types';

export const DN_API_AUTH_USER_LOGIN = 'authentication/user/login' as const;
export const DN_API_AUTH_USER_IS_LOCKED = 'authentication/user/is-locked' as const;
export const DN_API_AUTH_USER_LOGOUT = 'authentication/user/logout' as const;
export const DN_API_AUTH_USER_LOGOUT_ALL = 'authentication/user/logout-all' as const;

export class AuthCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * POST `authentication/user/login` (public)
     *
     * On success the API sets the HttpOnly session cookie.
     */
    public async login(payload: LoginPayload, options: CatalogCallbacks<null> = {}): Promise<Result<null>> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'POST',
                path: DN_API_AUTH_USER_LOGIN,
                body: payload,
                skipAuth: true,
            },
            options
        );
    }

    /**
     * GET `authentication/user/is-locked` (public)
     *
     * Returns whether the caller's IP has reached the max login attempts threshold.
     * Intended as a pre-check from the UI to short-circuit login when already locked.
     */
    public async isLocked(options: CatalogCallbacks<boolean> = {}): Promise<Result<boolean>> {
        return CatalogRunner.run<boolean>(
            this.http,
            {
                method: 'GET',
                path: DN_API_AUTH_USER_IS_LOCKED,
                skipAuth: true,
            },
            options
        );
    }

    /**
     * POST `authentication/user/logout` (session required)
     *
     * Revokes the session server-side and clears the cookie.
     */
    public async logout(options: CatalogCallbacks<null> = {}): Promise<Result<null>> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'POST',
                path: DN_API_AUTH_USER_LOGOUT,
            },
            options
        );
    }

    /**
     * POST `authentication/user/logout-all` (session or ApiKey)
     *
     * Revokes every session of the account, on all devices.
     */
    public async logoutAll(options: CatalogCallbacks<null> = {}): Promise<Result<null>> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'POST',
                path: DN_API_AUTH_USER_LOGOUT_ALL,
            },
            options
        );
    }
}
