import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';

export interface EntityVariablesContextValue {
    variables: TemplateVariable[] | null;
    error: Error | null;
    loading: boolean;
    loadVariables: () => void;
}

export const EntityVariablesContext = React.createContext<EntityVariablesContextValue | null>(null);

export function useEntityVariablesContext(): EntityVariablesContextValue {
    const context = React.useContext(EntityVariablesContext);
    if (!context) {
        throw new Error('useEntityVariablesContext must be used within a EntityVariablesProvider.');
    }
    return context;
}
