import * as React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { type DnToastVariant, ToastContext } from './useDnToast';

interface ActiveToast {
    key: number;
    message: string;
    variant: DnToastVariant;
}

const DEFAULT_DURATION = 7000;

export function ToastProvider({ children }: React.PropsWithChildren) {
    const [toast, setToast] = React.useState<ActiveToast | null>(null);

    const hide = React.useCallback(() => setToast(null), []);

    const showToast = React.useCallback((message: string, variant?: DnToastVariant) => {
        setToast({
            key: Date.now(),
            message,
            variant: variant ?? 'info',
        });
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hide }}>
            {children}
            <Snackbar
                key={toast?.key}
                open={toast !== null}
                autoHideDuration={DEFAULT_DURATION}
                onClose={hide}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {toast ? (
                    <CustomAlert
                        onClick={hide}
                        elevation={2}
                        severity={toast.variant}
                        variant="filled"
                        sx={{ cursor: 'pointer', width: '100%' }}
                    >
                        {toast.message}
                    </CustomAlert>
                ) : undefined}
            </Snackbar>
        </ToastContext.Provider>
    );
}

const CustomAlert = styled(Alert)(
    ({ theme }) => css`
        &.MuiAlert-root {
            min-width: 300px;
        }
        &.MuiAlert-colorInfo.MuiAlert-filledInfo {
            background-color: ${theme.palette.text.primary};
            & .MuiAlert-icon {
                display: none;
            }
        }
        &.MuiAlert-colorError.MuiAlert-filledError {
            background-color: ${theme.palette.error.dark};
        }
    `
);
