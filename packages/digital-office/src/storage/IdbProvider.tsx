import * as React from 'react';
import { IDbAccessor } from './IDbAccessor';
import type { IDbConfig } from './IDbConfig';

export interface IdbContextValue extends IDbConfig {
    database: IDBDatabase | null;
    isLoading: boolean;
    hasError: boolean;
    draftBump: number;
    notifyDraftChange: () => void;
}

export const DRAFT_STORES = ['pages', 'tags', 'media', 'articles', 'forms'] as const;
const DRAFTS_DB_NAME = 'office-drafts';

export const IdbContext = React.createContext<IdbContextValue>({
    name: '',
    stores: [],
    database: null,
    isLoading: false,
    hasError: false,
    draftBump: 0,
    notifyDraftChange: () => undefined,
});

export interface IdbProviderProps {
    children: React.ReactNode;
    draftStores?: ReadonlyArray<string>;
}

export function IdbProvider({ draftStores, children }: IdbProviderProps) {
    const [database, setDatabase] = React.useState<IDBDatabase | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    const [draftBump, setDraftBump] = React.useState(0);
    const [generation, setGeneration] = React.useState(0);

    const stores = React.useMemo(
        () => [...new Set([...DRAFT_STORES, ...(draftStores ?? [])])].map(name => `patch:${name}`),
        [draftStores]
    );

    React.useEffect(() => {
        let cancelled = false;
        let db: IDBDatabase | null = null;
        setDatabase(null);
        setIsLoading(true);
        setHasError(false);
        (async () => {
            try {
                db = await IDbAccessor.initDatabase({ name: DRAFTS_DB_NAME, stores }, () => {
                    // Another tab upgraded the database and our connection was released: reopen.
                    if (!cancelled) setGeneration(n => n + 1);
                });
                if (cancelled) {
                    db.close();
                    return;
                }
                setDatabase(db);
                setIsLoading(false);
            } catch {
                if (cancelled) return;
                setHasError(true);
                setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
            db?.close();
        };
    }, [stores, generation]);

    const notifyDraftChange = React.useCallback(() => setDraftBump(n => n + 1), []);

    const value = React.useMemo<IdbContextValue>(
        () => ({ name: DRAFTS_DB_NAME, stores, database, isLoading, hasError, draftBump, notifyDraftChange }),
        [stores, database, isLoading, hasError, draftBump, notifyDraftChange]
    );

    return <IdbContext.Provider value={value}>{children}</IdbContext.Provider>;
}
