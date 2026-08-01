import * as React from 'react';
import type { EntityName, SchemaProperty } from '@digital-net-org/digital-api-sdk';
import { useEntitySchemaContext } from './useEntitySchemaContext';

export interface UseDnEntitySchemaResult {
    schemas: SchemaProperty[];
    loading: boolean;
}

export function useDnEntitySchema(entityName: EntityName): UseDnEntitySchemaResult {
    const { schemas, errors, loadingEntities, loadSchema } = useEntitySchemaContext();

    React.useEffect(() => loadSchema(entityName), [entityName, loadSchema]);

    const error = errors[entityName];
    if (error) throw error;

    return {
        schemas: schemas[entityName] ?? [],
        loading: loadingEntities.has(entityName) || !(entityName in schemas),
    };
}
