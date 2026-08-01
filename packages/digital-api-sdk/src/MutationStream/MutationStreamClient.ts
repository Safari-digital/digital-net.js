import { URLResolver } from '@digital-net-org/digital-core';
import type { HttpClient } from '../HttpClient';
import { SseParser } from './SseParser';
import { StreamRequestError } from './StreamRequestError';
import { computeBackoffDelay, isConnectionStable } from './backoff';
import type { MutationSignal, MutationStreamConnectOptions, MutationStreamState } from './types';

const DN_API_EVENTS_MUTATION_STREAM = 'events/mutation/stream' as const;
const MUTATION_EVENT_TYPE = 'mutation';
const INACTIVITY_TIMEOUT_MS = 60_000;

/**
 * Consumes the API mutation stream. Authentication relies entirely on the refresh-token cookie.
 * Reconnects automatically with exponential backoff and resumes from the last received cursor
 * (`?lastEventId=`): missed signals are replayed by the server catch-up (up to 1000 mutations).
 */
export class MutationStreamClient {
    private readonly http: HttpClient;

    private abortController: AbortController | null = null;
    private lastEventId: string | undefined;
    private state: MutationStreamState = 'closed';

    public constructor(http: HttpClient) {
        this.http = http;
    }

    public getState(): MutationStreamState {
        return this.state;
    }

    /** Opens the stream (closing any previous connection) and returns a disconnect function. */
    public connect(options: MutationStreamConnectOptions): () => void {
        this.disconnect();
        const abortController = new AbortController();
        this.abortController = abortController;
        void this.runLoop(options, abortController);
        return () => {
            if (this.abortController === abortController) {
                this.disconnect();
            }
        };
    }

    public disconnect(): void {
        this.abortController?.abort();
        this.abortController = null;
    }

    private async runLoop(options: MutationStreamConnectOptions, abortController: AbortController): Promise<void> {
        const { signal } = abortController;
        let attempt = 0;

        while (!signal.aborted) {
            this.setState('connecting', options);
            let openedAt: number | null = null;
            let failure: unknown;
            let threw = false;
            try {
                await this.streamOnce(options, signal, () => {
                    openedAt = Date.now();
                    this.setState('open', options);
                });
            } catch (error) {
                if (signal.aborted) {
                    break;
                }
                // Including 401s (invalid/rotated key): keep retrying with backoff.
                threw = true;
                failure = error;
            }
            if (signal.aborted) {
                break;
            }
            // Reset the backoff only after a stable connection. Otherwise an accept-then-close server would
            // reconnect in a ~1s tight loop forever instead of backing off.
            attempt = isConnectionStable(openedAt, Date.now()) ? 0 : attempt + 1;
            if (threw) {
                options.onError?.(failure, attempt);
            }
            this.setState('reconnecting', options);
            await this.delay(computeBackoffDelay(attempt), signal);
        }

        const isCurrent = this.abortController === abortController;
        if (isCurrent) {
            this.abortController = null;
        }
        if (isCurrent || this.abortController === null) {
            this.setState('closed', options);
        }
    }

    private async streamOnce(
        options: MutationStreamConnectOptions,
        signal: AbortSignal,
        onOpen: () => void
    ): Promise<void> {
        const inner = new AbortController();
        const onOuterAbort = (): void => inner.abort(signal.reason);
        if (signal.aborted) inner.abort(signal.reason);
        else signal.addEventListener('abort', onOuterAbort, { once: true });

        let watchdog: ReturnType<typeof setTimeout> | null = null;
        const armWatchdog = (): void => {
            if (watchdog !== null) clearTimeout(watchdog);
            watchdog = setTimeout(() => inner.abort(new Error('SSE inactivity timeout')), INACTIVITY_TIMEOUT_MS);
        };

        try {
            armWatchdog();
            const response = await fetch(this.resolveUrl(), {
                headers: { Accept: 'text/event-stream' },
                credentials: 'include',
                signal: inner.signal,
            });
            if (!response.ok || !response.body) {
                void response.body?.cancel(); // free the socket instead of leaking it to GC
                throw new StreamRequestError(response.status);
            }
            if (!(response.headers.get('content-type') ?? '').toLowerCase().includes('text/event-stream')) {
                void response.body.cancel();
                throw new Error('Mutation stream returned a non-SSE content-type');
            }
            onOpen();
            armWatchdog();

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const parser = new SseParser();

            for (;;) {
                const { done, value } = await reader.read();
                if (done) {
                    return;
                }
                armWatchdog();
                for (const event of parser.push(decoder.decode(value, { stream: true }))) {
                    if (event.id) {
                        this.lastEventId = event.id;
                    }
                    if (event.event === MUTATION_EVENT_TYPE && event.data) {
                        this.emitSignal(event.data, options);
                    }
                }
            }
        } finally {
            if (watchdog !== null) clearTimeout(watchdog);
            signal.removeEventListener('abort', onOuterAbort);
        }
    }

    private emitSignal(data: string, options: MutationStreamConnectOptions): void {
        try {
            options.onSignal(JSON.parse(data) as MutationSignal);
        } catch {
            // Malformed frame: skip it — the next signal (or a refetch) restores consistency.
        }
    }

    private resolveUrl(): string {
        const url = URLResolver.resolve(this.http.getBaseUrl(), DN_API_EVENTS_MUTATION_STREAM);
        const params: Record<string, string> = {};
        if (this.lastEventId) {
            params['lastEventId'] = this.lastEventId;
        }
        return Object.keys(params).length > 0 ? URLResolver.buildQuery(url, params) : url;
    }

    private setState(state: MutationStreamState, options: MutationStreamConnectOptions): void {
        if (this.state === state) {
            return;
        }
        this.state = state;
        options.onStateChange?.(state);
    }

    private delay(ms: number, signal: AbortSignal): Promise<void> {
        return new Promise(resolve => {
            const done = (): void => {
                clearTimeout(timeout);
                signal.removeEventListener('abort', done);
                resolve();
            };
            const timeout = setTimeout(done, ms);
            signal.addEventListener('abort', done, { once: true });
        });
    }
}
