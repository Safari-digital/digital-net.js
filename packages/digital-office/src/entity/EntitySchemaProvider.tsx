import * as React from 'react';
import type { EntityName, SchemaProperty } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import { EntitySchemaContext, type EntitySchemaContextValue } from './useEntitySchemaContext';

export interface DnEntitySchemaProviderProps {
    children: React.ReactNode;
}

export function EntitySchemaProvider({ children }: DnEntitySchemaProviderProps) {
    const api = useDigitalNetApi();
    const [schemas, setSchemas] = React.useState<Partial<Record<EntityName, SchemaProperty[]>>>({});
    const [errors, setErrors] = React.useState<Partial<Record<EntityName, Error>>>({});
    const [loadingEntities, setLoadingEntities] = React.useState<ReadonlySet<EntityName>>(() => new Set());
    const inFlightRef = React.useRef<Set<EntityName>>(new Set());
    const loadedRef = React.useRef<Set<EntityName>>(new Set());

    const loadSchema = React.useCallback(
        (entityName: EntityName) => {
            if (loadedRef.current.has(entityName) || inFlightRef.current.has(entityName)) return;
            inFlightRef.current.add(entityName);
            setLoadingEntities(prev => {
                const next = new Set(prev);
                next.add(entityName);
                return next;
            });
            (async () => {
                const result = await api.catalog.crud.getSchema(entityName);
                loadedRef.current.add(entityName);
                inFlightRef.current.delete(entityName);
                if (result.hasError) {
                    const apiMessage =
                        result.errors
                            .map(e => e.message)
                            .filter(Boolean)
                            .join('; ') || 'unknown error';
                    const error = new Error(`Failed to load entity schema "${entityName}": ${apiMessage}`);
                    setErrors(prev => ({ ...prev, [entityName]: error }));
                } else {
                    setSchemas(prev => ({ ...prev, [entityName]: result.value }));
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
