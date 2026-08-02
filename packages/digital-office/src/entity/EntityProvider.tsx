import * as React from 'react';
import { buildEntityRegistry } from './entities';
import type { DnEntityDictionary } from './types';
import { EntityContext, type EntityContextValue } from './useEntityContext';

export interface EntityProviderProps {
    children: React.ReactNode;
    entities?: DnEntityDictionary;
}

export function EntityProvider({ entities, children }: EntityProviderProps) {
    // Keyed on the content rather than on the reference: an inline literal would otherwise rebuild
    // the registry on every render, and with it the IndexedDB stores derived from it.
    const signature = React.useMemo(() => JSON.stringify(entities ?? {}), [entities]);

    const value = React.useMemo<EntityContextValue>(
        () => ({ entities: buildEntityRegistry(JSON.parse(signature)) }),
        [signature]
    );

    return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}
