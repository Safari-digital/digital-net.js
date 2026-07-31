import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { ConfigValueDto } from '../../../Dto';
import type { JsonPatchOp } from '../../../JsonPatch';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import type { ConfigValuePayload } from './types';

export const DN_API_CONFIG_VALUE = 'admin/config-value' as const;
export const DN_API_CONFIG_VALUE_BY_ID = 'admin/config-value/:id' as const;

export class ConfigValueCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** GET `admin/config-value/:id` (admin) */
    public async getById(id: string, options: CatalogCallbacks<ConfigValueDto> = {}): Promise<Result<ConfigValueDto>> {
        return CatalogRunner.run<ConfigValueDto>(
            this.http,
            { path: DN_API_CONFIG_VALUE_BY_ID, slugs: { id } },
            options
        );
    }

    /** GET `admin/config-value` — paginated list (filter by `name`, …); `index` defaults to 1. (admin) */
    public async list(
        query: { name?: string; index?: number; size?: number } = {},
        options: CatalogCallbacks<ConfigValueDto[]> = {}
    ): Promise<Result<ConfigValueDto[]>> {
        const params: Record<string, unknown> = { index: query.index ?? 1, size: query.size ?? 50 };
        if (query.name) params.name = query.name;
        return CatalogRunner.run<ConfigValueDto[]>(this.http, { path: DN_API_CONFIG_VALUE, params }, options);
    }

    /** POST `admin/config-value` — body accepts `{ name, value?, type? }`. Returns the new id. (admin) */
    public async create(payload: ConfigValuePayload, options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(
            this.http,
            { method: 'POST', path: DN_API_CONFIG_VALUE, body: payload },
            options
        );
    }

    /** PATCH `admin/config-value/:id` — body = JSON Patch (RFC 6902) (admin) */
    public async update(id: string, ops: JsonPatchOp[], options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PATCH',
                path: DN_API_CONFIG_VALUE_BY_ID,
                slugs: { id },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }

    /** DELETE `admin/config-value/:id` (admin) */
    public async delete(id: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            { method: 'DELETE', path: DN_API_CONFIG_VALUE_BY_ID, slugs: { id } },
            options
        );
    }
}
