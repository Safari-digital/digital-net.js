import * as React from 'react';
import type { SchemaProperty, TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { Stack } from '@mui/material';
import type { DnDateFormat } from '../../ui';
import { EntityInput } from '../EntityInput';

export interface DnEntityFieldProps {
    label: string;
    helperText?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
    render?: React.ReactNode;
    /** Date fields only: the precision the value is edited at. Defaults to the minute. */
    format?: DnDateFormat;
    /** Date fields only: hour given to a value the format does not ask one for. */
    defaultHour?: number;
    /** Date fields only: minutes given to a value the format does not ask them for. */
    defaultMinutes?: number;
}

export interface DnEntityFormProps {
    schemas: SchemaProperty[];
    fieldProps: Record<string, DnEntityFieldProps>;
    values: Record<string, unknown>;
    onFieldChange: (_path: string, _value: unknown) => void;
    errors?: ReadonlySet<string>;
    disabled?: boolean;
    variables?: TemplateVariable[];
}

function schemaNameToPath(name: string): string {
    return `/${name.charAt(0).toLowerCase()}${name.slice(1)}`;
}

function schemaNameToAccessor(name: string): string {
    return `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
}

export function DnEntityForm({
    schemas,
    fieldProps,
    values,
    onFieldChange,
    errors,
    disabled,
    variables,
}: DnEntityFormProps) {
    const resolvedSchemas = React.useMemo(
        () =>
            Object.entries(fieldProps).reduce<(DnEntityFieldProps & { schema: SchemaProperty })[]>(
                (acc, [key, value]) => {
                    const schema = schemas.find(({ name }) => name === key);
                    if (schema) {
                        acc.push({ ...value, schema });
                    }
                    return acc;
                },
                []
            ),
        [schemas, fieldProps]
    );

    return (
        <Stack spacing={2} sx={{ maxWidth: 720 }}>
            {resolvedSchemas.map(s => {
                if (s.render !== undefined) {
                    return <React.Fragment key={s.schema.name}>{s.render}</React.Fragment>;
                }
                const accessor = schemaNameToAccessor(s.schema.name);
                const path = schemaNameToPath(s.schema.name);
                return (
                    <EntityInput
                        key={s.schema.name}
                        schema={s.schema}
                        label={s.label}
                        helperText={s.helperText}
                        placeholder={s.placeholder}
                        value={values[accessor]}
                        onChange={next => onFieldChange(path, next)}
                        error={s.error ?? errors?.has(accessor)}
                        disabled={disabled || s.disabled}
                        variables={variables ?? []}
                        format={s.format}
                        defaultHour={s.defaultHour}
                        defaultMinutes={s.defaultMinutes}
                    />
                );
            })}
        </Stack>
    );
}
