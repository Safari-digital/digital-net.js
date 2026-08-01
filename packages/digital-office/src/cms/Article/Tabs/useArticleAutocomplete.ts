import * as React from 'react';
import { useDebouncedCallback } from '../../../ui/hooks';

const DEFAULT_DEBOUNCE_MS = 500;

export interface UseArticleAutocompleteResult {
    inputValue: string;
    search: string;
    onInputChange: (_event: unknown, _next: string) => void;
}

export function useArticleAutocomplete(debounceMs: number = DEFAULT_DEBOUNCE_MS): UseArticleAutocompleteResult {
    const [inputValue, setInputValue] = React.useState('');
    const [search, setSearch] = React.useState('');

    const applySearch = useDebouncedCallback((next: string) => setSearch(next.trim()), debounceMs);

    const onInputChange = React.useCallback(
        (_event: unknown, next: string) => {
            setInputValue(next);
            applySearch.run(next);
        },
        [applySearch]
    );

    return { inputValue, search, onInputChange };
}
