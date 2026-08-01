import * as React from 'react';
import { Stack, Typography } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDigitalNetApi } from '../../api';
import { DnButton, DnInput } from '../../ui';
import { useDnLayout } from '../layout';
import { useDigitalNetUser } from './useDigitalNetUser';

const IS_LOCKED_KEY = 'dn_is_locked';
const PING_KEY = 'dn_ping';
const PING_INTERVAL_MS = 30000;

export function LoginView() {
    const { AppLogo } = useDnLayout();
    const api = useDigitalNetApi();
    const { login } = useDigitalNetUser();
    const queryClient = useQueryClient();

    const [loginInput, setLoginInput] = React.useState('');
    const [passwordInput, setPasswordInput] = React.useState('');
    const [invalidCredentials, setInvalidCredentials] = React.useState(false);

    const { data: online, isLoading: isPingLoading } = useQuery<boolean>({
        queryKey: [PING_KEY],
        queryFn: () => api.catalog.application.ping(),
        refetchInterval: PING_INTERVAL_MS,
        refetchIntervalInBackground: true,
    });

    const { data: locked, isLoading: isLockedLoading } = useQuery<boolean>({
        queryKey: [IS_LOCKED_KEY],
        queryFn: async () => Boolean((await api.catalog.auth.isLocked()).value),
        enabled: online === true,
    });

    const { mutate, isPending: isLoginLoading } = useMutation({
        mutationFn: () =>
            login(
                { password: passwordInput, login: loginInput },
                {
                    onInvalid: () => setInvalidCredentials(true),
                    onLocked: () => queryClient.invalidateQueries({ queryKey: [IS_LOCKED_KEY] }),
                }
            ),
    });

    const isLoading = React.useMemo(
        () => isPingLoading || isLockedLoading || isLoginLoading,
        [isPingLoading, isLockedLoading, isLoginLoading]
    );

    const isDisabled = online === false || locked || isLoading;

    const errorMessage = React.useMemo(() => {
        if (online === false) {
            return "L'application est actuellement indisponible. Contactez un administrateur.";
        }
        if (locked) {
            return 'Vous avez effectué un trop grand nombre de tentatives de connexion. Par mesure de sécurité, votre accès est temporairement bloqué pendant 15 minutes.';
        }
        if (invalidCredentials) {
            return 'Identifiant ou mot de passe incorrect.';
        }
        return null;
    }, [online, locked, invalidCredentials]);

    const handleSubmit = React.useCallback(
        (e: React.SubmitEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (isLoading) {
                return;
            }
            mutate();
        },
        [isLoading, mutate]
    );

    return (
        <Stack sx={{ alignItems: 'center' }}>
            <Layout>
                <Stack>{AppLogo}</Stack>
                <Stack component="form" onSubmit={handleSubmit} sx={{ gap: 2, mt: 2 }}>
                    <DnInput
                        label="Identifiant"
                        name="login"
                        inputProps={{ maxLength: 48 }}
                        value={loginInput}
                        onChange={e => {
                            setLoginInput(e.target.value);
                            setInvalidCredentials(false);
                        }}
                        disabled={isDisabled}
                        required
                    />
                    <DnInput
                        label="Mot de passe"
                        name="password"
                        inputProps={{ maxLength: 256, autoComplete: 'off' }}
                        value={passwordInput}
                        onChange={e => {
                            setPasswordInput(e.target.value);
                            setInvalidCredentials(false);
                        }}
                        disabled={isDisabled}
                        type="password"
                        required
                    />
                    <DnButton type="submit" disabled={isDisabled} loading={isLoading}>
                        Connexion
                    </DnButton>
                </Stack>
                {errorMessage ? (
                    <Typography sx={{ color: 'error.main', fontSize: 'small', fontStyle: 'italic', mt: 2 }}>
                        {errorMessage}
                    </Typography>
                ) : null}
            </Layout>
        </Stack>
    );
}

const Layout = styled(Stack)(
    ({ theme }) => css`
        border-radius: ${theme.shape.borderRadius};
        padding: 2rem;
        background-color: ${theme.palette.background.paper};
        max-width: 360px;
        margin-top: 9rem;
    `
);
