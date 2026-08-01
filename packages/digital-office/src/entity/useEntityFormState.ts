import React from 'react';
import type { DnEntityFormBinding } from './useDnEntityFormContext';

/**
 * In-memory form state for create mode. No IDB persistence — values are lost
 * if the page unmounts. Pair with `useDnRouterBlocker` to prompt the
 * user before navigating away.
 */
export function useEntityFormState<T extends object>(): DnEntityFormBinding<T> {
    const [values, setValues] = React.useState<Partial<T>>({});
    const [isDirty, setIsDirty] = React.useState(false);

    const setField = React.useCallback((path: string, value: unknown) => {
        if (!path.startsWith('/')) throw new Error(`useEntityFormState: path must start with '/', got "${path}"`);
        const key = path.slice(1).split('/')[0];
        setValues(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    }, []);

    return { values, setField, isDirty };
}
