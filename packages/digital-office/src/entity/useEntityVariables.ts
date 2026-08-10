import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { useEntityVariablesContext } from './useEntityVariablesContext';

export interface UseEntityVariablesResult {
    variables: TemplateVariable[];
    loading: boolean;
}

export function useEntityVariables(): UseEntityVariablesResult {
    const { variables, error, loading, loadVariables } = useEntityVariablesContext();

    // An error the provider already held when this mount started belongs to an earlier load. Throwing
    // it on the first render would kill the render pass before the effect could ask for a retry, so
    // only an error raised after that point counts.
    const [seen] = React.useState(() => error);

    React.useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    if (error && error !== seen) throw error;

    return {
        variables: variables ?? [],
        loading: loading || variables === null,
    };
}
