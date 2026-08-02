import * as React from 'react';
import type { SchemaProperty } from '@digital-net-org/digital-api-sdk';
import { useEntityDefinition } from './useEntityContext';
import { useEntitySchemaContext } from './useEntitySchemaContext';

export interface UseDnEntitySchemaResult {
    schemas: SchemaProperty[];
    loading: boolean;
}

export function useDnEntitySchema(entityName: string): UseDnEntitySchemaResult {
    const { schemas, errors, loadingNames, loadSchema } = useEntitySchemaContext();
    // Throws on an entity missing from the registry, before any request is attempted.
    useEntityDefinition(entityName);

    // An error the provider already held when this mount started belongs to an earlier load. Throwing
    // it on the first render would kill the render pass before the effect could ask for a retry, so
    // only an error raised after that point counts.
    const [seen, setSeen] = React.useState(() => ({ entityName, error: errors[entityName] }));
    if (seen.entityName !== entityName) setSeen({ entityName, error: errors[entityName] });

    React.useEffect(() => {
        loadSchema(entityName);
    }, [entityName, loadSchema]);

    const error = errors[entityName];
    if (error && error !== seen.error) throw error;

    return {
        schemas: schemas[entityName] ?? [],
        loading: loadingNames.has(entityName) || !(entityName in schemas),
    };
}
