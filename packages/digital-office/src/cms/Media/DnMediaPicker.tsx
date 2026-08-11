import * as React from 'react';
import type { MediaDto, QueryResult } from '@digital-net-org/digital-api-sdk';
import { Stack } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dnBuildListKey, useDigitalNetApi } from '../../api';
import { DnButton, DnInputAutocomplete } from '../../ui';
import { useDebouncedCallback } from '../../ui/hooks';
import { DnMediaImportDialog } from './DnMediaImportDialog';
import { MediaPreview } from './MediaPreview';

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

export interface DnMediaPickerProps {
    value: MediaDto | null;
    label?: string;
    disabled?: boolean;
    error?: boolean;
    helperText?: string;
    onChange: (_media: MediaDto | null) => void;
}

export function DnMediaPicker({ value, label, disabled, error, helperText, onChange }: DnMediaPickerProps) {
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();
    const [inputText, setInputText] = React.useState('');
    const [search, setSearch] = React.useState('');
    const [size, setSize] = React.useState(PAGE_SIZE);
    const [importOpen, setImportOpen] = React.useState(false);

    const applySearch = useDebouncedCallback((next: string) => setSearch(next.trim()), SEARCH_DEBOUNCE_MS);

    const handleInputChange = React.useCallback(
        (_: unknown, next: string) => {
            setInputText(next);
            applySearch.run(next);
        },
        [applySearch]
    );

    const effectiveSearch = value && search === value.name.trim() ? '' : search;

    const {
        data: pageResult,
        isLoading,
        isFetching,
    } = useQuery<QueryResult<MediaDto>>({
        queryKey: [...dnBuildListKey('Media'), { name: effectiveSearch, size }],
        queryFn: async () => {
            const params: Record<string, unknown> = { size, index: 1 };
            if (effectiveSearch) params.name = effectiveSearch;
            const response = await api.http.request<QueryResult<MediaDto>>({ path: 'cms/media', params });
            return response.data;
        },
    });

    const allOptions = React.useMemo(() => pageResult?.value ?? [], [pageResult]);
    const optionsWithValue = React.useMemo(() => {
        if (!value || allOptions.some(m => m.id === value.id)) return allOptions;
        return [value, ...allOptions];
    }, [allOptions, value]);

    const hasMore = pageResult ? allOptions.length < pageResult.total : false;

    // Importing from here would be half the gesture if it only refreshed the list: the whole point is
    // to use the image that was just uploaded, so the picker selects it rather than asking the editor
    // to find it again. A multi-file import lands on the last one, this field holding a single media.
    const handleImported = React.useCallback(
        async (mediaId: string) => {
            await queryClient.invalidateQueries({ queryKey: dnBuildListKey('Media') });
            const result = await api.catalog.media.getById(mediaId);
            if (!result.hasError && result.value) onChange(result.value);
        },
        [api, onChange, queryClient]
    );

    return (
        <Stack direction="row" sx={{ gap: 2, alignItems: 'flex-start', width: '100%' }}>
            <Stack
                sx={theme => ({
                    flex: 1,
                    minWidth: 100,
                    minHeight: 75,
                    alignSelf: 'center',
                    justifyContent: 'center',
                    border: `1px ${value ? 'solid' : 'dashed'}`,
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                })}
            >
                {value ? <MediaPreview mediaId={value.id} variant="list" /> : null}
            </Stack>
            <Stack spacing={1} sx={{ flex: 8, gap: 2.5 }}>
                <DnInputAutocomplete
                    label={label ?? 'Média'}
                    placeholder="Rechercher un média…"
                    noOptionsText="Aucune ressource"
                    loadingText="Chargement…"
                    error={error}
                    helperText={helperText}
                    disabled={disabled}
                    value={value}
                    options={optionsWithValue}
                    loading={isLoading}
                    inputValue={inputText}
                    onInputChange={handleInputChange}
                    onChange={next => onChange(next ?? null)}
                    getOptionLabel={m => m.name}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    filterOptions={x => x}
                    renderListAction={
                        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                            {hasMore ? (
                                <DnButton
                                    variant="outlined"
                                    size="small"
                                    loading={isFetching}
                                    onClick={() => setSize(s => s + PAGE_SIZE)}
                                >
                                    Charger plus ({allOptions.length}/{pageResult?.total ?? 0})
                                </DnButton>
                            ) : null}
                            <DnButton variant="outlined" size="small" onClick={() => setImportOpen(true)}>
                                Importer un média
                            </DnButton>
                        </Stack>
                    }
                />
            </Stack>
            <DnMediaImportDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onImported={handleImported}
            />
        </Stack>
    );
}
