import { Stack } from '@mui/material';
import type { OpenGraphPropertySchema } from '@digital-net-org/digital-api-sdk';
import { DnDraggableRow, DnInput, DnInputAutocomplete, DnInputInterpolated, type DnInputProps } from '../../../ui';
import { type OgRow } from './useOgState';
import { usePageVariables } from './usePageVariables';

export interface EditOpenGraphRowProps {
    row: OgRow;
    disabled: boolean;
    showErrors: boolean;
    errors: Set<'property' | 'content'> | undefined;
    options: OpenGraphPropertySchema[];
    onPropertyChange: (_id: string, _property: string) => void;
    onContentChange: (_id: string, _content: string) => void;
    onDelete: (_id: string) => void;
}

export function EditOpenGraphRow({
    row,
    disabled,
    showErrors,
    errors,
    options,
    onPropertyChange,
    onContentChange,
    onDelete,
}: EditOpenGraphRowProps) {
    const propertyError = showErrors && (errors?.has('property') ?? false);
    const contentError = showErrors && (errors?.has('content') ?? false);
    const variables = usePageVariables();
    const isAvailable = variables.length > 0;

    return (
        <DnDraggableRow id={row.id} disabled={disabled} onDelete={onDelete}>
            <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start', width: '100%' }}>
                <Stack sx={{ flex: 1 }}>
                    <DnInputAutocomplete
                        label="Property"
                        options={options.map(p => p.key)}
                        value={row.property || null}
                        onChange={value => onPropertyChange(row.id, value ?? '')}
                        disabled={disabled}
                        required
                        error={propertyError}
                    />
                </Stack>
                <Stack sx={{ flex: 3 }}>
                    {(() => {
                        const baseProps = {
                            label: 'Content',
                            value: row.content,
                            onChange: e => onContentChange(row.id, e.target.value),
                            disabled,
                            required: true,
                            error: contentError,
                        } satisfies DnInputProps;

                        return isAvailable ? (
                            <DnInputInterpolated {...baseProps} variables={variables} />
                        ) : (
                            <DnInput {...baseProps} />
                        );
                    })()}
                </Stack>
            </Stack>
        </DnDraggableRow>
    );
}
