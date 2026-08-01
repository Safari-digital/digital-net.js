import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { IconButton, Stack, Typography } from '@mui/material';
import { DnButton, DnInput } from '../../../ui';
import { FormFieldRowDefaultValue } from './FormFieldRowDefaultValue';
import { useFieldOptions } from './useFieldOptions';
import { useFieldType } from './useFieldType';
import { useFieldValidation } from './useFieldValidation';
import type { FieldChangeHandler, FieldRow } from './useFieldsState';

export interface FormFieldRowAdvancedProps {
    row: FieldRow;
    disabled: boolean;
    onFieldChange: FieldChangeHandler;
}

export function FormFieldRowAdvanced({ row, disabled, onFieldChange }: FormFieldRowAdvancedProps) {
    const { hasPlaceholder, hasDefaultValue, hasLengthValidation, hasRangeValidation, hasOptions } = useFieldType(
        row.type
    );
    const { validation, setValidation } = useFieldValidation(row, onFieldChange);
    const { optionRows, validOptions, handleAddOption, handleEditOption, handleRemoveOption } = useFieldOptions(
        row,
        onFieldChange
    );

    return (
        <Stack sx={{ gap: 1, py: 1 }}>
            <Typography variant="caption">Options avancées</Typography>
            <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap' }}>
                {(hasPlaceholder || hasDefaultValue) && (
                    <Stack sx={{ gap: 2 }}>
                        {hasDefaultValue && (
                            <FormFieldRowDefaultValue
                                row={row}
                                disabled={disabled}
                                validOptions={validOptions}
                                onFieldChange={onFieldChange}
                            />
                        )}
                        {hasPlaceholder && (
                            <DnInput
                                label="Placeholder"
                                value={row.placeholder ?? ''}
                                onChange={event =>
                                    onFieldChange(row.id, 'placeholder', event.target.value || undefined)
                                }
                                disabled={disabled}
                            />
                        )}
                    </Stack>
                )}
                {hasLengthValidation && (
                    <Stack sx={{ gap: 2, flexDirection: 'column', width: '220px' }}>
                        <DnInput
                            label="Caractères minimum autorisée"
                            type="number"
                            value={validation.minLength ?? ''}
                            onChange={event => setValidation('minLength', event.target.value)}
                            disabled={disabled}
                        />
                        <DnInput
                            label="Caractères maximum autorisée"
                            type="number"
                            value={validation.maxLength ?? ''}
                            onChange={event => setValidation('maxLength', event.target.value)}
                            disabled={disabled}
                        />
                    </Stack>
                )}
                {hasRangeValidation && (
                    <Stack sx={{ gap: 2, flexDirection: 'column', width: '220px' }}>
                        <DnInput
                            label="Valeur minimum autorisée"
                            type="number"
                            value={validation.min ?? ''}
                            onChange={event => setValidation('min', event.target.value)}
                            disabled={disabled}
                        />
                        <DnInput
                            label="Valeur maximum autorisée"
                            type="number"
                            value={validation.max ?? ''}
                            onChange={event => setValidation('max', event.target.value)}
                            disabled={disabled}
                        />
                    </Stack>
                )}
                {hasOptions && (
                    <Stack direction="row" sx={{ justifyContent: 'center' }}>
                        <DnButton
                            size="small"
                            variant="text"
                            onClick={handleAddOption}
                            disabled={disabled}
                            aria-label="Ajouter une option"
                            icon={<AddIcon fontSize="small" />}
                        >
                            Ajouter une option
                        </DnButton>
                    </Stack>
                )}
            </Stack>
            {hasOptions && (
                <Stack sx={{ gap: 1 }}>
                    {optionRows.map(option => (
                        <Stack key={option.id} direction="row" sx={{ gap: 0.5, alignItems: 'center', maxWidth: 600 }}>
                            <DnInput
                                value={option.value}
                                onChange={event => handleEditOption(option.id, event.target.value)}
                                disabled={disabled}
                            />
                            <IconButton size="small" onClick={() => handleRemoveOption(option.id)} disabled={disabled}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}
