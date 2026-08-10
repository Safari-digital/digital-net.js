import * as React from 'react';
import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import { EntityVariablesContext, type EntityVariablesContextValue } from './useEntityVariablesContext';

export interface DnEntityVariablesProviderProps {
    children: React.ReactNode;
}

/**
 * Holds the template variables of every declared source. The API derives them from the attributes at
 * build time, so they are loaded once and never refreshed — same mechanics as EntitySchemaProvider.
 */
export function EntityVariablesProvider({ children }: DnEntityVariablesProviderProps) {
    const api = useDigitalNetApi();
    const [variables, setVariables] = React.useState<TemplateVariable[] | null>(null);
    const [error, setError] = React.useState<Error | null>(null);
    const [loading, setLoading] = React.useState(false);
    const inFlightRef = React.useRef(false);
    const loadedRef = React.useRef(false);

    const loadVariables = React.useCallback(() => {
        if (loadedRef.current || inFlightRef.current) return;
        inFlightRef.current = true;
        setError(null);
        setLoading(true);
        (async () => {
            let loaded: TemplateVariable[] | undefined;
            let loadError: Error | undefined;
            try {
                const result = await api.catalog.page.getTemplateVariables();
                if (result.hasError) {
                    const apiMessage =
                        result.errors
                            .map(e => e.message)
                            .filter(Boolean)
                            .join('; ') || 'unknown error';
                    loadError = new Error(`Failed to load template variables: ${apiMessage}`);
                } else {
                    loaded = result.value ?? [];
                }
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                loadError = new Error(`Failed to load template variables: ${message}`);
            }
            inFlightRef.current = false;
            if (loadError) {
                // Left out of loadedRef so a transient failure can be retried on the next mount.
                setError(loadError);
            } else {
                loadedRef.current = true;
                setVariables(loaded ?? []);
            }
            setLoading(false);
        })();
    }, [api]);

    const value = React.useMemo<EntityVariablesContextValue>(
        () => ({ variables, error, loading, loadVariables }),
        [variables, error, loading, loadVariables]
    );

    return <EntityVariablesContext.Provider value={value}>{children}</EntityVariablesContext.Provider>;
}
