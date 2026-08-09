import { type HttpClient, HttpClientError } from '@digital-net-org/digital-api-sdk';
import { describe, expect, it, vi } from 'vitest';
import { entityRequest } from './entityRequest';

function clientReturning(data: unknown): HttpClient {
    return { request: vi.fn().mockResolvedValue({ data, status: 200, ok: true }) } as unknown as HttpClient;
}

function clientThrowing(error: unknown): HttpClient {
    return { request: vi.fn().mockRejectedValue(error) } as unknown as HttpClient;
}

const result = { value: 'v', hasError: false, errors: [], infos: [] };

describe('entityRequest', () => {
    it('returns the Result sent by the server', async () => {
        await expect(entityRequest(clientReturning(result), { path: 'cms/pages' })).resolves.toEqual(result);
    });

    it('wraps a body that is not a Result into an empty success', async () => {
        await expect(entityRequest(clientReturning(null), { path: 'cms/pages' })).resolves.toEqual({
            value: null,
            hasError: false,
            errors: [],
            infos: [],
        });
    });

    it('returns the error Result of a 4xx instead of throwing', async () => {
        const errorResult = { value: null, hasError: true, errors: [{ message: 'slug taken' }], infos: [] };
        await expect(
            entityRequest(clientThrowing(new HttpClientError(409, errorResult)), { path: 'p' })
        ).resolves.toEqual(errorResult);
    });

    it('synthesizes a Result when the failing response carries no body', async () => {
        const response = await entityRequest(clientThrowing(new HttpClientError(500, undefined)), { path: 'p' });
        expect(response.hasError).toBe(true);
        expect(response.errors).toEqual([{ message: 'HTTP 500' }]);
    });

    it('lets network failures bubble up', async () => {
        const failure = new TypeError('offline');
        await expect(entityRequest(clientThrowing(failure), { path: 'p' })).rejects.toBe(failure);
    });
});
