import * as React from 'react';
import { Stack, Typography } from '@mui/material';
import { DnDialog, type DnDialogProps } from '../DnDialog';
import { DnInput } from '../DnInput';

export interface PasswordConfirmDialogProps extends Pick<DnDialogProps, 'onClose' | 'open' | 'loading' | 'disabled'> {
    onConfirm: (_password: string) => void | Promise<void>;
    showError?: boolean;
}

export function DialogConfirmPassword({
    open,
    loading = false,
    showError = false,
    onClose,
    onConfirm,
}: PasswordConfirmDialogProps) {
    const [password, setPassword] = React.useState('');
    const [prevOpen, setPrevOpen] = React.useState(open);
    const [prevShowError, setPrevShowError] = React.useState(showError);

    if (prevOpen !== open) {
        setPrevOpen(open);
        if (open) setPassword('');
    }
    if (prevShowError !== showError) {
        setPrevShowError(showError);
        if (showError) setPassword('');
    }

    const handleSubmit = React.useCallback(
        async () => (loading || !password ? void 0 : await onConfirm(password)),
        [loading, password, onConfirm]
    );

    return (
        <DnDialog
            open={open}
            onClose={onClose}
            loading={loading}
            disabled={!password || loading}
            onConfirm={handleSubmit}
        >
            <Typography>Cette action nécessite votre mot de passe</Typography>
            <Stack sx={{ mt: 3 }}>
                <DnInput
                    label="Mot de passe"
                    name="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    error={showError}
                    helperText={showError ? 'Mot de passe incorrect' : undefined}
                    inputProps={{ maxLength: 256, autoComplete: 'off' }}
                    autoFocus
                    required
                    fullWidth
                />
            </Stack>
        </DnDialog>
    );
}
