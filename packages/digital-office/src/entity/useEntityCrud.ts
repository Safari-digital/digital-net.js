import * as React from 'react';
import type { Entity, JsonPatchOp, Result } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import { entityRequest } from './entityRequest';
import { useEntityDefinition } from './useEntityContext';

export interface EntityCrud<T extends Entity> {
    getById: (_id: string) => Promise<Result<T>>;
    create: (_values: Partial<T>) => Promise<Result<string>>;
    update: (_id: string, _ops: JsonPatchOp[]) => Promise<Result<unknown>>;
    remove: (_id: string) => Promise<Result<unknown>>;
}

/** Generic REST operations for any entity of the registry, used when no callback overrides them. */
export function useEntityCrud<T extends Entity>(entityName: string): EntityCrud<T> {
    const api = useDigitalNetApi();
    const { path } = useEntityDefinition(entityName);

    return React.useMemo(
        () => ({
            getById: id => entityRequest<T>(api.http, { path: `${path}/:id`, slugs: { id } }),
            create: values => entityRequest<string>(api.http, { method: 'POST', path, body: values }),
            update: (id, ops) =>
                entityRequest<unknown>(api.http, {
                    method: 'PATCH',
                    path: `${path}/:id`,
                    slugs: { id },
                    body: ops,
                    headers: { 'Content-Type': 'application/json-patch+json' },
                }),
            remove: id => entityRequest<unknown>(api.http, { method: 'DELETE', path: `${path}/:id`, slugs: { id } }),
        }),
        [api, path]
    );
}
