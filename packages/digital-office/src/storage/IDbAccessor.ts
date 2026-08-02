import type { IDbConfig } from './IDbConfig';

export class IDbAccessor {
    // Missing stores require a version bump to trigger onupgradeneeded; deriving the version from
    // the store list would throw VersionError as soon as a store is removed from it.
    public static async initDatabase(config: IDbConfig, onOutdated?: () => void): Promise<IDBDatabase> {
        const db = await IDbAccessor.open(config, undefined, onOutdated);
        if (config.stores.every(store => db.objectStoreNames.contains(store))) return db;
        const nextVersion = db.version + 1;
        db.close();
        return IDbAccessor.open(config, nextVersion, onOutdated);
    }

    private static open(config: IDbConfig, version?: number, onOutdated?: () => void): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(config.name, version);
            let blocked = false;
            request.onupgradeneeded = () => {
                const db = request.result;
                config.stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: 'id' });
                    }
                });
            };
            // A tab running an older build keeps the previous version open: reject instead of
            // leaving the request pending forever.
            request.onblocked = () => {
                blocked = true;
                reject(new Error(`IDbAccessor: opening "${config.name}" is blocked by another tab`));
            };
            request.onerror = () => reject(request.error ?? new Error(`IDbAccessor: failed to open "${config.name}"`));
            request.onsuccess = () => {
                const db = request.result;
                if (blocked) return db.close();
                // Release the connection when another tab upgrades, so it never blocks them.
                db.onversionchange = () => {
                    db.close();
                    onOutdated?.();
                };
                resolve(db);
            };
        });
    }
}
