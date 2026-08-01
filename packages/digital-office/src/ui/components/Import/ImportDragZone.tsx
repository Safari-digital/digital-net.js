import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ImportDragZoneProps {
    /** Comma-separated MIME types, used as `<input accept>`. */
    accept?: string;
    helperText?: React.ReactNode;
    onFilesAdded: (_files: File[]) => void;
    disabled?: boolean;
}

export function ImportDragZone({ accept, helperText, onFilesAdded, disabled }: ImportDragZoneProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);

    const handleDrop = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (disabled) return;
            setIsDraggingOver(false);
            if (e.dataTransfer.files.length > 0) onFilesAdded(Array.from(e.dataTransfer.files));
        },
        [disabled, onFilesAdded]
    );

    const handleDragOver = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (disabled) return;
            setIsDraggingOver(true);
        },
        [disabled]
    );

    const handleDragLeave = React.useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (disabled) return;
            setIsDraggingOver(false);
        },
        [disabled]
    );

    const handlePickFiles = React.useCallback(() => {
        if (disabled) return;
        fileInputRef.current?.click();
    }, [disabled]);

    const handleFileInputChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled) return;
            if (e.target.files) onFilesAdded(Array.from(e.target.files));
            e.target.value = '';
        },
        [disabled, onFilesAdded]
    );

    return (
        <Box>
            <DropZone
                $disabled={disabled}
                $hover={isDraggingOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handlePickFiles}
            >
                <Typography>Glissez vos fichiers ici ou cliquez pour sélectionner</Typography>
                {helperText ? (
                    <Typography variant="caption" color="text.secondary">
                        {helperText}
                    </Typography>
                ) : null}
            </DropZone>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={accept || undefined}
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />
        </Box>
    );
}

const DropZone = styled(Box, { shouldForwardProp: prop => prop !== '$hover' && prop !== '$disabled' })<{
    $hover: boolean | undefined;
    $disabled: boolean | undefined;
}>(({ theme, $hover, $disabled }) => ({
    border: `2px dashed`,
    borderColor: (() => {
        if ($disabled) return theme.palette.text.disabled;
        if ($hover) return theme.palette.primary.main;
        return theme.palette.divider;
    })(),
    backgroundColor: $hover && !$disabled ? theme.palette.action.hover : 'transparent',
    color: $disabled ? theme.palette.text.disabled : theme.palette.text.primary,
    padding: theme.spacing(4),
    borderRadius: 8,
    textAlign: 'center',
    cursor: $disabled ? 'default' : 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    transition: 'border-color 150ms, background-color 150ms',
}));
