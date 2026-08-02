import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDbAccessor } from './IDbAccessor';

interface FakeOpenRequest {
    result?: unknown;
    error?: DOMException | null;
    onupgradeneeded: (() => void) | null;
    onblocked: (() => void) | null;
    onerror: (() => void) | null;
    onsuccess: (() => void) | null;
}

const createFakeDb = (stores: string[], version = 1) => {
    const names = [...stores];
    return {
        version,
        close: vi.fn(),
        onversionchange: null as (() => void) | null,
        createObjectStore: vi.fn((name: string) => names.push(name)),
        objectStoreNames: { contains: (name: string) => names.includes(name) },
    };
};

const stubIndexedDb = () => {
    const requests: FakeOpenRequest[] = [];
    const open = vi.fn(() => {
        const request: FakeOpenRequest = {
            onupgradeneeded: null,
            onblocked: null,
            onerror: null,
            onsuccess: null,
        };
        requests.push(request);
        return request;
    });
    vi.stubGlobal('indexedDB', { open });
    return { open, requests };
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('IDbAccessor', () => {
    it('resolves the connection and releases it when another tab upgrades', async () => {
        const { requests } = stubIndexedDb();
        const onOutdated = vi.fn();
        const db = createFakeDb(['patch:pages']);
        const promise = IDbAccessor.initDatabase({ name: 'test', stores: ['patch:pages'] }, onOutdated);
        requests[0].result = db;
        requests[0].onsuccess?.();
        await expect(promise).resolves.toBe(db);
        db.onversionchange?.();
        expect(db.close).toHaveBeenCalledOnce();
        expect(onOutdated).toHaveBeenCalledOnce();
    });

    it('rejects instead of hanging when the open request is blocked', async () => {
        const { requests } = stubIndexedDb();
        const promise = IDbAccessor.initDatabase({ name: 'test', stores: [] });
        requests[0].onblocked?.();
        await expect(promise).rejects.toThrow('blocked by another tab');
    });

    it('closes the late connection when a blocked request eventually succeeds', async () => {
        const { requests } = stubIndexedDb();
        const promise = IDbAccessor.initDatabase({ name: 'test', stores: [] });
        requests[0].onblocked?.();
        await expect(promise).rejects.toThrow();
        const db = createFakeDb([]);
        requests[0].result = db;
        requests[0].onsuccess?.();
        expect(db.close).toHaveBeenCalledOnce();
    });

    it('bumps the version once to create missing stores', async () => {
        const { open, requests } = stubIndexedDb();
        const first = createFakeDb(['patch:pages'], 5);
        const promise = IDbAccessor.initDatabase({ name: 'test', stores: ['patch:pages', 'patch:tickets'] });
        requests[0].result = first;
        requests[0].onsuccess?.();
        await vi.waitFor(() => expect(requests.length).toBe(2));
        expect(first.close).toHaveBeenCalledOnce();
        expect(open).toHaveBeenLastCalledWith('test', 6);
        const second = createFakeDb(['patch:pages'], 6);
        requests[1].result = second;
        requests[1].onupgradeneeded?.();
        requests[1].onsuccess?.();
        await expect(promise).resolves.toBe(second);
        expect(second.createObjectStore).toHaveBeenCalledWith('patch:tickets', { keyPath: 'id' });
    });

    it('reopens without a version bump when every store exists', async () => {
        const { open, requests } = stubIndexedDb();
        const db = createFakeDb(['patch:pages', 'patch:tickets'], 6);
        const promise = IDbAccessor.initDatabase({ name: 'test', stores: ['patch:pages', 'patch:tickets'] });
        requests[0].result = db;
        requests[0].onsuccess?.();
        await expect(promise).resolves.toBe(db);
        expect(open).toHaveBeenCalledOnce();
        expect(open).toHaveBeenCalledWith('test', undefined);
    });
});
