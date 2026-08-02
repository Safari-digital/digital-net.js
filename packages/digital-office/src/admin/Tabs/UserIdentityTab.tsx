import * as React from 'react';
import { FormControlLabel, Stack, Typography } from '@mui/material';
import { useCustomNode } from '../../app';
import { DnEntityAuditBlock } from '../../entity';
import { DnSwitch } from '../../ui';
import { type useUserData } from '../useUserData';

type ReadOnlyData = ReturnType<typeof useUserData>['readOnlyData'];

interface UserIdentityTabProps {
    readOnlyData: ReadOnlyData;
    formState: ReturnType<typeof useUserData>['formState'];
    setFormState: ReturnType<typeof useUserData>['setFormState'];
    disabled: boolean;
}

const readOnlyLabels: Record<keyof Omit<ReadOnlyData, 'updatedAt' | 'createdAt'>, string> = {
    email: 'Adresse email',
    login: 'Identifiant de connexion',
    username: "Nom d'utilisateur",
};

export function UserIdentityTab({ readOnlyData, formState, setFormState, disabled }: UserIdentityTabProps) {
    const { renderCustomNode } = useCustomNode();
    const { updatedAt, createdAt, ...identityInfo } = readOnlyData;

    return (
        <Stack spacing={2} sx={{ maxWidth: 720 }}>
            {renderCustomNode({ entity: 'User', view: 'edit:tab:general:before' })}
            <Stack sx={{ gap: 2 }}>
                {Object.entries(identityInfo).map(([key, value]) => (
                    <Stack key={key}>
                        <Typography variant="caption">{readOnlyLabels[key as keyof typeof identityInfo]}</Typography>
                        <Typography>{value}</Typography>
                    </Stack>
                ))}
                {[
                    {
                        key: 'isActive' as const,
                        caption: "Status de l'utilisateur",
                        trueLabel: 'Actif',
                        falseLabel: 'Inactif',
                    },
                    {
                        key: 'isAdmin' as const,
                        caption: "Role de l'utilisateur",
                        trueLabel: 'Administrateur',
                        falseLabel: 'Utilisateur',
                    },
                ].map(({ key, caption, trueLabel, falseLabel }) => (
                    <Stack key={key}>
                        <Typography variant="caption">{caption}</Typography>
                        <FormControlLabel
                            control={
                                <DnSwitch
                                    checked={formState[key]}
                                    onChange={(_, checked) => setFormState(prev => ({ ...prev, [key]: checked }))}
                                    disabled={disabled}
                                />
                            }
                            label={formState[key] ? trueLabel : falseLabel}
                        />
                    </Stack>
                ))}
            </Stack>
            {renderCustomNode({ entity: 'User', view: 'edit:tab:general:after' })}
            <DnEntityAuditBlock entity={{ updatedAt, createdAt }} />
        </Stack>
    );
}
