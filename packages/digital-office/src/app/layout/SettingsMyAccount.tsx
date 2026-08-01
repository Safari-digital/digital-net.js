import * as React from 'react';
import { Divider, Stack, Typography } from '@mui/material';
import { formatDate } from '../../ui/format';
import { useDigitalNetUser } from '../user';
import { SettingsMyAccountPassword } from './SettingsMyAccountPassword';

const identityLabels = {
    email: 'Adresse email',
    login: 'Identifiant de connexion',
    username: "Nom d'utilisateur",
} as const;

export function SettingsMyAccount() {
    const { user } = useDigitalNetUser();

    const identityInfo = React.useMemo(
        () =>
            ({
                login: { value: user?.login, readOnly: true },
                username: { value: user?.username },
                email: { value: user?.email },
            }) as const,
        [user]
    );

    return (
        <Stack sx={{ padding: 2, overflowX: 'auto' }}>
            <Stack sx={{ gap: 2 }}>
                {Object.entries(identityInfo).map(([key, field]) => (
                    <Stack key={key}>
                        <Typography variant="caption">{identityLabels[key as keyof typeof identityInfo]}</Typography>
                        <Typography>{field.value}</Typography>
                    </Stack>
                ))}
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Inscrit depuis le {formatDate(user?.createdAt, 'dateOnly')}
                </Typography>
                <Divider />
                <SettingsMyAccountPassword />
            </Stack>
        </Stack>
    );
}
