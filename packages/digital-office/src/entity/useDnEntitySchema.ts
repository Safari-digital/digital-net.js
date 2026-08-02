import * as React from 'react';
import { type EntityName, type SchemaProperty, resolveEntityPath } from '@digital-net-org/digital-api-sdk';
import { useEntitySchemaContext } from './useEntitySchemaContext';

export interface UseDnEntitySchemaResult {
    schemas: SchemaProperty[];
    loading: boolean;
}

export function useDnEntitySchema(entityName: string, apiPath?: string): UseDnEntitySchemaResult {
    const { schemas, errors, loadingEntities, loadSchema } = useEntitySchemaContext();
    const resolvedPath = apiPath ?? resolveEntityPath(entityName as EntityName);

    React.useEffect(() => {
        if (resolvedPath) loadSchema(entityName, resolvedPath);
    }, [entityName, resolvedPath, loadSchema]);

    const error = errors[entityName];
    if (error) throw error;

    if (!resolvedPath) return { schemas: [], loading: false };

    return {
        schemas: schemas[entityName] ?? [],
        loading: loadingEntities.has(entityName) || !(entityName in schemas),
    };
}
