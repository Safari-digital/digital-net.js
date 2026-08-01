import * as React from 'react';
import { Switch, type SwitchProps, styled } from '@mui/material';

export interface DnSwitchProps extends Pick<
    SwitchProps,
    'id' | 'className' | 'disabled' | 'onClick' | 'onChange' | 'checked' | 'defaultChecked' | 'name' | 'value'
> {
    loading?: boolean;
}

export function DnSwitch({ className, loading, ...muiProps }: DnSwitchProps) {
    const resolvedProps = React.useMemo(
        () => ({
            ...muiProps,
            ...(loading ? { disabled: true } : {}),
            className: `DnSwitch ${loading ? 'Mui-loading' : ''} ${className ?? ''}`,
        }),
        [muiProps, loading, className]
    );
    return <CustomSwitch {...resolvedProps} />;
}

const CustomSwitch = styled((props: SwitchProps) => <Switch focusVisibleClassName=".Mui-focusVisible" {...props} />)(
    ({ theme }) => ({
        width: 32,
        height: 16,
        padding: 0,
        '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
                transform: 'translateX(16px)',
                color: theme.palette.common.white,
                '& + .MuiSwitch-track': {
                    backgroundColor: theme.palette.primary.light,
                    opacity: 1,
                    border: 0,
                },
                '&.Mui-disabled + .MuiSwitch-track': {
                    opacity: 0.5,
                },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
                color: theme.palette.primary.light,
                border: '6px solid #fff',
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
                color: theme.palette.grey[300],
                ...theme.applyStyles('dark', {
                    color: theme.palette.grey[800],
                }),
            },
            '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.7,
                ...theme.applyStyles('dark', {
                    opacity: 0.3,
                }),
            },
        },
        '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 12,
            height: 12,
        },
        '& .MuiSwitch-track': {
            borderRadius: 26 / 2,
            backgroundColor: theme.palette.grey[500],
            opacity: 1,
            transition: theme.transitions.create(['background-color'], {
                duration: 500,
            }),
            ...theme.applyStyles('dark', {
                backgroundColor: theme.palette.grey[800],
            }),
        },
    })
);
