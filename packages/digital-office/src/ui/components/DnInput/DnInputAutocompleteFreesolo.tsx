import * as React from 'react';
import { Autocomplete, type AutocompleteProps, type SxProps, type Theme } from '@mui/material';
import { BaseInput } from './BaseInput';
import { BaseInputCount } from './BaseInputCount';
import { BaseInputWrapper } from './BaseInputWrapper';
import type { DnAutocompletePaperProps } from './DnInputAutocomplete';
import { DnAutocompletePaper } from './DnInputAutocomplete';

type MuiAutocompleteOmitted =
    | 'renderInput'
    | 'value'
    | 'onChange'
    | 'onInputChange'
    | 'options'
    | 'disabled'
    | 'multiple'
    | 'freeSolo'
    | 'disableClearable'
    | 'size';

const DEFAULT_PATTERN_ERROR = 'Format invalide.';

export interface DnInputAutocompleteFreesoloProps extends Omit<
    AutocompleteProps<string, false, false, true>,
    MuiAutocompleteOmitted | 'sx'
> {
    options: string[];
    value: string | null;
    onChange: (_value: string | null) => void;
    inputValue: string;
    onInputChange: (_text: string) => void;
    label?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: boolean;
    helperText?: React.ReactNode;
    sx?: SxProps<Theme>;
    renderListAction?: React.ReactNode;
    max?: number;
    pattern?: string;
}

export function DnInputAutocompleteFreesolo({
    options,
    value,
    onChange,
    inputValue,
    onInputChange,
    label,
    placeholder,
    disabled,
    required,
    error,
    helperText,
    sx,
    renderListAction,
    max,
    pattern,
    ...autocompleteProps
}: DnInputAutocompleteFreesoloProps) {
    const patternRegex = React.useMemo(() => (pattern ? new RegExp(pattern) : null), [pattern]);
    const [patternMismatch, setPatternMismatch] = React.useState(false);

    const effectiveError = Boolean(error) || patternMismatch;
    const effectiveHelper = patternMismatch ? DEFAULT_PATTERN_ERROR : helperText;

    const handleInputChange = (
        _event: React.SyntheticEvent | null,
        next: string,
        reason: 'input' | 'reset' | 'clear' | 'blur' | 'selectOption' | 'removeOption'
    ) => {
        const capped = max !== undefined && next.length > max ? next.slice(0, max) : next;
        if (patternRegex !== null) {
            setPatternMismatch(capped.length > 0 && !patternRegex.test(capped));
        }
        if (reason === 'clear') {
            setPatternMismatch(false);
        }
        onInputChange(capped);
    };

    return (
        <BaseInputWrapper>
            <BaseInputCount value={inputValue.length} max={max} />
            <Autocomplete<string, false, false, true>
                {...autocompleteProps}
                freeSolo
                options={options}
                value={value ?? ''}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                onChange={(_, next) => onChange(typeof next === 'string' ? next : null)}
                disabled={disabled}
                autoHighlight
                sx={sx}
                slots={{ paper: DnAutocompletePaper }}
                slotProps={{ paper: { renderListAction } as DnAutocompletePaperProps }}
                renderInput={params => (
                    <BaseInput
                        {...params}
                        label={label}
                        placeholder={placeholder}
                        required={required}
                        error={effectiveError}
                        helperText={effectiveHelper}
                        className="DnInput"
                    />
                )}
            />
        </BaseInputWrapper>
    );
}
