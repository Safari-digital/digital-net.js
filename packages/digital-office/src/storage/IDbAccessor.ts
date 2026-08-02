import type { IDbConfig } from './IDbConfig';

export class IDbAccessor {
    // Missing stores require a version bump to trigger onupgradeneeded; deriving the version from
    // the store list would throw VersionError as soon as a store is removed from it.
    public static async initDatabase(config: IDbConfig): Promise<IDBDatabase> {
        const db = await IDbAccessor.open(config);
        if (config.stores.every(store => db.objectStoreNames.contains(store))) return db;
        const nextVersion = db.version + 1;
        db.close();
        return IDbAccessor.open(config, nextVersion);
    }

    private static open(config: IDbConfig, version?: number): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(config.name, version);
            request.onupgradeneeded = () => {
                const db = request.result;
                config.stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: 'id' });
                    }
                });
            };
            request.onerror = () => reject(request.error ?? new Error(`IDbAccessor: failed to open "${config.name}"`));
            request.onsuccess = () => resolve(request.result);
        });
    }
}
