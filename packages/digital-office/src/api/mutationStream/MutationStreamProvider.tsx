import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MutationStreamClient } from '@digital-net-org/digital-api-sdk';
import type { MutationSignal } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetUser } from '../../app';
import { useDigitalNetApi } from '../useDigitalNetApi';
import { type DnInvalidationRules, type InvalidationFilter, resolveInvalidations } from './invalidationMap';

const FLUSH_DELAY_MS = 250;
const SIGNAL_CHANNEL = 'dn-mutation-signals';
const LEADER_LOCK = 'dn-mutation-sse-leader';

// One stream per browser: the tab holding this exclusive Web Lock is the "leader" and owns
// the single SSE connection. It rebroadcasts every signal on this channel so follower tabs invalidate too.

export interface MutationStreamProviderProps {
    children: React.ReactNode;
    invalidationRules?: DnInvalidationRules;
}

export function MutationStreamProvider({ invalidationRules, children }: MutationStreamProviderProps) {
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();
    const { user } = useDigitalNetUser();
    const userId = user?.id;
    const clientId = api.http.getClientId();

    // Latest user id and rules, kept available to the stable signal handler (never read/written during render).
    const userIdRef = React.useRef<string | undefined>(undefined);
    React.useEffect(() => void (userIdRef.current = userId));
    const rulesRef = React.useRef<DnInvalidationRules | undefined>(undefined);
    React.useEffect(() => void (rulesRef.current = invalidationRules));

    const pendingRef = React.useRef(new Map<string, InvalidationFilter>());
    const flushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const flush = React.useCallback(() => {
        flushTimerRef.current = null;
        const filters = [...pendingRef.current.values()];
        pendingRef.current.clear();
        for (const filter of filters) {
            void queryClient.invalidateQueries(filter);
        }
    }, [queryClient]);

    const handleSignal = React.useCallback(
        (signal: MutationSignal) => {
            // Drop only this tab's own echo. The server stamps each live signal with the originating tab's
            // client id.
            if (signal.originClientId && signal.originClientId === clientId) return;
            for (const filter of resolveInvalidations(signal, userIdRef.current, rulesRef.current)) {
                const key = filter.queryKey ? JSON.stringify(filter.queryKey) : `predicate:${signal.entity}`;
                pendingRef.current.set(key, filter);
            }
            flushTimerRef.current ??= setTimeout(flush, FLUSH_DELAY_MS);
        },
        [flush, clientId]
    );

    // Stable handle so the connection effect never re-runs (and re-elects a leader) on a render.
    const handleSignalRef = React.useRef(handleSignal);
    React.useEffect(() => void (handleSignalRef.current = handleSignal));

    React.useEffect(() => {
        if (userId == null) return;

        const cleanups: Array<() => void> = [];
        const clearFlush = () => {
            if (flushTimerRef.current) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
            }
        };
        cleanups.push(clearFlush);

        const startStream = (broadcast?: (_signal: MutationSignal) => void) => {
            const client = new MutationStreamClient(api.http);
            return client.connect({
                onSignal: signal => {
                    handleSignalRef.current(signal);
                    broadcast?.(signal);
                },
                onError: (error, attempt) => {
                    if (attempt >= 3) {
                        console.warn(`[digital-office] mutation stream reconnect failing (attempt ${attempt})`, error);
                    }
                },
            });
        };

        const canShare = typeof BroadcastChannel !== 'undefined' && 'locks' in navigator;
        if (!canShare) {
            cleanups.push(startStream());
            return () => cleanups.forEach(cleanup => cleanup());
        }

        const channel = new BroadcastChannel(SIGNAL_CHANNEL);
        channel.onmessage = (event: MessageEvent<MutationSignal>) => handleSignalRef.current(event.data);
        cleanups.push(() => channel.close());

        const lockAbort = new AbortController();
        let cancelled = false;
        let releaseLeader: (() => void) | undefined;
        let stopStream: (() => void) | undefined;

        void navigator.locks
            .request(
                LEADER_LOCK,
                { signal: lockAbort.signal },
                () =>
                    // Holding the lock = being the leader. The lock is released when this promise settles, at
                    // which point another tab's pending request wins and becomes the new leader.
                    new Promise<void>(resolve => {
                        if (cancelled) {
                            resolve();
                            return;
                        }
                        releaseLeader = resolve;
                        stopStream = startStream(signal => channel.postMessage(signal));
                    })
            )
            // Rejects with AbortError when we were still waiting (a follower) at cleanup — expected.
            .catch(() => undefined);

        cleanups.push(() => {
            cancelled = true;
            stopStream?.();
            releaseLeader?.(); // leader: release the lock so another tab takes over
            lockAbort.abort(); // follower: cancel the still-pending request
        });

        return () => cleanups.forEach(cleanup => cleanup());
    }, [api, userId]);

    return <React.Fragment>{children}</React.Fragment>;
}
