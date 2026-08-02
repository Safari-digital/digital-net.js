import * as React from 'react';
import { type EntityName, type SchemaProperty, resolveEntityPath } from '@digital-net-org/digital-api-sdk';
import { useEntitySchemaContext } from './useEntitySchemaContext';

export interface UseDnEntitySchemaResult {
    schemas: SchemaProperty[];
    loading: boolean;
}

export function useDnEntitySchema(entityName: string, apiPath?: string): UseDnEntitySchemaResult {
    const { schemas, errors, loadingPaths, loadSchema } = useEntitySchemaContext();
    const resolvedPath = apiPath ?? resolveEntityPath(entityName as EntityName);
    const [requestedPath, setRequestedPath] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        if (!resolvedPath) return;
        setRequestedPath(resolvedPath);
        loadSchema(resolvedPath, entityName);
    }, [entityName, resolvedPath, loadSchema]);

    // Only raise the error of a load this mount asked for: an error kept by the provider would throw
    // on the first render, so the effect — and the retry it triggers — would never run again.
    if (resolvedPath && requestedPath === resolvedPath) {
        const error = errors[resolvedPath];
        if (error) throw error;
    }

    if (!resolvedPath) return { schemas: [], loading: false };

    return {
        schemas: schemas[resolvedPath] ?? [],
        loading: loadingPaths.has(resolvedPath) || !(resolvedPath in schemas),
    };
}
