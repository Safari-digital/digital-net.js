import * as React from 'react';
import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Collapse, FormControlLabel, IconButton, Stack, Typography } from '@mui/material';
import { FORM_FIELD_TYPES, type FormFieldType } from '@digital-net-org/digital-api-sdk';
import { DnDraggableRow, DnInput, DnInputAutocomplete, DnSwitch } from '../../../ui';
import { FormFieldRowAdvanced } from './FormFieldRowAdvanced';
import type { FieldChangeHandler, FieldRow, FieldRowField } from './useFieldsState';

export interface FormFieldRowProps {
    row: FieldRow;
    disabled: boolean;
    showErrors: boolean;
    errors: Set<FieldRowField> | undefined;
    onFieldChange: FieldChangeHandler;
    onDelete: (_id: string) => void;
}

const TYPE_OPTIONS: readonly FormFieldType[] = FORM_FIELD_TYPES;

export function FormFieldRow({ row, disabled, showErrors, errors, onFieldChange, onDelete }: FormFieldRowProps) {
    const [expanded, setExpanded] = React.useState(false);

    const nameError = showErrors && (errors?.has('name') ?? false);
    const labelError = showErrors && (errors?.has('label') ?? false);
    const typeError = showErrors && (errors?.has('type') ?? false);

    return (
        <DnDraggableRow id={row.id} disabled={disabled} onDelete={() => onDelete(row.id)}>
            <Stack sx={{ gap: 1, width: '100%' }}>
                <Stack direction="row" sx={{ gap: 1, alignItems: 'center', width: '100%' }}>
                    <Stack sx={{ flex: 2 }}>
                        <DnInput
                            label="Nom"
                            value={row.name}
                            onChange={event => onFieldChange(row.id, 'name', event.target.value)}
                            disabled={disabled}
                            required
                            error={nameError}
                        />
                    </Stack>
                    <Stack sx={{ flex: 2 }}>
                        <DnInputAutocomplete<FormFieldType>
                            label="Type"
                            options={TYPE_OPTIONS as FormFieldType[]}
                            value={row.type}
                            onChange={value => value && onFieldChange(row.id, 'type', value)}
                            disabled={disabled}
                            required
                            error={typeError}
                        />
                    </Stack>
                    <Stack sx={{ flex: 2 }}>
                        <DnInput
                            label="Libellé"
                            value={row.label}
                            onChange={event => onFieldChange(row.id, 'label', event.target.value)}
                            disabled={disabled}
                            required
                            error={labelError}
                        />
                    </Stack>
                    <Stack>
                        <FormControlLabel
                            sx={{ minWidth: 'unset', mx: 1 }}
                            labelPlacement="start"
                            control={
                                <DnSwitch
                                    checked={row.required}
                                    onChange={(_, checked) => onFieldChange(row.id, 'required', checked)}
                                    disabled={disabled}
                                />
                            }
                            label={<Typography variant="caption">Requis</Typography>}
                        />
                    </Stack>
                    <IconButton size="small" onClick={() => setExpanded(state => !state)}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </Stack>
                <Collapse in={expanded} unmountOnExit>
                    <FormFieldRowAdvanced row={row} disabled={disabled} onFieldChange={onFieldChange} />
                </Collapse>
            </Stack>
        </DnDraggableRow>
    );
}
