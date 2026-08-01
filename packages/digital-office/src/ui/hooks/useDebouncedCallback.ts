import * as React from 'react';

export interface DebouncedCallback<A extends unknown[]> {
    run: (..._args: A) => void;
    cancel: () => void;
}

// Trailing-edge debounce that always runs the latest callback closure. `run` and `cancel` are
// stable; the pending call is dropped on unmount, or explicitly via cancel() before a flush.
export function useDebouncedCallback<A extends unknown[]>(
    callback: (..._args: A) => void,
    delayMs: number
): DebouncedCallback<A> {
    const callbackRef = React.useRef(callback);
    const delayRef = React.useRef(delayMs);
    const timerRef = React.useRef<number | null>(null);
    const argsRef = React.useRef<A | null>(null);

    React.useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    React.useEffect(() => {
        delayRef.current = delayMs;
    }, [delayMs]);

    const cancel = React.useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        argsRef.current = null;
    }, []);

    const run = React.useCallback((...args: A) => {
        argsRef.current = args;
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null;
            const pending = argsRef.current;
            argsRef.current = null;
            if (pending) callbackRef.current(...pending);
        }, delayRef.current);
    }, []);

    React.useEffect(() => cancel, [cancel]);

    return React.useMemo(() => ({ run, cancel }), [run, cancel]);
}
