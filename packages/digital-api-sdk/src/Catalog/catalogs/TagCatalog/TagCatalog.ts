import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { TagDto } from '../../../Dto';
import type { JsonPatchOp } from '../../../JsonPatch';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import type { TagPayload } from './types';

export const DN_API_TAG = 'cms/tags' as const;
export const DN_API_TAG_BY_ID = 'cms/tags/:id' as const;

export class TagCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** GET `cms/tags/:id` */
    public async getById(id: string, options: CatalogCallbacks<TagDto> = {}): Promise<Result<TagDto>> {
        return CatalogRunner.run<TagDto>(this.http, { path: DN_API_TAG_BY_ID, slugs: { id } }, options);
    }

    /** POST `cms/tags` — body accepts `{ name, color? }`. Returns the new id. */
    public async create(payload: TagPayload, options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { method: 'POST', path: DN_API_TAG, body: payload }, options);
    }

    /** PATCH `cms/tags/:id` — body = JSON Patch (RFC 6902) */
    public async update(id: string, ops: JsonPatchOp[], options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PATCH',
                path: DN_API_TAG_BY_ID,
                slugs: { id },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }

    /** DELETE `cms/tags/:id` */
    public async delete(id: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(this.http, { method: 'DELETE', path: DN_API_TAG_BY_ID, slugs: { id } }, options);
    }
}
