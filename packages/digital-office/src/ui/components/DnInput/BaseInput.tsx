import * as React from 'react';
import { TextField, type TextFieldProps } from '@mui/material';
import { css, styled } from '@mui/material/styles';

export function BaseInput(props: TextFieldProps) {
    return <StyledTextField {...props} />;
}

export const basePaddingX = 0.25;
export const basePaddingY = 0.5;

const StyledTextField = styled(TextField)(
    ({ theme }) => css`
        width: 100%;
        & .MuiInputBase-root {
            transition: 0.2s ease-in-out;
            font-size: ${theme.typography.button.fontSize};
            background-color: transparent;

            &.MuiInputBase-adornedEnd {
                padding-right: 0;
            }
        }

        & .MuiInputBase-input {
            padding: ${basePaddingX}rem ${basePaddingY}rem;
        }
        & .MuiAutocomplete-inputRoot {
            padding: ${basePaddingX}rem ${basePaddingY}rem;
        }
        & .MuiAutocomplete-input {
            margin: 0 !important;
            padding: 0 !important;
        }

        & .MuiInputLabel-outlined.MuiInputLabel-root {
            font-size: ${theme.typography.button.fontSize};
            transform: translate(${basePaddingY}rem, ${basePaddingX}rem) scale(1);

            &.MuiInputLabel-shrink {
                transform: translate(${basePaddingY * 1.75}rem, -${basePaddingX * 2.6}rem) scale(0.75);
            }
        }

        & .MuiInputLabel-filled.MuiInputLabel-root {
            font-size: ${theme.typography.button.fontSize};
            transform: translate(${basePaddingY}rem, ${basePaddingX}rem) scale(1);

            &.MuiInputLabel-shrink {
                transform: translate(${basePaddingY}rem, -${basePaddingX * 2.25}rem) scale(0.75);
            }
        }

        &.DnInput .MuiInputLabel-root {
            color: ${theme.palette.text.secondary};

            &.Mui-focused {
                color: ${theme.palette.primary.main};
            }

            &.Mui-disabled {
                color: ${theme.palette.text.disabled};
            }
        }

        & .MuiFormHelperText-root {
            margin: 0;
            padding-left: 0.5rem;
        }

        & .MuiSvgIcon-fontSizeMedium {
            width: 100%;
        }

        & .MuiIconButton-root {
            width: 22px;
            height: 22px;
        }
    `
);
