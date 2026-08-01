import * as React from 'react';
import { Button, type ButtonProps } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import type { DnSeverity } from '../../theme';

export interface DnButtonProps extends Pick<
    ButtonProps,
    'children' | 'id' | 'className' | 'disabled' | 'loading' | 'variant' | 'sx' | 'onClick' | 'type'
> {
    icon?: React.ReactNode;
    severity?: DnSeverity;
    size?: 'small' | 'medium';
}

export function DnButton({ children, className, icon, severity, size, ...muiProps }: DnButtonProps) {
    const resolvedProps = React.useMemo(
        () => ({
            ...muiProps,
            ...(icon ? { endIcon: icon } : {}),
            ...(severity ? { color: severity } : {}),
            ...(size ? { size } : {}),
            ...(muiProps.variant !== 'contained' ? { disableRipple: true } : {}),
        }),
        [muiProps, icon, severity, size]
    );

    return (
        <CustomButton {...resolvedProps} className={`DnButton ${className ?? ''}`}>
            {children}
        </CustomButton>
    );
}

const CustomButton = styled(Button)(
    ({ theme }) => css`
        text-transform: initial;
        transition: 0.2s ease-in-out;
        font-size: ${theme.typography.button.fontSize};
        padding: 0.25rem 0.75rem;

        &.MuiButton-sizeSmall {
            font-size: 0.85rem;
            padding: 0.1875rem 0.5625rem;
        }

        &.DnButton.MuiButton-contained {
            border: 1px solid ${theme.palette.primary.main};
            box-shadow: none;
            &.MuiButton-root.MuiButton-loading.Mui-disabled {
                background-color: ${theme.palette.primary.main};
                & .MuiButton-loadingIndicator .MuiCircularProgress-root .MuiCircularProgress-svg {
                    color: ${theme.palette.common.white};
                }
            }
            &.MuiButton-root.Mui-disabled {
                border-color: transparent;
            }
        }

        &.DnButton.MuiButton-outlined {
            color: ${theme.palette.text.primary};
            border-color: ${theme.palette.text.primary};

            &:hover {
                color: ${theme.palette.primary.dark};
                border-color: ${theme.palette.primary.dark};
                background-color: transparent;
            }

            &.MuiButton-root.MuiButton-loading.Mui-disabled {
                color: transparent;

                & .MuiButton-loadingIndicator .MuiCircularProgress-root .MuiCircularProgress-svg {
                    color: ${theme.palette.text.primary};
                }
            }

            &.MuiButton-root.Mui-disabled {
                color: ${theme.palette.text.disabled};
                border-color: ${theme.palette.text.disabled};
            }
        }

        &.DnButton.MuiButton-text {
            border: 1px solid transparent;

            &:hover {
                color: ${theme.palette.primary.dark};
                border-color: ${theme.palette.primary.dark};
                background-color: transparent;
            }

            &.MuiButton-root.MuiButton-loading.Mui-disabled {
                color: transparent;

                & .MuiButton-loadingIndicator .MuiCircularProgress-root .MuiCircularProgress-svg {
                    color: ${theme.palette.text.primary};
                }
            }
        }
    `
);
