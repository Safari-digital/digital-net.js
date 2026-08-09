import * as React from 'react';
import type { FormDto, FormFieldDto } from '@digital-net-org/digital-api-sdk';
import { Stack } from '@mui/material';
import { DnEntityTabHelper, useDnEntityFormContext } from '../../../entity';
import { DnDraggableList, DnLoadingView } from '../../../ui';
import { FormFieldRow } from './FormFieldRow';
import { useFieldSchema } from './useFieldSchema';
import { useFieldsState } from './useFieldsState';

export function FormTabFields() {
    const { schemas, loading: schemasLoading } = useFieldSchema();
    const { values, apiData, setField, disabled, errors, resetSignal } = useDnEntityFormContext<FormDto>();

    const initialFields = React.useMemo<FormFieldDto[] | undefined>(
        () => (values.fields as FormFieldDto[] | undefined) ?? apiData?.fields,
        [values.fields, apiData?.fields]
    );

    const state = useFieldsState(initialFields, entries => setField('/fields', entries), resetSignal, schemas);
    const showErrors = errors?.has('fields') ?? false;

    if (schemasLoading) return <DnLoadingView />;
    return (
        <Stack sx={{ gap: 2, height: '100%' }}>
            <DnEntityTabHelper description="Définissez les champs de saisie de votre formulaire." />
            <DnDraggableList
                rows={state.rows}
                onSort={state.handleReorder}
                onCreate={state.handleAdd}
                disabled={disabled}
                renderRow={row => (
                    <FormFieldRow
                        row={row}
                        disabled={disabled ?? false}
                        showErrors={showErrors}
                        errors={state.rowErrors.get(row.id)}
                        onFieldChange={state.handleFieldChange}
                        onDelete={state.handleDelete}
                    />
                )}
            />
        </Stack>
    );
}
