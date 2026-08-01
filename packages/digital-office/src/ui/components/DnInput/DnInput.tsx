import * as React from 'react';
import { Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';
import { Box, CircularProgress, type SlotProps, type TextFieldOwnerState, type TextFieldProps } from '@mui/material';
import type { InputBaseProps } from '@mui/material/InputBase';
import { DnIconButton } from '../DnIconButton';
import { BaseInput } from './BaseInput';
import { BaseInputCount } from './BaseInputCount';
import { BaseInputWrapper } from './BaseInputWrapper';

export interface DnInputProps extends Pick<
    TextFieldProps,
    | 'id'
    | 'className'
    | 'disabled'
    | 'sx'
    | 'name'
    | 'label'
    | 'placeholder'
    | 'value'
    | 'defaultValue'
    | 'onChange'
    | 'onBlur'
    | 'type'
    | 'fullWidth'
    | 'multiline'
    | 'rows'
    | 'minRows'
    | 'maxRows'
    | 'error'
    | 'required'
    | 'autoFocus'
    | 'helperText'
> {
    variant?: 'default' | 'text';
    loading?: boolean;
    loadingNonBlocking?: boolean;
    max?: number;
    pattern?: string;
    inputProps?: SlotProps<React.ElementType<InputBaseProps['inputProps']>, {}, TextFieldOwnerState>;
    endAction?: React.ReactNode;
}

const DEFAULT_PATTERN_ERROR = 'Format invalide.';
const PASSWORD_INPUT_PROPS = { sx: { width: '18px!important' } };

export function DnInput({
    className,
    variant,
    loading,
    loadingNonBlocking,
    disabled,
    max,
    inputProps,
    pattern,
    endAction,
    error,
    helperText,
    value,
    onChange,
    type,
    ...muiProps
}: DnInputProps) {
    const [uncontrolledLength, setUncontrolledLength] = React.useState(
        typeof muiProps.defaultValue === 'string' ? muiProps.defaultValue.length : 0
    );
    const [patternMismatch, setPatternMismatch] = React.useState(false);
    const [passwordVisible, setPasswordVisible] = React.useState(false);

    const isPassword = type === 'password';
    const resolvedType = isPassword && passwordVisible ? 'text' : type;

    const valueLength = typeof value === 'string' ? value.length : uncontrolledLength;
    const resolvedMaxLength = max ?? (inputProps as { maxLength?: number } | undefined)?.maxLength;

    const effectiveError = Boolean(error) || patternMismatch;
    const effectiveHelper = patternMismatch ? DEFAULT_PATTERN_ERROR : helperText;

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (max !== undefined) {
            setUncontrolledLength(event.target.value.length);
        }
        if (pattern !== undefined) {
            setPatternMismatch(event.target.validity.patternMismatch);
        }
        onChange?.(event);
    };

    return (
        <BaseInputWrapper>
            <BaseInputCount value={valueLength} max={max} />
            <BaseInput
                {...muiProps}
                type={resolvedType}
                value={value ?? ''}
                onChange={handleOnChange}
                error={effectiveError}
                helperText={effectiveHelper}
                className={`DnInput ${className ?? ''}`}
                size="medium"
                variant={({ default: 'outlined', text: 'filled' } as const)[variant ?? 'default']}
                disabled={disabled || loading}
                slotProps={{
                    htmlInput: {
                        spellCheck: false,
                        autoCorrect: 'off',
                        autoCapitalize: 'off',
                        autoComplete: 'off',
                        ...(inputProps ?? {}),
                        ...(resolvedMaxLength !== undefined ? { maxLength: resolvedMaxLength } : {}),
                        ...(pattern !== undefined ? { pattern } : {}),
                    },
                    input: {
                        endAdornment:
                            loading || loadingNonBlocking || endAction || isPassword ? (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                    }}
                                >
                                    {(loading || loadingNonBlocking) && <CircularProgress size="1rem" />}
                                    {endAction}
                                    {isPassword && (
                                        <DnIconButton
                                            tooltip={
                                                passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                                            }
                                            disabled={disabled || loading}
                                            onClick={() => setPasswordVisible(visible => !visible)}
                                        >
                                            {passwordVisible ? (
                                                <VisibilityOffIcon {...PASSWORD_INPUT_PROPS} />
                                            ) : (
                                                <VisibilityIcon {...PASSWORD_INPUT_PROPS} />
                                            )}
                                        </DnIconButton>
                                    )}
                                </Box>
                            ) : undefined,
                    },
                }}
            />
        </BaseInputWrapper>
    );
}
