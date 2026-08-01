import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '../HttpClient';
import { MutationStreamClient } from './MutationStreamClient';
import type * as BackoffModule from './backoff';

// Record the attempt index the run loop computes on each reconnection, and collapse the real delay
// to ~0 so the test runs fast. `isConnectionStable` keeps its real implementation (via the spread),
// so the stability decision under test is genuine — only the wait duration is neutralized.
const recordedAttempts: number[] = [];
vi.mock('./backoff', async importOriginal => {
    const actual = await importOriginal<typeof BackoffModule>();
    return {
        ...actual,
        computeBackoffDelay: (attempt: number) => {
            recordedAttempts.push(attempt);
            return 0;
        },
    };
});

const BASE_URL = 'http://api.test';

function eventStreamResponse(body: ReadableStream<Uint8Array>): Response {
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function acceptThenCloseResponse(): Response {
    return eventStreamResponse(
        new ReadableStream<Uint8Array>({
            start(controller) {
                controller.close();
            },
        })
    );
}

function stayingOpenStream(): { respond: (_init?: RequestInit) => Promise<Response> } {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const response = eventStreamResponse(
        new ReadableStream<Uint8Array>({
            start(c) {
                controller = c;
            },
        })
    );
    return {
        respond: init => {
            init?.signal?.addEventListener('abort', () => {
                try {
                    controller.error(new DOMException('The operation was aborted.', 'AbortError'));
                } catch {
                    // Already closed.
                }
            });
            return Promise.resolve(response);
        },
    };
}

describe('MutationStreamClient — deferred backoff reset (integration)', () => {
    let http: HttpClient;
    let fetchMock: ReturnType<typeof vi.fn>;
    let disconnect: (() => void) | undefined;

    beforeEach(() => {
        recordedAttempts.length = 0;
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        http = new HttpClient({ baseUrl: BASE_URL });
        disconnect = undefined;
    });

    afterEach(() => {
        disconnect?.();
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('grows the attempt counter on repeated accept-then-close (no ~1s tight loop)', async () => {
        const staying = stayingOpenStream();
        fetchMock
            .mockResolvedValueOnce(acceptThenCloseResponse())
            .mockResolvedValueOnce(acceptThenCloseResponse())
            .mockResolvedValueOnce(acceptThenCloseResponse())
            .mockImplementation((_url: string, init?: RequestInit) => staying.respond(init));

        const client = new MutationStreamClient(http);
        disconnect = client.connect({ onSignal: () => undefined });

        // Each short (accepted-then-closed) connection is below the stability threshold, so the backoff
        // must NOT reset: the attempt index increases 1, 2, 3. A regression that resets on mere
        // acceptance (the old onOpen reset) would record [1, 1, 1] and reconnect in a tight loop.
        await vi.waitFor(() => expect(recordedAttempts.length).toBeGreaterThanOrEqual(3), { timeout: 3000 });
        expect(recordedAttempts.slice(0, 3)).toEqual([1, 2, 3]);
    });
});
