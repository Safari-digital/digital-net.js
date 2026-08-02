import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';

export type EntityVariableKey = string;

export interface EntityVariablesContextValue {
    variables: Partial<Record<EntityVariableKey, TemplateVariable[]>>;
    errors: Partial<Record<EntityVariableKey, Error>>;
    loadingKeys: ReadonlySet<EntityVariableKey>;
    loadVariables: (_key: EntityVariableKey) => void;
}

export const EntityVariablesContext = React.createContext<EntityVariablesContextValue | null>(null);

export function useEntityVariablesContext(): EntityVariablesContextValue {
    const context = React.useContext(EntityVariablesContext);
    if (!context) {
        throw new Error('useEntityVariablesContext must be used within a EntityVariablesProvider.');
    }
    return context;
}
