import * as React from 'react';
import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { PageDto, PageSheet } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, useDigitalNetApi } from '../../../api';
import { DnEntityTabHelper, useDnEntityFormContext, useDnEntitySchema } from '../../../entity';
import { DnDraggableList, DnLoadingView } from '../../../ui';
import { EditSheetRow } from './EditSheetRow';
import { useSheetsState } from './useSheetsState';

export function PageTabSheets() {
    const { values, setField, disabled, errors, resetSignal } = useDnEntityFormContext<PageDto>();
    const api = useDigitalNetApi();
    const pageId = values.id;

    const { schemas: sheetSchemas } = useDnEntitySchema('Sheet');
    const { data: initialSheets, isLoading: isLoadingSheets } = useQuery<PageSheet[] | undefined>({
        queryKey: [...dnBuildKeyFromId('Page', pageId!), 'sheets'],
        queryFn: async () => {
            const result = await api.catalog.page.getSheetsForEdit(pageId!);
            if (result.hasError) {
                throw new Error(result.errors?.[0]?.message ?? 'Failed to fetch sheets');
            }
            return result.value;
        },
        enabled: !!pageId,
        retry: false,
    });

    const draftSheets = (values as { sheets?: PageSheet[] }).sheets;
    const seedSheets = React.useMemo(() => draftSheets ?? initialSheets, [draftSheets, initialSheets]);
    const state = useSheetsState(seedSheets, next => setField('/sheets', next), resetSignal, sheetSchemas);

    const showErrors = errors?.has('sheets') ?? false;

    return (
        <Stack sx={{ gap: 2, height: '100%' }}>
            <DnEntityTabHelper description="Attachez des feuilles CSS, JS ou HTML à votre page." />
            {isLoadingSheets ? (
                <DnLoadingView />
            ) : (
                <DnDraggableList
                    rows={state.rows}
                    onSort={state.handleReorder}
                    onCreate={state.handleAdd}
                    disabled={disabled}
                    renderRow={row => (
                        <EditSheetRow
                            row={row}
                            disabled={disabled ?? false}
                            showErrors={showErrors}
                            errors={state.rowErrors.get(row.id)}
                            onFieldChange={state.handleFieldChange}
                            onToggleExpand={state.handleToggleExpand}
                            onDelete={state.handleDelete}
                        />
                    )}
                />
            )}
        </Stack>
    );
}
