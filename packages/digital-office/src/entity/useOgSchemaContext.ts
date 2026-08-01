import * as React from 'react';
import type { OpenGraphPropertySchema } from '@digital-net-org/digital-api-sdk';

export interface OgSchemaContextValue {
    schema: OpenGraphPropertySchema[] | null;
    error: Error | null;
    loading: boolean;
    loadSchema: () => void;
    reload: () => void;
}

export const OgSchemaContext = React.createContext<OgSchemaContextValue | null>(null);

export function useOgSchemaContext(): OgSchemaContextValue {
    const context = React.useContext(OgSchemaContext);
    if (!context) {
        throw new Error('useOgSchemaContext must be used within a OgSchemaProvider.');
    }
    return context;
}
