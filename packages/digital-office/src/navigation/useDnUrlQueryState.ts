import * as React from 'react';
import { useSearchParams } from 'react-router';

export interface DnUrlParam<T> {
    defaultValue: T;
    key: string;
    parse(_raw: string | null): T;
    serialize(_value: T): string | null;
}

export type DnUrlQuerySchema = Record<string, DnUrlParam<unknown>>;

export type DnUrlQueryState<S extends DnUrlQuerySchema> = {
    [K in keyof S]: S[K] extends DnUrlParam<infer T> ? T : never;
};

/**
 * Binds a schema of `DnUrlParam<T>` descriptors to the current URL's query
 * string and returns a `[state, setState]` tuple reminiscent of `useState`.
 *
 * - `state` is the parsed, typed snapshot of the current URL params.
 * - `setState(patch)` merges the given partial back into the URL; setting a
 *   field to its default (or to a value that serializes to `null`) removes
 *   the key from the URL.
 * - `options.replace` (default `true`) controls whether the update replaces
 *   the current history entry or pushes a new one.
 *
 * Build each descriptor with `DnUrlParamBuilder.build*`:
 *
 * ```ts
 * const [state, setState] = useDnUrlQueryState({
 *     page: DnUrlParamBuilder.buildInt(1, 'page'),
 *     search: DnUrlParamBuilder.buildString('', 'q'),
 * });
 * ```
 */
export function useDnUrlQueryState<S extends DnUrlQuerySchema>(
    schema: S,
    options: { replace?: boolean } = {}
): [DnUrlQueryState<S>, (_patch: Partial<DnUrlQueryState<S>>) => void] {
    const { replace = true } = options;
    const [searchParams, setSearchParams] = useSearchParams();

    const state = React.useMemo(() => {
        const result = {} as DnUrlQueryState<S>;
        for (const key in schema) {
            (result as Record<string, unknown>)[key] = schema[key].parse(searchParams.get(schema[key].key));
        }
        return result;
    }, [schema, searchParams]);

    const setState = React.useCallback(
        (patch: Partial<DnUrlQueryState<S>>) => {
            setSearchParams(
                prev => {
                    const next = new URLSearchParams(prev);
                    for (const key in patch) {
                        const urlKey = schema[key].key;
                        const serialized = schema[key].serialize(patch[key] as never);
                        if (serialized === null) {
                            next.delete(urlKey);
                        } else {
                            next.set(urlKey, serialized);
                        }
                    }
                    return next;
                },
                { replace }
            );
        },
        [schema, setSearchParams, replace]
    );

    return [state, setState];
}
