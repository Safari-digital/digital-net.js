import * as React from 'react';
import type { SheetType } from '@digital-net-org/digital-api-sdk';
import { Box, Collapse, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { LazyDnEditorCode } from '../../../editor';
import { DnDraggableRow, DnExpandButton, DnInput, DnSwitch } from '../../../ui';
import { usePageVariables } from './usePageVariables';
import type { SheetRow } from './useSheetsState';

const LANGUAGE_TYPES = { css: 'css', js: 'javascript', html: 'html' } as const;
const LANGUAGE_TYPES_MAP = Object.keys(LANGUAGE_TYPES) as (keyof typeof LANGUAGE_TYPES)[];

export interface EditSheetRowProps {
    row: SheetRow;
    disabled: boolean;
    showErrors: boolean;
    errors: Set<'name' | 'type' | 'content' | 'published'> | undefined;
    onFieldChange: <K extends 'name' | 'type' | 'content' | 'published'>(
        _rowId: string,
        _field: K,
        _value: SheetRow[K]
    ) => void;
    onToggleExpand: (_rowId: string) => void;
    onDelete?: (_rowId: string) => void;
}

export function EditSheetRow({
    row,
    disabled,
    showErrors,
    errors,
    onFieldChange,
    onToggleExpand,
    onDelete,
}: EditSheetRowProps) {
    const nameError = showErrors && (errors?.has('name') ?? false);
    const contentError = showErrors && (errors?.has('content') ?? false);
    const variables = usePageVariables();

    React.useEffect(() => {
        if (row.expanded || !contentError) return;
        onToggleExpand(row.id);
    }, [contentError, onToggleExpand, row.expanded, row.id]);

    return (
        <DnDraggableRow id={row.id} disabled={disabled} onDelete={onDelete}>
            <Header>
                <DnInput
                    label="Nom"
                    value={row.name}
                    onChange={e => onFieldChange(row.id, 'name', e.target.value)}
                    disabled={disabled}
                    required
                    error={nameError}
                    sx={{ flex: 2 }}
                />
                <TextField
                    select
                    value={row.type}
                    onChange={e => onFieldChange(row.id, 'type', e.target.value as SheetType)}
                    disabled={disabled}
                    sx={{ minWidth: 120 }}
                    slotProps={{
                        inputLabel: { shrink: true },
                        select: { displayEmpty: true, sx: { maxHeight: 28 } },
                    }}
                >
                    {LANGUAGE_TYPES_MAP.map(x => (
                        <MenuItem key={x} value={x}>
                            {x.toUpperCase()}
                        </MenuItem>
                    ))}
                </TextField>
                <Stack>
                    <FormControlLabel
                        sx={{
                            display: 'flex',
                            minWidth: 0,
                        }}
                        control={
                            <DnSwitch
                                checked={row.published}
                                onChange={(_, checked) => onFieldChange(row.id, 'published', checked)}
                                disabled={disabled}
                            />
                        }
                        label="Publié"
                    />
                </Stack>
                <DnExpandButton
                    onClick={() => onToggleExpand(row.id)}
                    expanded={row.expanded}
                    disabled={contentError}
                />
            </Header>
            <Collapse in={row.expanded} unmountOnExit>
                <Box sx={{ height: 320, marginTop: 1 }}>
                    <LazyDnEditorCode
                        value={row.content ?? ''}
                        onChange={value => onFieldChange(row.id, 'content', value)}
                        language={LANGUAGE_TYPES[row.type]}
                        disabled={disabled}
                        error={contentError}
                        templateVariables={variables}
                    />
                </Box>
            </Collapse>
        </DnDraggableRow>
    );
}

const Header = styled(Stack)(
    ({ theme }) => css`
        flex-direction: row;
        align-items: center;
        gap: ${theme.spacing(1)};
    `
);
