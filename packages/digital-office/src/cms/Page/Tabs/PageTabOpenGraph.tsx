import * as React from 'react';
import { Alert as MuiAlert, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { OpenGraphEntry, PageDto } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, useDigitalNetApi } from '../../../api';
import { DnEntityTabHelper, useDnEntityFormContext, useDnEntitySchema } from '../../../entity';
import { DnButton, DnDraggableList, DnExternalButton, DnLoadingView } from '../../../ui';
import { EditOpenGraphRow } from './EditOpenGraphRow';
import { useOgSchema } from './useOgSchema';
import { useOgState } from './useOgState';

const OG_DOC_URL = 'https://ogp.me/';

export function PageTabOpenGraph() {
    const { values, setField, disabled, errors, resetSignal } = useDnEntityFormContext<PageDto>();
    const api = useDigitalNetApi();
    const pageId = values.id;

    const { schemas: ogEntrySchemas } = useDnEntitySchema('OpenGraphEntry');
    const { data: initialEntries, isLoading: isLoadingEntries } = useQuery<OpenGraphEntry[] | undefined>({
        queryKey: [...dnBuildKeyFromId('Page', pageId!), 'openGraph'],
        queryFn: async () => {
            const result = await api.catalog.page.getOpenGraphForEdit(pageId!);
            if (result.hasError) {
                throw new Error(result.errors?.[0]?.message ?? 'Failed to fetch openGraph');
            }
            return result.value;
        },
        enabled: !!pageId,
        retry: false,
    });

    const draftEntries = (values as { openGraph?: OpenGraphEntry[] }).openGraph;
    const seedEntries = React.useMemo(() => draftEntries ?? initialEntries, [draftEntries, initialEntries]);

    const state = useOgState(seedEntries, entries => setField('/openGraph', entries), resetSignal, ogEntrySchemas);
    const { loading: loadingSchema, error, reload } = useOgSchema();

    const showErrors = errors?.has('openGraph') ?? false;

    const renderBody = () => {
        if (loadingSchema || isLoadingEntries) {
            return <DnLoadingView />;
        }
        if (error) {
            return (
                <MuiAlert severity="error" action={<DnButton onClick={reload}>Réessayer</DnButton>}>
                    Impossible de charger les schemas OpenGraph. Si le problème persiste, contactez votre
                    administrateur.
                </MuiAlert>
            );
        }
        return (
            <DnDraggableList
                rows={state.rows}
                onSort={state.handleReorder}
                onCreate={state.canAdd ? state.handleAdd : undefined}
                disabled={disabled}
                renderRow={row => (
                    <EditOpenGraphRow
                        row={row}
                        disabled={disabled ?? false}
                        showErrors={showErrors}
                        errors={state.rowErrors.get(row.id)}
                        options={state.options}
                        onPropertyChange={state.handlePropertyChange}
                        onContentChange={state.handleContentChange}
                        onDelete={state.handleDelete}
                    />
                )}
            />
        );
    };

    return (
        <Stack sx={{ gap: 2, height: '100%' }}>
            <DnEntityTabHelper description="Définissez les métadonnées OpenGraph de votre page.">
                <DnExternalButton link={OG_DOC_URL}>Documentation</DnExternalButton>
            </DnEntityTabHelper>
            {renderBody()}
        </Stack>
    );
}
