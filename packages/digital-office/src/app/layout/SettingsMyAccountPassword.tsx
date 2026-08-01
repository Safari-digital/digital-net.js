import * as React from 'react';
import { Skeleton, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDigitalNetApi } from '../../api';
import { DnButton, DnInput } from '../../ui';
import { formatRegex } from '../../ui/format';
import { useDebouncedCallback } from '../../ui/hooks';
import { useDnToast } from '../useDnToast';

interface PasswordForm {
    newPassword: string;
    repeatPassword: string;
    currentPassword: string;
}

const EMPTY_FORM: PasswordForm = { newPassword: '', repeatPassword: '', currentPassword: '' };
const VALIDATION_DEBOUNCE_MS = 500;

export function SettingsMyAccountPassword() {
    const api = useDigitalNetApi();
    const { showToast } = useDnToast();

    const [form, setForm] = React.useState<PasswordForm>(EMPTY_FORM);
    const [regexError, setRegexError] = React.useState(false);
    const [mismatchError, setMismatchError] = React.useState(false);
    const [currentPasswordError, setCurrentPasswordError] = React.useState(false);

    const { data: pattern } = useQuery({
        queryKey: ['password-validation'],
        queryFn: () => api.catalog.validation.getPasswordPattern(),
    });

    const isPayloadValid = React.useMemo(() => {
        if (!pattern?.value || form.newPassword !== form.repeatPassword) return false;
        return new RegExp(pattern.value).test(form.newPassword);
    }, [pattern, form.newPassword, form.repeatPassword]);

    const failsPattern = (value: string) => !!pattern?.value && !new RegExp(pattern.value).test(value);

    const validate = (newPassword: string, repeatPassword: string) => {
        const hasConfirmation = repeatPassword.length > 0;
        setRegexError(hasConfirmation && newPassword.length > 0 && failsPattern(newPassword));
        setMismatchError(hasConfirmation && newPassword !== repeatPassword);
    };

    const scheduleValidate = useDebouncedCallback(validate, VALIDATION_DEBOUNCE_MS);

    const handleNewPasswordChange = (value: string) => {
        if (value.length === 0) {
            // Emptying the new password resets the dependent fields it gates.
            scheduleValidate.cancel();
            setForm(EMPTY_FORM);
            setRegexError(false);
            setMismatchError(false);
            return;
        }
        const next = { ...form, newPassword: value };
        setForm(next);
        if (next.repeatPassword.length > 0) scheduleValidate.run(next.newPassword, next.repeatPassword);
        else {
            scheduleValidate.cancel();
            setRegexError(false);
        }
    };

    const handleNewPasswordBlur = () => {
        scheduleValidate.cancel();
        if (form.newPassword.length === 0) return;
        if (form.repeatPassword.length > 0) validate(form.newPassword, form.repeatPassword);
        else setRegexError(failsPattern(form.newPassword));
    };

    const handleRepeatChange = (value: string) => {
        const next = { ...form, repeatPassword: value };
        setForm(next);
        if (value.length === 0) {
            scheduleValidate.cancel();
            setMismatchError(false);
            setRegexError(false);
            return;
        }
        scheduleValidate.run(next.newPassword, next.repeatPassword);
    };

    const { mutate, isPending } = useMutation({
        mutationFn: () =>
            api.catalog.user.updatePassword(
                { currentPassword: form.currentPassword, newPassword: form.newPassword },
                {
                    onSuccess: () => {
                        showToast('Votre mot de passe a été mis à jour.');
                        scheduleValidate.cancel();
                        setForm(EMPTY_FORM);
                        setRegexError(false);
                        setMismatchError(false);
                        setCurrentPasswordError(false);
                    },
                    onStatus: {
                        401: () => setCurrentPasswordError(true),
                        400: () => showToast('Le nouveau mot de passe ne respecte pas les critères requis.', 'error'),
                    },
                    onError: error => {
                        if (error.status !== 401 && error.status !== 400) {
                            showToast('Une erreur est survenue lors de la mise à jour du mot de passe.', 'error');
                        }
                    },
                }
            ),
        onError: () => showToast('Une erreur est survenue lors de la mise à jour du mot de passe.', 'error'),
    });

    const canSubmit = isPayloadValid && form.currentPassword.length > 0 && !isPending;

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        mutate();
    };

    return (
        <Stack
            component="form"
            onSubmit={handleSubmit}
            sx={theme => ({
                marginTop: theme.spacing(1),
                padding: theme.spacing(2),
                width: 'fit-content',
                maxWidth: 500,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
            })}
        >
            <Typography variant="subtitle2">Changer mon mot de passe</Typography>
            <Typography variant="body2" sx={{ marginTop: 1 }}>
                Saisissez et validez votre nouveau mot de passe, puis renseignez votre mot de passe actuel.
            </Typography>
            <Stack sx={{ gap: 3, mt: 4, maxWidth: 300 }}>
                <DnInput
                    value={form.newPassword}
                    onChange={e => handleNewPasswordChange(e.target.value)}
                    onBlur={handleNewPasswordBlur}
                    label="Nouveau mot de passe"
                    type="password"
                    inputProps={{ autoComplete: 'off' }}
                    error={regexError}
                    helperText={regexError ? 'Le mot de passe ne respecte pas les critères requis.' : undefined}
                    required
                />
                <DnInput
                    value={form.repeatPassword}
                    onChange={e => handleRepeatChange(e.target.value)}
                    label="Confirmation du nouveau mot de passe"
                    type="password"
                    inputProps={{ autoComplete: 'off' }}
                    disabled={!form.newPassword.length}
                    error={mismatchError}
                    helperText={mismatchError ? 'Les mots de passe ne correspondent pas.' : undefined}
                    required
                />
                <DnInput
                    value={form.currentPassword}
                    onChange={e => {
                        setForm(prev => ({ ...prev, currentPassword: e.target.value }));
                        setCurrentPasswordError(false);
                    }}
                    label="Mot de passe actuel"
                    type="password"
                    inputProps={{ autoComplete: 'off' }}
                    disabled={!isPayloadValid}
                    error={currentPasswordError}
                    helperText={currentPasswordError ? 'Mot de passe actuel incorrect.' : undefined}
                    required
                />
                <DnButton type="submit" variant="contained" disabled={!canSubmit} loading={isPending}>
                    Mettre à jour
                </DnButton>
            </Stack>
            <Stack sx={{ position: 'relative', mt: 2, minHeight: 42 }}>
                {pattern?.value ? (
                    <Typography variant="caption" sx={{ width: '100%', fontStyle: 'italic' }}>
                        Votre mot de passe doit être composé d&apos;{formatRegex(pattern.value)}.
                    </Typography>
                ) : (
                    <Skeleton sx={{ position: 'absolute', top: -18, width: '100%', height: 75 }} />
                )}
            </Stack>
        </Stack>
    );
}
