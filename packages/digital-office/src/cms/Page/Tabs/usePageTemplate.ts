import * as React from 'react';
import type { PageDto } from '@digital-net-org/digital-api-sdk';
import { PathAnalyzer } from '@digital-net-org/digital-core';
import { useQuery } from '@tanstack/react-query';
import { useDigitalNetApi } from '../../../api';
import { useDebouncedCallback } from '../../../ui/hooks';

const TEMPLATE_DEBOUNCE_MS = 500;

/** Resolves the published template covering the given path, following draft path edits. */
export function usePageTemplate(path: string | undefined): PageDto | null {
    const api = useDigitalNetApi();
    const [debouncedPath, setDebouncedPath] = React.useState(path);
    const { run } = useDebouncedCallback(setDebouncedPath, TEMPLATE_DEBOUNCE_MS);

    React.useEffect(() => run(path), [path, run]);

    const enabled = !!debouncedPath && !PathAnalyzer.hasDynamicSlug(debouncedPath);
    const { data } = useQuery<PageDto | null>({
        queryKey: ['Page', 'template', debouncedPath],
        queryFn: async () => {
            const result = await api.catalog.page.getTemplate(debouncedPath!);
            if (result.hasError) {
                throw new Error(result.errors?.[0]?.message ?? 'Failed to resolve page template');
            }
            return result.value ?? null;
        },
        enabled,
        retry: false,
    });

    return (enabled ? data : null) ?? null;
}
