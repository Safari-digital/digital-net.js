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
    const [loadingEntities, setLoadingEntities] = React.useState<ReadonlySet<string>>(() => new Set());
    const inFlightRef = React.useRef<Set<string>>(new Set());
    const loadedRef = React.useRef<Set<string>>(new Set());

    const loadSchema = React.useCallback(
        (entityName: string, apiPath: string) => {
            if (loadedRef.current.has(entityName) || inFlightRef.current.has(entityName)) return;
            inFlightRef.current.add(entityName);
            setLoadingEntities(prev => {
                const next = new Set(prev);
                next.add(entityName);
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
                loadedRef.current.add(entityName);
                inFlightRef.current.delete(entityName);
                if (error) {
                    const loadError = error;
                    setErrors(prev => ({ ...prev, [entityName]: loadError }));
                } else {
                    setSchemas(prev => ({ ...prev, [entityName]: schema }));
                }
                setLoadingEntities(prev => {
                    const next = new Set(prev);
                    next.delete(entityName);
                    return next;
                });
            })();
        },
        [api]
    );

    const value = React.useMemo<EntitySchemaContextValue>(
        () => ({ schemas, errors, loadingEntities, loadSchema }),
        [schemas, errors, loadingEntities, loadSchema]
    );

    return <EntitySchemaContext.Provider value={value}>{children}</EntitySchemaContext.Provider>;
}
