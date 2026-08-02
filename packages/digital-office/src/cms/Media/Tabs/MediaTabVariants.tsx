import * as React from 'react';
import { Delete as DeleteIcon } from '@mui/icons-material';
import {
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import type { MediaDto, MediaVariantDto } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, useDigitalNetApi } from '../../../api';
import { useDnToast } from '../../../app';
import { useDnEntityFormContext } from '../../../entity';
import { DnButton, DnDialog } from '../../../ui';
import { formatDate, formatDimensions, formatFileSize } from '../../../ui/format';

type ConfirmTarget = { kind: 'all' } | { kind: 'one'; variantId: string } | null;

export function MediaTabVariants() {
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();
    const { showToast } = useDnToast();
    const { values } = useDnEntityFormContext<MediaDto>();

    const [confirmTarget, setConfirmTarget] = React.useState<ConfirmTarget>(null);
    const [isPurging, setIsPurging] = React.useState(false);

    const variants = values.variants ?? [];
    const mediaId = values.id;

    const refresh = React.useCallback(() => {
        if (!mediaId) return;
        return queryClient.invalidateQueries({ queryKey: dnBuildKeyFromId('Media', mediaId) });
    }, [queryClient, mediaId]);

    const handleConfirm = async () => {
        if (!confirmTarget || !mediaId) return;
        setIsPurging(true);
        const result =
            confirmTarget.kind === 'all'
                ? await api.catalog.media.purgeMediaVariants(mediaId)
                : await api.catalog.media.purgeVariant(confirmTarget.variantId);
        setIsPurging(false);
        setConfirmTarget(null);
        if (result.hasError) {
            showToast('La purge a échoué.', 'error');
            return;
        }
        showToast(confirmTarget.kind === 'all' ? 'Tous les variants ont été purgés.' : 'Variant purgé.');
        await refresh();
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {variants.length === 0
                        ? 'Aucun variant en cache pour ce média.'
                        : `${variants.length} variant${variants.length > 1 ? 's' : ''} en cache.`}
                </Typography>
                <DnButton
                    variant="outlined"
                    disabled={variants.length === 0 || isPurging}
                    onClick={() => setConfirmTarget({ kind: 'all' })}
                >
                    Purger tous les variants
                </DnButton>
            </Stack>

            {variants.length > 0 ? (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Dimensions</TableCell>
                                <TableCell>Qualité</TableCell>
                                <TableCell>Taille</TableCell>
                                <TableCell>Type MIME</TableCell>
                                <TableCell>Généré le</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {variants.map(v => (
                                <VariantRow
                                    key={v.id}
                                    variant={v}
                                    disabled={isPurging}
                                    onPurge={() => setConfirmTarget({ kind: 'one', variantId: v.id })}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : null}

            <DnDialog
                open={confirmTarget !== null}
                onClose={() => setConfirmTarget(null)}
                onConfirm={handleConfirm}
                confirmLabel="Purger"
            >
                <Typography>
                    {confirmTarget?.kind === 'all'
                        ? `Vous êtes sur le point de purger ${variants.length} variant${variants.length > 1 ? 's' : ''} en cache. Les variants seront régénérés à la demande lors des prochains accès.`
                        : "Vous êtes sur le point de purger ce variant. Il sera régénéré à la demande lors d'un prochain accès."}
                </Typography>
            </DnDialog>
        </Stack>
    );
}

interface VariantRowProps {
    variant: MediaVariantDto;
    disabled: boolean;
    onPurge: () => void;
}

function VariantRow({ variant, disabled, onPurge }: VariantRowProps) {
    return (
        <TableRow hover>
            <TableCell>{formatDimensions(variant.width, variant.height)}</TableCell>
            <TableCell>{variant.quality}</TableCell>
            <TableCell>{formatFileSize(variant.fileSize)}</TableCell>
            <TableCell>{variant.mimeType}</TableCell>
            <TableCell>{formatDate(variant.createdAt)}</TableCell>
            <TableCell align="right">
                <IconButton size="small" onClick={onPurge} disabled={disabled} aria-label="Purger ce variant">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
}
