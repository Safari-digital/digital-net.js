import * as React from 'react';
import { Stack, css, styled } from '@mui/material';
import { DnDialog } from '../../ui/components/DnDialog';
import { DnInput } from '../../ui/components/DnInput';

export interface LexicalLinkValue {
    url: string;
    text: string;
}

export interface LexicalLinkDialogProps {
    open: boolean;
    initial: LexicalLinkValue | null;
    onClose: () => void;
    onSubmit: (_value: LexicalLinkValue) => void;
}

export function LexicalLinkDialog({ open, initial, onClose, onSubmit }: LexicalLinkDialogProps) {
    const [url, setUrl] = React.useState('');
    const [text, setText] = React.useState('');
    const [prevOpen, setPrevOpen] = React.useState(open);

    if (prevOpen !== open) {
        setPrevOpen(open);
        if (open) {
            setUrl(initial?.url ?? '');
            setText(initial?.text ?? '');
        }
    }

    const handleConfirm = () => {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;
        onSubmit({ url: trimmedUrl, text: text.trim() });
    };

    return (
        <DnDialog
            open={open}
            title={initial?.url ? 'Modifier le lien' : 'Insérer un lien'}
            onClose={onClose}
            onConfirm={handleConfirm}
            disabled={!url.trim()}
        >
            <DialogContent>
                <DnInput label="URL" value={url} onChange={e => setUrl(e.target.value)} autoFocus required fullWidth />
                <DnInput
                    label="Texte du lien"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    helperText="Laisser vide pour afficher l'URL."
                    fullWidth
                />
            </DialogContent>
        </DnDialog>
    );
}

const DialogContent = styled(Stack)(
    ({ theme }) => css`
        margin-top: ${theme.spacing(1)};
        gap: ${theme.spacing(2)};

        & .MuiInputBase-root {
            min-width: 350px;
        }
    `
);
