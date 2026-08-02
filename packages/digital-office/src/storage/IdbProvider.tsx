import * as React from 'react';
// Imported by file rather than through the entity barrel, which reaches back into this module.
import { resolveDraftEntities } from '../entity/entities';
import { useEntityContext } from '../entity/useEntityContext';
import { IDbAccessor } from './IDbAccessor';
import type { IDbConfig } from './IDbConfig';

export interface IdbContextValue extends IDbConfig {
    database: IDBDatabase | null;
    isLoading: boolean;
    hasError: boolean;
    draftBump: number;
    notifyDraftChange: () => void;
}

const DRAFTS_DB_NAME = 'office-drafts';

// Stores of the era when draft store names were free-form plurals, before they were derived from
// entity names. Their drafts are unreachable now, so the stores are dropped on the next upgrade.
const OBSOLETE_STORES = ['patch:pages', 'patch:tags', 'patch:media', 'patch:articles', 'patch:forms'];

interface ConnectionState {
    database: IDBDatabase | null;
    isLoading: boolean;
    hasError: boolean;
}

const CONNECTING: ConnectionState = { database: null, isLoading: true, hasError: false };

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
}

export function IdbProvider({ children }: IdbProviderProps) {
    const { entities } = useEntityContext();
    const [connection, setConnection] = React.useState<ConnectionState>(CONNECTING);
    const [draftBump, setDraftBump] = React.useState(0);
    const [generation, setGeneration] = React.useState(0);

    const storeKey = React.useMemo(() => resolveDraftEntities(entities).sort().join('|'), [entities]);
    const stores = React.useMemo(() => storeKey.split('|').map(name => `patch:${name}`), [storeKey]);
    const obsoleteStores = React.useMemo(() => OBSOLETE_STORES.filter(name => !stores.includes(name)), [stores]);

    // Reopening: drop the previous handle straight away rather than exposing a closed database while
    // the new connection settles.
    const session = `${storeKey}#${generation}`;
    const [openedSession, setOpenedSession] = React.useState(session);
    if (openedSession !== session) {
        setOpenedSession(session);
        setConnection(CONNECTING);
    }

    React.useEffect(() => {
        let cancelled = false;
        let db: IDBDatabase | null = null;
        (async () => {
            try {
                db = await IDbAccessor.initDatabase({ name: DRAFTS_DB_NAME, stores, obsoleteStores }, () => {
                    // Another tab upgraded the database and our connection was released: reopen.
                    if (!cancelled) setGeneration(n => n + 1);
                });
                if (cancelled) {
                    db.close();
                    return;
                }
                setConnection({ database: db, isLoading: false, hasError: false });
            } catch {
                if (cancelled) return;
                setConnection({ database: null, isLoading: false, hasError: true });
            }
        })();
        return () => {
            cancelled = true;
            db?.close();
        };
    }, [stores, obsoleteStores, generation]);

    const notifyDraftChange = React.useCallback(() => setDraftBump(n => n + 1), []);

    const value = React.useMemo<IdbContextValue>(
        () => ({ name: DRAFTS_DB_NAME, stores, ...connection, draftBump, notifyDraftChange }),
        [stores, connection, draftBump, notifyDraftChange]
    );

    return <IdbContext.Provider value={value}>{children}</IdbContext.Provider>;
}
