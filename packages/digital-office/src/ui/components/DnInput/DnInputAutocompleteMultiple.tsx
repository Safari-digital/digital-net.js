import * as React from 'react';
import { Autocomplete, type AutocompleteProps, CircularProgress, type SxProps, type Theme } from '@mui/material';
import { BaseInput } from './BaseInput';
import { BaseInputWrapper } from './BaseInputWrapper';
import { DnAutocompletePaper, type DnAutocompletePaperProps } from './DnInputAutocomplete';

type MuiAutocompleteOmitted =
    | 'renderInput'
    | 'value'
    | 'onChange'
    | 'options'
    | 'disabled'
    | 'multiple'
    | 'freeSolo'
    | 'disableClearable'
    | 'size'
    | 'getOptionLabel'
    | 'isOptionEqualToValue';

export interface DnInputAutocompleteMultipleProps<T> extends Omit<
    AutocompleteProps<T, true, false, false>,
    MuiAutocompleteOmitted | 'sx' | 'loading'
> {
    options: T[];
    value: T[];
    onChange: (_values: T[]) => void;
    getOptionLabel: (_option: T) => string;
    isOptionEqualToValue?: (_option: T, _value: T) => boolean;
    label?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    helperText?: React.ReactNode;
    sx?: SxProps<Theme>;
    renderListAction?: React.ReactNode;
    loading?: boolean;
}

export function DnInputAutocompleteMultiple<T>({
    options,
    value,
    onChange,
    getOptionLabel,
    isOptionEqualToValue,
    label,
    placeholder,
    disabled,
    required,
    error,
    helperText,
    sx,
    renderListAction,
    loading,
    ...autocompleteProps
}: DnInputAutocompleteMultipleProps<T>) {
    const resolvedPlaceholder = React.useMemo(
        () => (value.length ? undefined : placeholder),
        [placeholder, value.length]
    );

    return (
        <BaseInputWrapper>
            <Autocomplete<T, true, false, false>
                noOptionsText="Aucune option"
                {...autocompleteProps}
                multiple
                options={options}
                value={value}
                onChange={(_, next) => onChange(next)}
                disabled={disabled}
                autoHighlight
                sx={sx}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
                slots={{
                    paper: DnAutocompletePaper,
                }}
                slotProps={{
                    paper: { renderListAction } as DnAutocompletePaperProps,
                    chip: { sx: renderAutocompleteChip },
                }}
                renderInput={params => (
                    <BaseInput
                        {...params}
                        slotProps={{
                            ...params.slotProps,
                            input: {
                                ...params.slotProps.input,
                                endAdornment: (
                                    <>
                                        {loading ? <CircularProgress color="inherit" size={16} /> : null}
                                        {params.slotProps.input.endAdornment}
                                    </>
                                ),
                            },
                        }}
                        label={label}
                        placeholder={resolvedPlaceholder}
                        required={required}
                        error={error}
                        helperText={helperText}
                        className="DnInput"
                    />
                )}
            />
        </BaseInputWrapper>
    );
}

export const renderAutocompleteChip = (theme: Theme) => ({
    fontSize: theme.typography.fontSize * 0.8,
    padding: '0!important',
    marginY: '0!important',
    height: theme.typography.fontSize * 1.75,
    '& .MuiChip-label': {
        marginTop: 0.25,
    },
    '& .MuiSvgIcon-root': {
        width: 'fit-content',
        height: theme.typography.fontSize * 1.35,
    },
});
