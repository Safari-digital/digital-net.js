import * as React from 'react';
import type { EntityName, SchemaProperty } from '@digital-net-org/digital-api-sdk';

export interface EntitySchemaContextValue {
    schemas: Partial<Record<EntityName, SchemaProperty[]>>;
    errors: Partial<Record<EntityName, Error>>;
    loadingEntities: ReadonlySet<EntityName>;
    loadSchema: (_entityName: EntityName) => void;
}

export const EntitySchemaContext = React.createContext<EntitySchemaContextValue | null>(null);

export function useEntitySchemaContext(): EntitySchemaContextValue {
    const context = React.useContext(EntitySchemaContext);
    if (!context) {
        throw new Error('useEntitySchemaContext must be used within a EntitySchemaProvider.');
    }
    return context;
}
