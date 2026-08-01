import * as React from 'react';
import { Autocomplete, type AutocompleteProps, CircularProgress, type SxProps, type Theme } from '@mui/material';
import { BaseInput } from './BaseInput';
import { BaseInputWrapper } from './BaseInputWrapper';
import { DnAutocompletePaper, type DnAutocompletePaperProps } from './DnInputAutocomplete';
import { renderAutocompleteChip } from './DnInputAutocompleteMultiple';

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

export interface DnInputAutocompleteMultipleFreesoloProps<T> extends Omit<
    AutocompleteProps<T, true, false, true>,
    MuiAutocompleteOmitted | 'sx' | 'loading'
> {
    options: T[];
    value: T[];
    onChange: (_values: T[]) => void;
    getOptionLabel: (_option: T) => string;
    isOptionEqualToValue?: (_option: T, _value: T) => boolean;
    createOptionFromText: (_text: string) => T;
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

export function DnInputAutocompleteMultipleFreesolo<T>({
    options,
    value,
    onChange,
    getOptionLabel,
    isOptionEqualToValue,
    createOptionFromText,
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
}: DnInputAutocompleteMultipleFreesoloProps<T>) {
    const { onInputChange: onInputChangeProp, ...restAutocompleteProps } = autocompleteProps;

    const resolvedGetOptionLabel = React.useCallback(
        (option: T | string) => (typeof option === 'string' ? option : getOptionLabel(option)),
        [getOptionLabel]
    );

    const resolvedPlaceholder = React.useMemo(
        () => (value.length ? undefined : placeholder),
        [placeholder, value.length]
    );

    const resolvedIsOptionEqualToValue = React.useMemo(
        () =>
            isOptionEqualToValue
                ? (option: T | string, candidate: T | string) =>
                      typeof option === 'string' || typeof candidate === 'string'
                          ? false
                          : isOptionEqualToValue(option, candidate)
                : undefined,
        [isOptionEqualToValue]
    );

    const handleChange = React.useCallback(
        (event: React.SyntheticEvent, next: (T | string)[]) => {
            const mapped = next.map(item => (typeof item === 'string' ? createOptionFromText(item) : item));
            onChange(mapped);
            onInputChangeProp?.(event, '', 'reset');
        },
        [createOptionFromText, onChange, onInputChangeProp]
    );

    return (
        <BaseInputWrapper>
            <Autocomplete<T, true, false, true>
                noOptionsText="Aucune option"
                {...restAutocompleteProps}
                onInputChange={onInputChangeProp}
                multiple
                freeSolo
                options={options}
                value={value}
                onChange={handleChange}
                disabled={disabled}
                sx={sx}
                getOptionLabel={resolvedGetOptionLabel}
                isOptionEqualToValue={resolvedIsOptionEqualToValue}
                slots={{ paper: DnAutocompletePaper }}
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
