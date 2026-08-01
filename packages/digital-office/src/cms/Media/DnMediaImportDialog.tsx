import * as React from 'react';
import { Typography } from '@mui/material';
import { useDigitalNetApi } from '../../api';
import { ImportDialog } from '../../ui/components/Import';
import { formatFileSize } from '../../ui/format';

export interface DnMediaImportDialogProps {
    open: boolean;
    onClose: () => void;
    onUploaded?: () => void;
}

export function DnMediaImportDialog({ open, onClose, onUploaded }: DnMediaImportDialogProps) {
    const api = useDigitalNetApi();

    const [contentTypes, setContentTypes] = React.useState<readonly string[]>([]);
    const [maxSize, setMaxSize] = React.useState<number | null>(null);
    const [constraintsError, setConstraintsError] = React.useState<string | null>(null);
    const [hasLoadedConstraints, setHasLoadedConstraints] = React.useState(false);

    React.useEffect(() => {
        if (!open || hasLoadedConstraints) return;
        let cancelled = false;
        (async () => {
            const [ctResult, msResult] = await Promise.all([
                api.catalog.media.getContentTypes(),
                api.catalog.media.getMaxSize(),
            ]);
            if (cancelled) return;
            if (ctResult.hasError || msResult.hasError) {
                setConstraintsError("Impossible de charger les contraintes d'upload, veuillez réessayer.");
            } else {
                setContentTypes(ctResult.value);
                setMaxSize(msResult.value);
            }
            setHasLoadedConstraints(true);
        })();
        return () => {
            cancelled = true;
        };
    }, [open, hasLoadedConstraints, api]);

    const uploadFile = React.useCallback(
        async (file: File): Promise<string | null> => {
            const result = await api.catalog.media.upload(file);
            if (result.hasError) return "Ce fichier n'est pas valide.";
            // FIXME: SDK does not returns the correct error code, when cannot use it to display the correct error code.
            // if (result.hasError) return result.errors[0]?.code || 'Erreur inconnue';
            return null;
        },
        [api]
    );

    const helperText: React.ReactNode =
        constraintsError || maxSize === null ? (
            <Typography variant="caption" color="error" component="span">
                {constraintsError}
            </Typography>
        ) : (
            `Taille max par fichier : ${formatFileSize(maxSize)}`
        );

    return (
        <ImportDialog
            open={open}
            onClose={onClose}
            onUploaded={onUploaded}
            title="Importer un ou plusieurs médias"
            accept={contentTypes.join(',')}
            helperText={helperText}
            uploadFile={uploadFile}
            disabled={!hasLoadedConstraints || Boolean(constraintsError)}
        />
    );
}
