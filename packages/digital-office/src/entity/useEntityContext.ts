import * as React from 'react';
import type { DnEntityDefinition, DnEntityDictionary } from './types';

export interface EntityContextValue {
    entities: DnEntityDictionary;
}

export const EntityContext = React.createContext<EntityContextValue | null>(null);

export function useEntityContext(): EntityContextValue {
    const context = React.useContext(EntityContext);
    if (!context) {
        throw new Error('useEntityContext must be used within a EntityProvider.');
    }
    return context;
}

export function useEntityDefinition(entityName: string): DnEntityDefinition {
    const { entities } = useEntityContext();
    const definition = entities[entityName];
    if (!definition) {
        throw new Error(`Unknown entity "${entityName}". Declare it in the entities prop of DigitalOfficeProvider.`);
    }
    return definition;
}
