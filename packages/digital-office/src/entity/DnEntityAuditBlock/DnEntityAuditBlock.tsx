import * as React from 'react';
import { Stack, Typography } from '@mui/material';
import type { Entity } from '@digital-net-org/digital-api-sdk';
import { formatDate } from '../../ui/format';

export interface DnEntityAuditBlockProps {
    entity: Partial<Entity>;
}

export function DnEntityAuditBlock({ entity }: DnEntityAuditBlockProps) {
    const updatedAt = React.useMemo(() => (entity.updatedAt ? formatDate(entity.updatedAt) : null), [entity.updatedAt]);
    const createdAt = React.useMemo(() => formatDate(entity.createdAt), [entity.createdAt]);

    return (
        <Stack sx={{ pt: 4 }}>
            <Stack sx={theme => ({ gap: 2, p: 1, borderTop: `1px solid ${theme.palette.divider}` })}>
                <Typography variant="caption" color="textDisabled" sx={{ fontStyle: 'italic' }}>
                    Créé le {createdAt}
                    {updatedAt && (
                        <React.Fragment>
                            <br />
                            Derniere modification le {updatedAt}
                        </React.Fragment>
                    )}
                </Typography>
            </Stack>
        </Stack>
    );
}
