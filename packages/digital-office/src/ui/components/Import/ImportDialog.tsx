import * as React from 'react';
import { CheckCircle as CheckCircleIcon, Close as CloseIcon, Error as ErrorIcon } from '@mui/icons-material';
import {
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import { formatFileSize } from '../../format';
import { DnButton } from '../DnButton';
import { ImportDragZone } from './ImportDragZone';

type ImportStatus = 'pending' | 'uploading' | 'done' | 'error';

interface ImportItem {
    id: string;
    file: File;
    status: ImportStatus;
    errorMessage?: string;
}

export interface ImportDialogProps {
    open: boolean;
    onClose: () => void;
    onUploaded?: () => void;
    title?: string;
    accept?: string;
    helperText?: React.ReactNode;
    /** Should return a string on error or null on success. **/
    uploadFile: (_file: File) => Promise<string | null>;
    disabled?: boolean;
}

export function ImportDialog({
    open,
    onClose,
    onUploaded,
    title,
    accept,
    helperText,
    uploadFile,
    disabled = false,
}: ImportDialogProps) {
    const [items, setItems] = React.useState<ImportItem[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);

    const handleFilesAdded = React.useCallback((files: File[]) => {
        if (files.length === 0) return;
        setItems(prev => [
            ...prev,
            ...files.map<ImportItem>(file => ({
                id: crypto.randomUUID(),
                file,
                status: 'pending',
            })),
        ]);
    }, []);

    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(item => item.id !== id));

    const handleImport = async () => {
        const toUpload = items.filter(it => it.status === 'pending' || it.status === 'error');
        if (toUpload.length === 0) return;
        const toUploadIds = new Set(toUpload.map(it => it.id));

        setIsUploading(true);
        setItems(prev =>
            prev.map(it => (toUploadIds.has(it.id) ? { ...it, status: 'uploading', errorMessage: undefined } : it))
        );

        const results = await Promise.all(
            toUpload.map(async it => {
                const errorMessage = await uploadFile(it.file);
                setItems(prev =>
                    prev.map(p => {
                        if (p.id !== it.id) return p;
                        if (errorMessage === null) return { ...p, status: 'done', errorMessage: undefined };
                        return { ...p, status: 'error', errorMessage };
                    })
                );
                return { id: it.id, errorMessage };
            })
        );

        const anySuccess = results.some(r => r.errorMessage === null);
        const allDone = results.every(r => r.errorMessage === null);

        setIsUploading(false);
        if (anySuccess) onUploaded?.();
        if (allDone) {
            setItems([]);
            onClose();
        }
    };

    const handleCancel = () => {
        if (isUploading) return;
        setItems([]);
        onClose();
    };

    const pendingCount = items.filter(it => it.status === 'pending' || it.status === 'error').length;
    const canImport = !disabled && pendingCount > 0 && !isUploading;

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            <DialogContent>
                <Stack spacing={2}>
                    <ImportDragZone
                        accept={accept}
                        helperText={helperText}
                        onFilesAdded={handleFilesAdded}
                        disabled={disabled || isUploading}
                    />
                    {items.length > 0 ? (
                        <Stack spacing={1}>
                            {items.map(item => (
                                <ItemRow
                                    key={item.id}
                                    item={item}
                                    onRemove={() => handleRemoveItem(item.id)}
                                    disabled={isUploading}
                                />
                            ))}
                        </Stack>
                    ) : null}
                </Stack>
            </DialogContent>
            <DialogActions>
                <DnButton variant="outlined" onClick={handleCancel} disabled={isUploading}>
                    Annuler
                </DnButton>
                <DnButton onClick={handleImport} disabled={!canImport} loading={isUploading}>
                    Importer
                </DnButton>
            </DialogActions>
        </Dialog>
    );
}

function ItemRow({ item, onRemove, disabled }: { item: ImportItem; onRemove: () => void; disabled: boolean }) {
    return (
        <Box>
            <Stack
                direction="row"
                spacing={1}
                sx={theme => ({
                    alignItems: 'center',
                    color: item.status === 'error' ? theme.palette.error.light : theme.palette.text.primary,
                })}
            >
                <Stack sx={{ width: 24, justifyContent: 'center', alignItems: 'center' }}>
                    {(() => {
                        if (item.status === 'uploading') return <CircularProgress size={16} />;
                        if (item.status === 'done') return <CheckCircleIcon sx={{ fontSize: 24 }} />;
                        if (item.status === 'error') return <ErrorIcon sx={{ fontSize: 24, color: 'error.main' }} />;
                        return null;
                    })()}
                </Stack>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap variant="body2">
                        {item.file.name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Typography noWrap variant="caption" color="text.secondary">
                            {formatFileSize(item.file.size)}
                        </Typography>
                        {item.status === 'error' && item.errorMessage ? (
                            <Typography variant="caption">{item.errorMessage}</Typography>
                        ) : null}
                    </Stack>
                </Box>
                <IconButton
                    size="small"
                    onClick={onRemove}
                    disabled={disabled || item.status === 'done'}
                    aria-label="Retirer"
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    );
}
