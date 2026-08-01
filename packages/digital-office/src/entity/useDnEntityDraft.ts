import React from 'react';
import { type Entity, JsonPatch, type JsonPatchOp } from '@digital-net-org/digital-api-sdk';
import { IDbStore, IdbContext } from '../storage';
import type { EntityDraftRecord } from './types';

const PERSIST_DEBOUNCE_MS = 500;

export interface UseDnEntityDraftOptions {
    enabled?: boolean;
}

export interface UseDnEntityDraftResult<T extends Entity> {
    values: Partial<T>;
    ops: JsonPatchOp[];
    isDirty: boolean;
    hasConflict: boolean;
    baselineUpdatedAt: string | null;
    apiUpdatedAt: string | null;
    setField: (_path: string, _value: unknown) => void;
    discard: () => Promise<void>;
    commit: () => Promise<void>;
}

function pathToAccessor(path: string): string {
    if (!path.startsWith('/')) return path;
    return path.slice(1).split('/')[0];
}

export function useDnEntityDraft<T extends Entity>(
    entityName: string,
    id: string | undefined,
    apiData: T | undefined,
    options: UseDnEntityDraftOptions = {}
): UseDnEntityDraftResult<T> {
    const enabled = options.enabled ?? true;
    const { database, notifyDraftChange } = React.useContext(IdbContext);
    const [ops, setOps] = React.useState<JsonPatchOp[]>([]);
    const [baselineUpdatedAt, setBaseline] = React.useState<string | null>(null);

    const store = `patch:${entityName}`;

    const persist = React.useCallback(
        async (nextOps: JsonPatchOp[], nextBaseline: string | null) => {
            if (!database || !id) return;
            if (nextOps.length === 0) {
                await IDbStore.delete(database, store, id);
            } else {
                const record: EntityDraftRecord = {
                    id,
                    ops: nextOps,
                    baselineUpdatedAt: nextBaseline,
                    updatedAt: new Date().toISOString(),
                };
                await IDbStore.save(database, store, record);
            }
            notifyDraftChange();
        },
        [database, id, notifyDraftChange, store]
    );

    const timerRef = React.useRef<number | null>(null);
    const pendingRef = React.useRef<{ ops: JsonPatchOp[]; baseline: string | null } | null>(null);

    const cancelPending = React.useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        pendingRef.current = null;
    }, []);

    const schedulePersist = React.useCallback(
        (nextOps: JsonPatchOp[], nextBaseline: string | null) => {
            pendingRef.current = { ops: nextOps, baseline: nextBaseline };
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
            timerRef.current = window.setTimeout(() => {
                timerRef.current = null;
                const pending = pendingRef.current;
                if (!pending) return;
                pendingRef.current = null;
                void persist(pending.ops, pending.baseline);
            }, PERSIST_DEBOUNCE_MS);
        },
        [persist]
    );

    React.useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (!database || !enabled || !id) {
                if (cancelled) return;
                setOps([]);
                setBaseline(null);
                return;
            }
            const record = await IDbStore.get<EntityDraftRecord>(database, store, id);
            if (cancelled) return;
            setOps(record?.ops ?? []);
            setBaseline(record?.baselineUpdatedAt ?? null);
        };
        void load();
        return () => {
            // Flush any pending IDB write before switching id/store or unmounting,
            // using the persist closure captured at this render (matches the previous id).
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            const pending = pendingRef.current;
            if (pending) {
                pendingRef.current = null;
                void persist(pending.ops, pending.baseline);
            }
            cancelled = true;
        };
    }, [database, enabled, id, store, persist]);

    const values = React.useMemo<Partial<T>>(
        () => JsonPatch.applyOps<T>(apiData as Partial<T> | undefined, ops),
        [apiData, ops]
    );

    const isDirty = ops.length > 0;
    const apiUpdatedAt = apiData?.updatedAt ?? null;
    const hasConflict = isDirty && !!apiUpdatedAt && !!baselineUpdatedAt && apiUpdatedAt > baselineUpdatedAt;

    // Mirror ops in a ref so setField can read the latest value within a
    // single render tick, even if it's called multiple times before React
    // commits — otherwise the second call would clobber the first.
    const opsRef = React.useRef(ops);
    React.useEffect(() => {
        opsRef.current = ops;
    }, [ops]);

    const setField = React.useCallback(
        (path: string, value: unknown) => {
            const accessor = pathToAccessor(path);
            const apiValue = (apiData as Record<string, unknown> | undefined)?.[accessor];
            const matchesApi = Object.is(value, apiValue);
            const nextOps = matchesApi
                ? opsRef.current.filter(o => o.path !== path)
                : JsonPatch.setOp(opsRef.current, path, value);
            opsRef.current = nextOps;
            const nextBaseline = baselineUpdatedAt ?? (nextOps.length > 0 ? (apiData?.updatedAt ?? null) : null);
            setOps(nextOps);
            setBaseline(nextOps.length > 0 ? nextBaseline : null);
            schedulePersist(nextOps, nextOps.length > 0 ? nextBaseline : null);
        },
        [apiData, baselineUpdatedAt, schedulePersist]
    );

    const discard = React.useCallback(async () => {
        cancelPending();
        setOps([]);
        setBaseline(null);
        if (database && id) {
            await IDbStore.delete(database, store, id);
            notifyDraftChange();
        }
    }, [cancelPending, database, id, notifyDraftChange, store]);

    const commit = discard;

    return {
        values,
        ops,
        isDirty,
        hasConflict,
        baselineUpdatedAt,
        apiUpdatedAt,
        setField,
        discard,
        commit,
    };
}
