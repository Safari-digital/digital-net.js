import * as React from 'react';
import type { PageDto, PageSheet } from '@digital-net-org/digital-api-sdk';
import { Divider, Link, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router';
import { dnBuildKeyFromId, useDigitalNetApi } from '../../../api';
import { DnEntityTabHelper, useDnEntityChildSchema, useDnEntityFormContext } from '../../../entity';
import { DnDraggableList, DnLoadingView } from '../../../ui';
import { EditSheetRow } from './EditSheetRow';
import { usePageTemplate } from './usePageTemplate';
import { type SheetRow, useSheetsState } from './useSheetsState';

const noop = () => undefined;

export function PageTabSheets() {
    const { values, setField, disabled, errors, resetSignal } = useDnEntityFormContext<PageDto>();
    const api = useDigitalNetApi();
    const location = useLocation();
    const pageId = values.id;
    const template = usePageTemplate(String(values.path ?? ''));

    const { schemas: sheetSchemas } = useDnEntityChildSchema('Page', 'sheets');
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

    const { data: templateSheets } = useQuery<PageSheet[] | undefined>({
        queryKey: [...dnBuildKeyFromId('Page', template?.id ?? ''), 'sheets'],
        queryFn: async () => {
            const result = await api.catalog.page.getSheetsForEdit(template!.id);
            if (result.hasError) {
                throw new Error(result.errors?.[0]?.message ?? 'Failed to fetch template sheets');
            }
            return result.value;
        },
        enabled: !!template,
        retry: false,
    });

    const [expandedInherited, setExpandedInherited] = React.useState<ReadonlySet<string>>(new Set());
    const toggleInherited = React.useCallback(
        (rowId: string) =>
            setExpandedInherited(current => {
                const next = new Set(current);
                if (!next.delete(rowId)) next.add(rowId);
                return next;
            }),
        []
    );

    const inheritedRows = React.useMemo<SheetRow[]>(
        () =>
            (templateSheets ?? []).map(sheet => ({
                id: sheet.id!,
                entityId: sheet.id,
                name: sheet.name,
                type: sheet.type,
                content: sheet.content,
                published: sheet.published,
                expanded: expandedInherited.has(sheet.id!),
            })),
        [templateSheets, expandedInherited]
    );

    const templateHref = React.useMemo(
        () => (template ? `${location.pathname.replace(/[^/]+$/, template.id)}${location.search}` : ''),
        [location.pathname, location.search, template]
    );

    const draftSheets = (values as { sheets?: PageSheet[] }).sheets;
    const seedSheets = React.useMemo(() => draftSheets ?? initialSheets, [draftSheets, initialSheets]);
    const state = useSheetsState(seedSheets, next => setField('/sheets', next), resetSignal, sheetSchemas);

    const showErrors = errors?.has('sheets') ?? false;

    return (
        <Stack sx={{ gap: 2, height: '100%' }}>
            <DnEntityTabHelper description="Attachez des feuilles CSS, JS ou HTML à votre page." />
            {template && inheritedRows.length > 0 ? (
                <React.Fragment>
                    <Stack sx={{ gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Héritées du template <Link href={templateHref}>{template.path}</Link>
                        </Typography>
                        <DnDraggableList
                            rows={inheritedRows}
                            onSort={noop}
                            renderRow={row => (
                                <EditSheetRow
                                    row={row}
                                    schemas={sheetSchemas}
                                    disabled
                                    showErrors={false}
                                    errors={undefined}
                                    onFieldChange={noop}
                                    onToggleExpand={toggleInherited}
                                    onDelete={() => null}
                                />
                            )}
                        />
                    </Stack>
                    <Divider sx={{ marginRight: 1, marginBottom: 1 }} />
                </React.Fragment>
            ) : null}
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
                            schemas={sheetSchemas}
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
