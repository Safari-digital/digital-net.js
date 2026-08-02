import * as React from 'react';
import type { Result, SchemaProperty } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import { EntitySchemaContext, type EntitySchemaContextValue } from './useEntitySchemaContext';

export interface DnEntitySchemaProviderProps {
    children: React.ReactNode;
}

export function EntitySchemaProvider({ children }: DnEntitySchemaProviderProps) {
    const api = useDigitalNetApi();
    const [schemas, setSchemas] = React.useState<Partial<Record<string, SchemaProperty[]>>>({});
    const [errors, setErrors] = React.useState<Partial<Record<string, Error>>>({});
    const [loadingPaths, setLoadingPaths] = React.useState<ReadonlySet<string>>(() => new Set());
    const inFlightRef = React.useRef<Set<string>>(new Set());
    const loadedRef = React.useRef<Set<string>>(new Set());

    const loadSchema = React.useCallback(
        (apiPath: string, entityName: string) => {
            if (loadedRef.current.has(apiPath) || inFlightRef.current.has(apiPath)) return;
            inFlightRef.current.add(apiPath);
            setErrors(prev => {
                if (!prev[apiPath]) return prev;
                const next = { ...prev };
                delete next[apiPath];
                return next;
            });
            setLoadingPaths(prev => {
                const next = new Set(prev);
                next.add(apiPath);
                return next;
            });
            (async () => {
                let schema: SchemaProperty[] | undefined;
                let error: Error | undefined;
                try {
                    const response = await api.http.request<Result<SchemaProperty[]>>({ path: `${apiPath}/schema` });
                    const result = response.data;
                    if (result.hasError) {
                        const apiMessage =
                            result.errors
                                .map(e => e.message)
                                .filter(Boolean)
                                .join('; ') || 'unknown error';
                        error = new Error(`Failed to load entity schema "${entityName}": ${apiMessage}`);
                    } else {
                        schema = result.value ?? [];
                    }
                } catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    error = new Error(`Failed to load entity schema "${entityName}": ${message}`);
                }
                inFlightRef.current.delete(apiPath);
                if (error) {
                    // Left out of loadedRef so a transient failure can be retried on the next mount.
                    const loadError = error;
                    setErrors(prev => ({ ...prev, [apiPath]: loadError }));
                } else {
                    loadedRef.current.add(apiPath);
                    setSchemas(prev => ({ ...prev, [apiPath]: schema }));
                }
                setLoadingPaths(prev => {
                    const next = new Set(prev);
                    next.delete(apiPath);
                    return next;
                });
            })();
        },
        [api]
    );

    const value = React.useMemo<EntitySchemaContextValue>(
        () => ({ schemas, errors, loadingPaths, loadSchema }),
        [schemas, errors, loadingPaths, loadSchema]
    );

    return <EntitySchemaContext.Provider value={value}>{children}</EntitySchemaContext.Provider>;
}
