import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { type EntityVariableKey, useEntityVariablesContext } from './useEntityVariablesContext';

export interface UseEntityVariablesResult {
    variables: TemplateVariable[];
    loading: boolean;
}

export function useEntityVariables(key: EntityVariableKey | null | undefined): UseEntityVariablesResult {
    const { variables, errors, loadingKeys, loadVariables } = useEntityVariablesContext();

    React.useEffect(() => {
        if (key) loadVariables(key);
    }, [key, loadVariables]);

    if (key && errors[key]) throw errors[key];

    return {
        variables: key ? (variables[key] ?? []) : [],
        loading: !!key && (loadingKeys.has(key) || !(key in variables)),
    };
}
