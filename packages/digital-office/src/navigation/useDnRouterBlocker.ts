import React from 'react';
import { useBlocker } from 'react-router';

export interface UseDnRouterBlockerOptions {
    when: boolean;
}

export interface UseDnRouterBlockerResult {
    isBlocked: boolean;
    confirm: () => void;
    cancel: () => void;
}

/**
 * Simplified wrapper around React Router's `useBlocker` (requires a data
 * router created via `createBrowserRouter`) that also attaches a native
 * `beforeunload` handler for tab close / reload. Returns dialog control state
 * so the caller can render a custom confirmation UI and drive it via
 * `confirm()` (proceed with the pending navigation) or `cancel()` (stay).
 *
 * Navigations that keep the same `pathname` (e.g. tab switching via query
 * string, hash updates) are treated as intra-page state changes and are
 * never blocked.
 */
export function useDnRouterBlocker({ when }: UseDnRouterBlockerOptions): UseDnRouterBlockerResult {
    const shouldBlock = React.useCallback<
        (_args: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) => boolean
    >(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname, [when]);
    const blocker = useBlocker(shouldBlock);

    React.useEffect(() => {
        if (!when) return;
        const handler = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [when]);

    const isBlocked = blocker.state === 'blocked';
    const confirm = React.useCallback(() => (blocker.state === 'blocked' ? blocker.proceed() : void 0), [blocker]);
    const cancel = React.useCallback(() => (blocker.state === 'blocked' ? blocker.reset() : void 0), [blocker]);

    return { isBlocked, confirm, cancel };
}
