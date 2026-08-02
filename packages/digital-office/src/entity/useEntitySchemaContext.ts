import * as React from 'react';
import type { SchemaProperty } from '@digital-net-org/digital-api-sdk';

export interface EntitySchemaContextValue {
    schemas: Partial<Record<string, SchemaProperty[]>>;
    errors: Partial<Record<string, Error>>;
    loadingEntities: ReadonlySet<string>;
    loadSchema: (_entityName: string, _apiPath: string) => void;
}

export const EntitySchemaContext = React.createContext<EntitySchemaContextValue | null>(null);

export function useEntitySchemaContext(): EntitySchemaContextValue {
    const context = React.useContext(EntitySchemaContext);
    if (!context) {
        throw new Error('useEntitySchemaContext must be used within a EntitySchemaProvider.');
    }
    return context;
}
