import { type CrudEntityName, type Entity, type EntityName, resolveEntityPath } from '../../../Entity';
import type { HttpClient } from '../../../HttpClient';
import type { JsonPatchOp } from '../../../JsonPatch';
import type { Result } from '../../../Result';
import type { SchemaProperty } from '../../../Schema';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';

/**
 * Generic entity operations shared by entities that follow the standard REST contract.
 * The mutating by-id calls are typed on {@link CrudEntityName}; `getSchema` accepts any
 * {@link EntityName} since a schema endpoint exists for nearly every entity (only
 * `formSubmission` has none).
 */
export class CrudCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** GET `{path}/schema` — Returns the schema for any entity endpoint. */
    public async getSchema(
        entity: EntityName,
        options: CatalogCallbacks<SchemaProperty[]> = {}
    ): Promise<Result<SchemaProperty[]>> {
        const path = resolveEntityPath(entity);
        return CatalogRunner.run<SchemaProperty[]>(this.http, { path: `${path}/schema` }, options);
    }

    /** GET `{path}/:id` — Returns an Entity from its id. */
    public async getById<T = Entity>(
        entity: CrudEntityName,
        id: string,
        options: CatalogCallbacks<T> = {}
    ): Promise<Result<T>> {
        const path = resolveEntityPath(entity);
        return CatalogRunner.run<T>(this.http, { path: `${path}/:id`, slugs: { id } }, options);
    }

    /** DELETE `{path}/:id` — Delete an Entity from its id. */
    public async deleteById(entity: CrudEntityName, id: string, options: CatalogCallbacks = {}): Promise<Result> {
        const path = resolveEntityPath(entity);
        return CatalogRunner.run<null>(this.http, { path: `${path}/:id`, method: 'DELETE', slugs: { id } }, options);
    }

    /** PATCH `{path}/:id` — Patch an Entity from its id. */
    public async patchById(
        entity: CrudEntityName,
        id: string,
        ops: JsonPatchOp[],
        options: CatalogCallbacks = {}
    ): Promise<Result> {
        const path = resolveEntityPath(entity);
        return CatalogRunner.run<null>(
            this.http,
            {
                path: `${path}/:id`,
                method: 'PATCH',
                slugs: { id },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }
}
