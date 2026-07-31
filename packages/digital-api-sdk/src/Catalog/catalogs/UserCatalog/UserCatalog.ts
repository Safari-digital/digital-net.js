import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { UserDto } from '../../../Dto';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import type { UpdatePasswordPayload, UpdateIsActive, UpdateIsAdmin } from './types';

export const DN_API_USER_BY_ID = 'user/:id' as const;
export const DN_API_USER_SELF = 'user/self' as const;
export const DN_API_USER_SELF_IS_ADMIN = 'user/self/is-admin' as const;
export const DN_API_USER_SELF_PASSWORD = 'user/self/password' as const;
export const DN_API_USER_SELF_AVATAR = 'user/self/avatar' as const;
export const DN_API_USER_AVATAR_BY_ID = 'user/:id/avatar' as const;
export const DN_API_ADMIN_UPDATE_USER_STATUS = 'user/:id/status' as const;
export const DN_API_ADMIN_UPDATE_USER_ROLE = 'user/:id/role' as const;

export class UserCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** GET `user/self/is-admin` */
    public async isSelfAdmin(options: CatalogCallbacks<boolean> = {}): Promise<Result<boolean>> {
        return CatalogRunner.run<boolean>(this.http, { path: DN_API_USER_SELF_IS_ADMIN }, options);
    }

    /** GET `user/:id` */
    public async getById(id: string, options: CatalogCallbacks<UserDto> = {}): Promise<Result<UserDto>> {
        return CatalogRunner.run<UserDto>(this.http, { path: DN_API_USER_BY_ID, slugs: { id } }, options);
    }

    /** GET `user/self` */
    public async getSelf(options: CatalogCallbacks<UserDto> = {}): Promise<Result<UserDto>> {
        return CatalogRunner.run<UserDto>(this.http, { path: DN_API_USER_SELF }, options);
    }

    /** PUT `user/self/password` */
    public async updatePassword(payload: UpdatePasswordPayload, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            { method: 'PUT', path: DN_API_USER_SELF_PASSWORD, body: payload },
            options
        );
    }

    /** PUT `user/self/avatar` — body = FormData with 'avatar' field */
    public async updateAvatar(file: Blob | File, options: CatalogCallbacks<null> = {}): Promise<Result> {
        const form = new FormData();
        form.append('avatar', file);
        return CatalogRunner.run<null>(
            this.http,
            { method: 'PUT', path: DN_API_USER_SELF_AVATAR, body: form },
            options
        );
    }

    /** DELETE `user/self/avatar` */
    public async removeAvatar(options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(this.http, { method: 'DELETE', path: DN_API_USER_SELF_AVATAR }, options);
    }

    /** GET `user/:id/avatar` — binary response (image/*) */
    public async getUserAvatar(id: string, options: CatalogCallbacks<Blob> = {}): Promise<Result<Blob>> {
        return CatalogRunner.run<Blob>(this.http, { path: DN_API_USER_AVATAR_BY_ID, slugs: { id } }, options);
    }

    /** PUT `user/:id/role` */
    public async updateUserRole(body: UpdateIsAdmin, id: string, options: CatalogCallbacks = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PUT',
                path: DN_API_ADMIN_UPDATE_USER_ROLE,
                body,
                slugs: { id },
            },
            options
        );
    }

    /** PUT `user/:id/status` */
    public async updateUserStatus(body: UpdateIsActive, id: string, options: CatalogCallbacks = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PUT',
                path: DN_API_ADMIN_UPDATE_USER_STATUS,
                body,
                slugs: { id },
            },
            options
        );
    }

    /** DELETE `user/:id` — Requires admin's password — 401 if wrong, 403 if target is admin */
    public async deleteById(id: string, password: string, options: CatalogCallbacks = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'DELETE',
                path: DN_API_USER_BY_ID,
                slugs: { id },
                body: { password },
            },
            options
        );
    }
}
