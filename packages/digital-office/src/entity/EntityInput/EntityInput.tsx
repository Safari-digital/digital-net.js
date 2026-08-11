import * as React from 'react';
import type { SchemaProperty, TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { Divider, FormControl, FormControlLabel, FormHelperText, MenuItem, TextField } from '@mui/material';
import { DnInput, DnInputDate, DnInputInterpolated, type DnInputProps, DnSwitch } from '../../ui';
import { fromDateTimeLocal, toDateTimeLocal } from './dateTimeLocal';

export interface EntityInputProps {
    schema: SchemaProperty;
    value: any;
    onChange: (_value: any) => void;
    label?: string;
    helperText?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    multiline?: boolean;
    rows?: number;
    error?: boolean;
    variables: TemplateVariable[];
}

export function EntityInput({
    schema,
    value,
    onChange,
    label,
    helperText,
    placeholder,
    disabled,
    multiline,
    rows,
    error,
    variables,
}: EntityInputProps) {
    const resolvedLabel = React.useMemo(() => label ?? schema.name, [label, schema]);
    const resolvedDisabled = React.useMemo(
        () => disabled || schema.isReadOnly || schema.isIdentity,
        [schema, disabled]
    );
    const resolvedInputProps = React.useMemo(
        () => ({
            label: resolvedLabel,
            value: value,
            disabled: resolvedDisabled,
            required: schema.isRequired,
            helperText: helperText,
            placeholder: placeholder,
            error: error,
        }),
        [error, helperText, placeholder, resolvedDisabled, resolvedLabel, schema.isRequired, value]
    );

    const handleChange = (next: unknown) => onChange(next);
    const useTemplatableInput =
        schema.isTemplateTarget && variables.length > 0 && (schema.type === 'String' || schema.type === 'Guid');

    switch (schema.type) {
        case 'Boolean':
            return (
                <FormControl>
                    <FormControlLabel
                        control={
                            <DnSwitch
                                checked={value ?? false}
                                disabled={resolvedDisabled}
                                onChange={(_, checked) => handleChange(checked)}
                            />
                        }
                        label={resolvedLabel}
                    />
                    {helperText !== undefined ? (
                        <React.Fragment>
                            <Divider sx={{ marginTop: 1 }} />
                            <FormHelperText>{helperText}</FormHelperText>
                        </React.Fragment>
                    ) : null}
                </FormControl>
            );
        case 'Enum':
            return (
                <TextField
                    select
                    fullWidth
                    label={resolvedLabel}
                    value={value ?? ''}
                    required={schema.isRequired}
                    disabled={resolvedDisabled}
                    error={error}
                    helperText={helperText}
                    onChange={event => {
                        const raw = event.target.value;
                        handleChange(raw === '' ? null : raw);
                    }}
                    slotProps={{
                        inputLabel: { shrink: true },
                        select: { displayEmpty: true },
                    }}
                >
                    {!schema.isRequired ? <MenuItem value="">-- Aucun --</MenuItem> : null}
                    {(schema.enumValues ?? []).map(option => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>
            );
        case 'Int32':
        case 'Int64':
        case 'Double':
        case 'Decimal':
            return (
                <DnInput
                    type="number"
                    {...resolvedInputProps}
                    onChange={event => {
                        const raw = event.target.value;
                        handleChange(raw === '' ? Number.NaN : Number(raw));
                    }}
                />
            );
        case 'DateTime':
        case 'DateTimeOffset':
            return (
                <DnInputDate
                    type="datetime-local"
                    {...resolvedInputProps}
                    value={toDateTimeLocal(value)}
                    onChange={event => handleChange(fromDateTimeLocal(event.target.value))}
                />
            );
        case 'Guid':
        case 'String':
        default:
            const resolvedDnInputProps = {
                type: 'text',
                ...resolvedInputProps,
                multiline,
                rows,
                max: schema.maxLength ?? undefined,
                pattern: schema.regexValidation ?? undefined,
                onChange: e => handleChange(e.target.value),
            } satisfies DnInputProps;

            return useTemplatableInput ? (
                <DnInputInterpolated variables={variables} {...resolvedDnInputProps} />
            ) : (
                <DnInput {...resolvedDnInputProps} />
            );
    }
}
