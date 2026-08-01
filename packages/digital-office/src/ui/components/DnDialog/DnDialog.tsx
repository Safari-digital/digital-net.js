import * as React from 'react';
import { DialogActions, DialogContent, DialogContentText, DialogTitle, Dialog as MuiDialog } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { DnButton } from '../DnButton';

export interface DnDialogProps {
    open: boolean;
    title?: string;
    children: React.ReactNode;
    confirmLabel?: string;
    loading?: boolean;
    disabled?: boolean;
    showCancelAction?: boolean;
    onClose: () => Promise<void> | void;
    onConfirm: () => Promise<void> | void;
}

export function DnDialog({
    open,
    title,
    children,
    confirmLabel = 'Confirmer',
    loading = false,
    disabled = false,
    showCancelAction = true,
    onClose,
    onConfirm,
}: DnDialogProps) {
    const handleClose = React.useCallback(async () => (!loading ? await onClose() : void 0), [loading, onClose]);
    const handleConfirm = React.useCallback(
        async (e: React.SubmitEvent) => {
            e.preventDefault();
            if (loading) return;
            await onConfirm();
        },
        [loading, onConfirm]
    );

    return (
        <Dialog open={open} onClose={onClose} role="alertdialog" maxWidth="xs">
            <form onSubmit={handleConfirm}>
                {title ? <DialogTitle>{title}</DialogTitle> : null}
                <DialogContent>
                    <DialogContentText component="div">{children}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    {showCancelAction ? (
                        <DnButton variant="outlined" onClick={handleClose} disabled={loading}>
                            Annuler
                        </DnButton>
                    ) : null}
                    <DnButton type="submit" loading={loading} disabled={disabled}>
                        {confirmLabel}
                    </DnButton>
                </DialogActions>
            </form>
        </Dialog>
    );
}

const Dialog = styled(MuiDialog)(
    () => css`
        & .MuiDialog-container {
            margin-top: 15vh;
            align-items: start;
        }
    `
);
