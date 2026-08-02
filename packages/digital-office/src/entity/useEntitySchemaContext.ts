import * as React from 'react';
import type { SchemaProperty } from '@digital-net-org/digital-api-sdk';

export interface EntitySchemaContextValue {
    // Indexed by API path, not by entity name: two client entities may share a name while being
    // served by different endpoints.
    schemas: Partial<Record<string, SchemaProperty[]>>;
    errors: Partial<Record<string, Error>>;
    loadingPaths: ReadonlySet<string>;
    loadSchema: (_apiPath: string, _entityName: string) => void;
}

export const EntitySchemaContext = React.createContext<EntitySchemaContextValue | null>(null);

export function useEntitySchemaContext(): EntitySchemaContextValue {
    const context = React.useContext(EntitySchemaContext);
    if (!context) {
        throw new Error('useEntitySchemaContext must be used within a EntitySchemaProvider.');
    }
    return context;
}
