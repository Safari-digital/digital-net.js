import * as React from 'react';
import { Stack, css, styled } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MediaDto } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, dnBuildListKey, useDigitalNetApi } from '../../api';
import { DnButton, DnDialog, DnInput } from '../../ui';
import type { DnEditorRichTextImageDialogProps } from '../../editor';
import { DnMediaImportDialog } from './DnMediaImportDialog';
import { DnMediaPicker } from './DnMediaPicker';
import { dnParseMediaImageUrl } from './dnParseMediaImageUrl';

export type DnMediaInsertDialogProps = DnEditorRichTextImageDialogProps;

export function DnMediaInsertDialog({ open, initial, onClose, onSubmit }: DnMediaInsertDialogProps) {
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();

    const [media, setMedia] = React.useState<MediaDto | null>(null);
    const [alt, setAlt] = React.useState('');
    const [importOpen, setImportOpen] = React.useState(false);
    const [prevOpen, setPrevOpen] = React.useState(open);

    const initialId = initial ? (dnParseMediaImageUrl(initial.src)?.id ?? null) : null;

    // Pre-load the media being edited so the picker can show it selected.
    const { data: initialMedia } = useQuery({
        queryKey: dnBuildKeyFromId('media', initialId ?? ''),
        queryFn: async () => {
            const result = await api.catalog.media.getById(initialId ?? '');
            if (result.hasError || !result.value) throw new Error(result.errors[0]?.message ?? 'Media fetch failed');
            return result.value;
        },
        enabled: open && !!initialId,
    });

    const [prevInitialMedia, setPrevInitialMedia] = React.useState(initialMedia);

    if (prevOpen !== open) {
        setPrevOpen(open);
        if (open) {
            setMedia(null);
            setAlt(initial?.alt ?? '');
        }
    }
    if (prevInitialMedia !== initialMedia) {
        setPrevInitialMedia(initialMedia);
        if (initialMedia) setMedia(initialMedia);
    }

    const handleMediaChange = (next: MediaDto | null) => {
        setMedia(next);
        if (next && !alt) setAlt(next.alt ?? '');
    };

    const handleSubmit = () => {
        if (!media) return;
        onSubmit({ src: api.catalog.media.getImageUrl(media.id), alt: alt.trim() });
    };

    return (
        <React.Fragment>
            <DnDialog
                open={open}
                title={initial ? "Modifier l'image" : 'Insérer une image'}
                onClose={onClose}
                onConfirm={handleSubmit}
                disabled={!media}
            >
                <DialogContent>
                    <DnMediaPicker value={media} onChange={handleMediaChange} />
                    <DnButton variant="outlined" onClick={() => setImportOpen(true)}>
                        Importer un média
                    </DnButton>
                    <DnInput
                        className="Alt-input"
                        label="Texte alternatif"
                        value={alt}
                        onChange={e => setAlt(e.target.value)}
                        helperText="Décrit l'image pour l'accessibilité et le SEO."
                        fullWidth
                    />
                </DialogContent>
            </DnDialog>
            <DnMediaImportDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onUploaded={() => void queryClient.invalidateQueries({ queryKey: dnBuildListKey('media') })}
            />
        </React.Fragment>
    );
}

const DialogContent = styled(Stack)(
    ({ theme }) => css`
        margin-top: ${theme.spacing(1)};
        gap: ${theme.spacing(2)};

        & .Alt-input {
            min-width: 400px;
        }
    `
);
