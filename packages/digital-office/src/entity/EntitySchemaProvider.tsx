import * as React from 'react';
import type { Result, SchemaProperty } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import { EntitySchemaContext, type EntitySchemaContextValue } from './useEntitySchemaContext';
import { useEntityContext } from './useEntityContext';

export interface DnEntitySchemaProviderProps {
    children: React.ReactNode;
}

export function EntitySchemaProvider({ children }: DnEntitySchemaProviderProps) {
    const api = useDigitalNetApi();
    const { entities } = useEntityContext();
    const [schemas, setSchemas] = React.useState<Partial<Record<string, SchemaProperty[]>>>({});
    const [errors, setErrors] = React.useState<Partial<Record<string, Error>>>({});
    const [loadingNames, setLoadingNames] = React.useState<ReadonlySet<string>>(() => new Set());
    const inFlightRef = React.useRef<Set<string>>(new Set());
    const loadedRef = React.useRef<Set<string>>(new Set());

    const loadSchema = React.useCallback(
        (entityName: string) => {
            if (loadedRef.current.has(entityName) || inFlightRef.current.has(entityName)) return;
            const definition = entities[entityName];
            if (!definition) return;
            inFlightRef.current.add(entityName);
            setErrors(prev => {
                if (!prev[entityName]) return prev;
                const next = { ...prev };
                delete next[entityName];
                return next;
            });
            setLoadingNames(prev => {
                const next = new Set(prev);
                next.add(entityName);
                return next;
            });
            (async () => {
                let schema: SchemaProperty[] | undefined;
                let error: Error | undefined;
                try {
                    const response = await api.http.request<Result<SchemaProperty[]>>({
                        path: `${definition.path}/schema`,
                    });
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
                inFlightRef.current.delete(entityName);
                if (error) {
                    // Left out of loadedRef so a transient failure can be retried on the next mount.
                    const loadError = error;
                    setErrors(prev => ({ ...prev, [entityName]: loadError }));
                } else {
                    loadedRef.current.add(entityName);
                    setSchemas(prev => ({ ...prev, [entityName]: schema }));
                }
                setLoadingNames(prev => {
                    const next = new Set(prev);
                    next.delete(entityName);
                    return next;
                });
            })();
        },
        [api, entities]
    );

    const value = React.useMemo<EntitySchemaContextValue>(
        () => ({ schemas, errors, loadingNames, loadSchema }),
        [schemas, errors, loadingNames, loadSchema]
    );

    return <EntitySchemaContext.Provider value={value}>{children}</EntitySchemaContext.Provider>;
}
