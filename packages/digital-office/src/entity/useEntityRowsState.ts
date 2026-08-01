import * as React from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { useDebouncedCallback } from '../ui/hooks';

export interface BaseRow {
    id: string;
    entityId?: string;
}

export interface UseEntityRowsStateOptions<TRow extends BaseRow, TPayload> {
    initial: TPayload[] | undefined;
    onChange: (_next: TPayload[]) => void;
    resetSignal?: number;
    toRows: (_initial: TPayload[] | undefined) => TRow[];
    toPayload: (_rows: TRow[]) => TPayload[];
    payloadEqual: (_a: TPayload[] | undefined, _b: TPayload[] | undefined) => boolean;
    createRow: () => TRow;
    computeErrors?: (_rows: TRow[]) => Map<string, Set<string>>;
    debounceMs?: number;
}

export interface UseEntityRowsStateResult<TRow extends BaseRow> {
    rows: TRow[];
    rowErrors: Map<string, Set<string>>;
    isValid: boolean;
    handleAdd: () => void;
    handleDelete: (_id: string) => void;
    handleReorder: (_fromId: string, _toId: string) => void;
    commitWith: (_updater: (_current: TRow[]) => TRow[], _opts?: { debounce?: boolean }) => void;
    setRowsLocal: (_updater: (_current: TRow[]) => TRow[]) => void;
}

export function useEntityRowsState<TRow extends BaseRow, TPayload>(
    options: UseEntityRowsStateOptions<TRow, TPayload>
): UseEntityRowsStateResult<TRow> {
    const { initial, onChange, resetSignal, toRows, toPayload, payloadEqual, createRow, computeErrors, debounceMs } =
        options;

    const [rows, setRows] = React.useState<TRow[]>(() => toRows(initial));
    const [lastInitial, setLastInitial] = React.useState(initial);
    const [lastResetSignal, setLastResetSignal] = React.useState(resetSignal);
    const rowsRef = React.useRef(rows);
    const onChangeRef = React.useRef(onChange);
    const toPayloadRef = React.useRef(toPayload);

    if (initial !== lastInitial) {
        setLastInitial(initial);
        if (!payloadEqual(toPayload(rows), initial)) {
            setRows(toRows(initial));
        }
    }
    if (resetSignal !== lastResetSignal) {
        setLastResetSignal(resetSignal);
        setRows(toRows(initial));
    }

    React.useEffect(() => {
        rowsRef.current = rows;
    }, [rows]);

    React.useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    React.useEffect(() => {
        toPayloadRef.current = toPayload;
    }, [toPayload]);

    const doFlush = React.useCallback(() => {
        onChangeRef.current(toPayloadRef.current(rowsRef.current));
    }, []);

    const debouncedFlush = useDebouncedCallback(doFlush, debounceMs ?? 0);

    const flushNow = React.useCallback(() => {
        debouncedFlush.cancel();
        doFlush();
    }, [debouncedFlush, doFlush]);

    const flushDebounced = React.useCallback(() => {
        if (debounceMs && debounceMs > 0) debouncedFlush.run();
        else flushNow();
    }, [debounceMs, debouncedFlush, flushNow]);

    const commitWith = React.useCallback(
        (updater: (_current: TRow[]) => TRow[], opts?: { debounce?: boolean }) => {
            const current = rowsRef.current;
            const next = updater(current);
            if (next === current) return;
            setRows(next);
            rowsRef.current = next;
            if (opts?.debounce) flushDebounced();
            else flushNow();
        },
        [flushDebounced, flushNow]
    );

    const setRowsLocal = React.useCallback((updater: (_current: TRow[]) => TRow[]) => {
        const current = rowsRef.current;
        const next = updater(current);
        if (next === current) return;
        setRows(next);
        rowsRef.current = next;
    }, []);

    const handleAdd = React.useCallback(() => {
        commitWith(current => [...current, createRow()]);
    }, [commitWith, createRow]);

    const handleDelete = React.useCallback(
        (id: string) => {
            commitWith(current => {
                const next = current.filter(r => r.id !== id);
                return next.length === current.length ? current : next;
            });
        },
        [commitWith]
    );

    const handleReorder = React.useCallback(
        (fromId: string, toId: string) => {
            commitWith(current => {
                const fromIndex = current.findIndex(r => r.id === fromId);
                const toIndex = current.findIndex(r => r.id === toId);
                if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;
                return arrayMove(current, fromIndex, toIndex);
            });
        },
        [commitWith]
    );

    const rowErrors = React.useMemo(() => computeErrors?.(rows) ?? new Map(), [rows, computeErrors]);
    const isValid = rowErrors.size === 0;

    return {
        rows,
        rowErrors,
        isValid,
        handleAdd,
        handleDelete,
        handleReorder,
        commitWith,
        setRowsLocal,
    };
}
