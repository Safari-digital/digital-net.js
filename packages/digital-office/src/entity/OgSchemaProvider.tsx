import * as React from 'react';
import type { OpenGraphPropertySchema } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import { OgSchemaContext, type OgSchemaContextValue } from './useOgSchemaContext';

export interface DnOgSchemaProviderProps {
    children: React.ReactNode;
}

export function OgSchemaProvider({ children }: DnOgSchemaProviderProps) {
    const api = useDigitalNetApi();
    const [schema, setSchema] = React.useState<OpenGraphPropertySchema[] | null>(null);
    const [error, setError] = React.useState<Error | null>(null);
    const [loading, setLoading] = React.useState(false);
    const inFlightRef = React.useRef(false);
    const loadedRef = React.useRef(false);

    const fetchSchema = React.useCallback(() => {
        if (loadedRef.current || inFlightRef.current) return;
        inFlightRef.current = true;
        setLoading(true);
        (async () => {
            const result = await api.catalog.page.getOpenGraphSchema();
            loadedRef.current = true;
            inFlightRef.current = false;
            if (result.hasError) {
                const message =
                    result.errors
                        .map((e: { message?: string }) => e.message)
                        .filter(Boolean)
                        .join('; ') || 'unknown error';
                setError(new Error(`Failed to load OpenGraph schema: ${message}`));
            } else {
                setSchema(result.value);
                setError(null);
            }
            setLoading(false);
        })();
    }, [api]);

    const reload = React.useCallback(() => {
        loadedRef.current = false;
        inFlightRef.current = false;
        setSchema(null);
        setError(null);
        fetchSchema();
    }, [fetchSchema]);

    const value = React.useMemo<OgSchemaContextValue>(
        () => ({ schema, error, loading, loadSchema: fetchSchema, reload }),
        [schema, error, loading, fetchSchema, reload]
    );

    return <OgSchemaContext.Provider value={value}>{children}</OgSchemaContext.Provider>;
}
