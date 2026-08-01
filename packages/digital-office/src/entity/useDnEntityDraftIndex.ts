import React from 'react';
import type { JsonPatchOp } from '@digital-net-org/digital-api-sdk';
import { IDbStore, IdbContext } from '../storage';
import type { EntityDraftRecord } from './types';

export interface UseDnEntityDraftIndexResult {
    drafts: Map<string, JsonPatchOp[]>;
    isLoading: boolean;
}

export function useDnEntityDraftIndex(entityName: string): UseDnEntityDraftIndexResult {
    const { database, draftBump } = React.useContext(IdbContext);
    const [drafts, setDrafts] = React.useState<Map<string, JsonPatchOp[]>>(new Map());
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (!database) {
            return;
        }

        let cancelled = false;
        const load = async () => {
            setIsLoading(true);

            try {
                const records = await IDbStore.getAll<EntityDraftRecord>(database, `patch:${entityName}`);
                if (cancelled) {
                    return;
                }

                const map = new Map<string, JsonPatchOp[]>();
                for (const r of records) {
                    if (r.ops.length > 0) map.set(r.id, r.ops);
                }
                setDrafts(map);
            } catch {
                if (!cancelled) setDrafts(new Map());
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, [database, entityName, draftBump]);

    return { drafts, isLoading };
}
