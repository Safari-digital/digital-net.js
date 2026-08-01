import * as React from 'react';
import { Delete as DeleteIcon, Refresh as RefreshIcon, Save as SaveIcon } from '@mui/icons-material';
import { Alert, CircularProgress, Link, Typography } from '@mui/material';
import { DnDialog, DnIconButton, DnView, type DnViewTab } from '../../ui';
import { formatDate } from '../../ui/format';

export interface EntityViewProps {
    title: string;
    description?: string;
    tabs?: DnViewTab[];
    children?: React.ReactNode;
    isNew?: boolean;
    isSaving?: boolean;
    isDirty?: boolean;
    hasConflict?: boolean;
    baselineUpdatedAt?: string | null;
    apiUpdatedAt?: string | null;
    onSave?: () => void | Promise<void>;
    onDelete?: () => void | Promise<void>;
    onReload?: () => void | Promise<void>;
}

/**
 * Entity-edit preset of {@link DnView}: builds the save/reload/delete action bar
 * and the optimistic-conflict banner, and owns the reload confirmation dialog.
 * The generic layout, tabs and URL-synced navigation live in `DnView`.
 */
export function EntityView({
    title,
    description,
    tabs,
    children,
    isNew = false,
    isSaving = false,
    isDirty = false,
    hasConflict = false,
    baselineUpdatedAt,
    apiUpdatedAt,
    onSave,
    onDelete,
    onReload,
}: EntityViewProps) {
    const [reloadDialogOpen, setReloadDialogOpen] = React.useState(false);

    const confirmReload = React.useCallback(async () => {
        setReloadDialogOpen(false);
        if (onReload) await onReload();
    }, [onReload]);

    const hasActions = Boolean(onSave || onDelete || onReload);
    const saveDisabled = !isDirty || hasConflict || isSaving;
    const discardDisabled = !isDirty || isSaving;

    const renderActions = hasActions ? (
        <React.Fragment>
            {isSaving ? <CircularProgress size={20} /> : null}
            {onSave ? (
                <DnIconButton tooltip="Enregistrer" disabled={saveDisabled} onClick={() => void onSave()}>
                    <SaveIcon />
                </DnIconButton>
            ) : null}
            {onReload ? (
                <DnIconButton
                    tooltip="Annuler les modifications locales"
                    disabled={discardDisabled}
                    onClick={() => setReloadDialogOpen(true)}
                >
                    <RefreshIcon />
                </DnIconButton>
            ) : null}
            {onDelete && !isNew ? (
                <DnIconButton tooltip="Supprimer" disabled={isSaving} onClick={() => void onDelete()}>
                    <DeleteIcon />
                </DnIconButton>
            ) : null}
        </React.Fragment>
    ) : null;

    const banner = hasConflict ? (
        <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
            <Typography variant="body2">
                Ce formulaire a été modifié depuis le début de votre édition locale.
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                Modifiée côté serveur : {formatDate(apiUpdatedAt)} · Vos modifications depuis :{' '}
                {formatDate(baselineUpdatedAt)}
            </Typography>
            {onReload ? (
                <Link component="button" type="button" onClick={() => setReloadDialogOpen(true)} sx={{ mt: 0.5 }}>
                    Recharger les données
                </Link>
            ) : null}
        </Alert>
    ) : null;

    return (
        <React.Fragment>
            <DnView
                title={title}
                description={description}
                isDirty={isDirty}
                tabs={tabs}
                renderActions={renderActions}
                renderBanner={banner}
            >
                {children}
            </DnView>
            <DnDialog
                open={reloadDialogOpen}
                onClose={() => setReloadDialogOpen(false)}
                onConfirm={confirmReload}
                confirmLabel="Recharger"
                title="Recharger les données"
            >
                Attention, vos modifications locales seront perdues. Continuer ?
            </DnDialog>
        </React.Fragment>
    );
}
