import { darkScrollbar } from '@mui/material';
import type { ThemeOptions } from '@mui/material/styles';

export const components: ThemeOptions['components'] = {
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                ...darkScrollbar(),
                height: '100vh',
                width: '100vw',
                overflowY: 'hidden',
                '& #root': {
                    width: '100%',
                    height: '100%',
                    overflowY: 'hidden',
                },
            },
        },
    },
    MuiButton: {
        defaultProps: {
            variant: 'contained',
        },
    },
    MuiCheckbox: {
        defaultProps: {
            disableRipple: true,
            size: 'small',
            color: 'default',
        },
    },
    MuiSelect: {
        defaultProps: {
            size: 'small',
        },
        styleOverrides: {
            select: ({ theme }) => ({
                padding: '0.25rem 2rem 0.25rem 0.5rem',
                fontSize: theme.typography.button.fontSize,
                minHeight: 'unset',
            }),
        },
    },
    MuiMenuItem: {
        styleOverrides: {
            root: ({ theme }) => ({
                fontSize: theme.typography.button.fontSize,
            }),
        },
    },
    MuiTabs: {
        defaultProps: {
            variant: 'scrollable',
            scrollButtons: 'auto',
        },
    },
    MuiFormControlLabel: {
        defaultProps: {
            label: 'Bottom',
            labelPlacement: 'start',
        },
        styleOverrides: {
            root: ({ theme }) => ({
                padding: 0,
                margin: 0,
                alignSelf: 'start',
                gap: '1rem',
                minWidth: '180px',
                justifyContent: 'space-between',
                '& .MuiTypography-root': {
                    fontSize: theme.typography.fontSize,
                },
            }),
        },
    },
    MuiFormHelperText: {
        styleOverrides: {
            root: () => ({
                padding: 0,
                margin: 0,
                paddingLeft: '0.5rem',
                paddingTop: '0.125rem',
            }),
        },
    },
};
