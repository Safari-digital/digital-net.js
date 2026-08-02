import * as React from 'react';
import type { Result, TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../api';
import {
    type EntityVariableKey,
    EntityVariablesContext,
    type EntityVariablesContextValue,
} from './useEntityVariablesContext';

type Fetcher = () => Promise<Result<TemplateVariable[]>>;

export interface DnEntityVariablesProviderProps {
    children: React.ReactNode;
}

export function EntityVariablesProvider({ children }: DnEntityVariablesProviderProps) {
    const api = useDigitalNetApi();
    const [variables, setVariables] = React.useState<Partial<Record<EntityVariableKey, TemplateVariable[]>>>({});
    const [errors, setErrors] = React.useState<Partial<Record<EntityVariableKey, Error>>>({});
    const [loadingKeys, setLoadingKeys] = React.useState<ReadonlySet<EntityVariableKey>>(() => new Set());
    const inFlightRef = React.useRef<Set<EntityVariableKey>>(new Set());
    const loadedRef = React.useRef<Set<EntityVariableKey>>(new Set());

    const registry = React.useMemo<Partial<Record<EntityVariableKey, Fetcher>>>(
        () => ({
            'page:article': () => api.catalog.page.getTemplateVariables('Article'),
        }),
        [api]
    );

    const loadVariables = React.useCallback(
        (key: EntityVariableKey) => {
            if (loadedRef.current.has(key) || inFlightRef.current.has(key)) return;
            const fetcher = registry[key];
            if (!fetcher) {
                loadedRef.current.add(key);
                setVariables(prev => ({ ...prev, [key]: [] }));
                return;
            }
            inFlightRef.current.add(key);
            setLoadingKeys(prev => {
                const next = new Set(prev);
                next.add(key);
                return next;
            });
            (async () => {
                const result = await fetcher();
                loadedRef.current.add(key);
                inFlightRef.current.delete(key);
                if (result.hasError) {
                    const apiMessage =
                        result.errors
                            .map(e => e.message)
                            .filter(Boolean)
                            .join('; ') || 'unknown error';
                    const error = new Error(`Failed to load entity variables "${key}": ${apiMessage}`);
                    setErrors(prev => ({ ...prev, [key]: error }));
                } else {
                    setVariables(prev => ({ ...prev, [key]: result.value ?? [] }));
                }
                setLoadingKeys(prev => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            })();
        },
        [registry]
    );

    const value = React.useMemo<EntityVariablesContextValue>(
        () => ({ variables, errors, loadingKeys, loadVariables }),
        [variables, errors, loadingKeys, loadVariables]
    );

    return <EntityVariablesContext.Provider value={value}>{children}</EntityVariablesContext.Provider>;
}
