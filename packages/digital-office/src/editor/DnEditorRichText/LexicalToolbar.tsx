import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    FormatAlignCenter as AlignCenterIcon,
    FormatAlignJustify as AlignJustifyIcon,
    FormatAlignLeft as AlignLeftIcon,
    FormatAlignRight as AlignRightIcon,
    FormatBold as BoldIcon,
    Image as ImageIcon,
    FormatItalic as ItalicIcon,
    InsertLink as LinkIcon,
    FormatListNumbered as OlIcon,
    FormatQuote as QuoteIcon,
    Redo as RedoIcon,
    StrikethroughS as StrikeIcon,
    Title as TitleIcon,
    FormatListBulleted as UlIcon,
    FormatUnderlined as UnderlineIcon,
    Undo as UndoIcon,
} from '@mui/icons-material';
import { Stack, css, styled } from '@mui/material';
import { DnIconButton } from '../../ui/components/DnIconButton';
import { LexicalToolbarDivider } from './LexicalToolbarDivider';
import { OPEN_IMAGE_DIALOG_COMMAND, OPEN_LINK_DIALOG_COMMAND } from './lexicalCommands';
import { LEXICAL_HEADING_LEVELS } from './lexicalConfig';
import { useLexicalFormatters } from './useLexicalFormatters';
import { useLexicalHistory } from './useLexicalHistory';

interface LexicalToolbarProps {
    disabled?: boolean;
    hasImageAction?: boolean;
}

export function LexicalToolbar({ disabled = false, hasImageAction = false }: LexicalToolbarProps) {
    const [editor] = useLexicalComposerContext();
    const { canUndo, canRedo, undo, redo } = useLexicalHistory(editor);
    const {
        formatHeading,
        formatQuote,
        toBold,
        toItalic,
        toUnderline,
        toStrikethrough,
        toOrderedList,
        toUnorderedList,
        toAlignLeft,
        toAlignCenter,
        toAlignRight,
        toAlignJustify,
    } = useLexicalFormatters(editor);

    return (
        <ToolBar>
            {[
                { label: 'Annuler', icon: <UndoIcon />, disabled: disabled || !canUndo, onClick: undo },
                { label: 'Rétablir', icon: <RedoIcon />, disabled: disabled || !canRedo, onClick: redo },
            ].map(({ icon, label, ...rest }) => (
                <DnIconButton key={label} tooltip={label} size="small" {...rest}>
                    {icon}
                </DnIconButton>
            ))}
            <LexicalToolbarDivider />
            {[
                { label: 'Gras', icon: <BoldIcon />, onClick: toBold },
                { label: 'Italique', icon: <ItalicIcon />, onClick: toItalic },
                { label: 'Souligné', icon: <UnderlineIcon />, onClick: toUnderline },
                { label: 'Barré', icon: <StrikeIcon />, onClick: toStrikethrough },
            ].map(({ icon, label, ...rest }) => (
                <DnIconButton key={label} tooltip={label} disabled={disabled} {...rest}>
                    {icon}
                </DnIconButton>
            ))}
            <LexicalToolbarDivider />
            {LEXICAL_HEADING_LEVELS.map(tag => (
                <DnIconButton
                    key={tag}
                    tooltip={tag.toUpperCase()}
                    disabled={disabled}
                    onClick={() => formatHeading(tag)}
                    sx={{ position: 'relative' }}
                >
                    <TitleIcon fontSize="small" />
                    <span style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, fontWeight: 700 }}>
                        {tag.slice(1)}
                    </span>
                </DnIconButton>
            ))}
            <LexicalToolbarDivider />
            {[
                { label: 'Liste à puces', icon: <UlIcon />, onClick: toUnorderedList },
                { label: 'Liste ordonnée', icon: <OlIcon />, onClick: toOrderedList },
                { label: 'Citation', icon: <QuoteIcon />, onClick: formatQuote },
            ].map(({ icon, label, ...rest }) => (
                <DnIconButton key={label} tooltip={label} disabled={disabled} {...rest}>
                    {icon}
                </DnIconButton>
            ))}
            <LexicalToolbarDivider />
            {[
                { label: 'Aligner à gauche', icon: <AlignLeftIcon />, onClick: toAlignLeft },
                { label: 'Centrer', icon: <AlignCenterIcon />, onClick: toAlignCenter },
                { label: 'Aligner à droite', icon: <AlignRightIcon />, onClick: toAlignRight },
                { label: 'Justifier', icon: <AlignJustifyIcon />, onClick: toAlignJustify },
            ].map(({ icon, label, ...rest }) => (
                <DnIconButton key={label} tooltip={label} disabled={disabled} {...rest}>
                    {icon}
                </DnIconButton>
            ))}
            <LexicalToolbarDivider />
            <DnIconButton
                tooltip="Lien"
                disabled={disabled}
                onClick={() => editor.dispatchCommand(OPEN_LINK_DIALOG_COMMAND, undefined)}
            >
                <LinkIcon />
            </DnIconButton>
            {hasImageAction && (
                <DnIconButton
                    tooltip="Image"
                    disabled={disabled}
                    onClick={() => editor.dispatchCommand(OPEN_IMAGE_DIALOG_COMMAND, undefined)}
                >
                    <ImageIcon />
                </DnIconButton>
            )}
        </ToolBar>
    );
}

const ToolBar = styled(Stack)(
    ({ theme }) => css`
        flex-direction: row;
        flex-wrap: wrap;
        gap: ${theme.spacing(0.25)};
        padding: ${theme.spacing(0.5)};
        border-bottom: 1px solid;
        border-color: ${theme.palette.divider};
        font-size: ${theme.typography.fontSize * 0.75};

        & .MuiIconButton-sizeSmall .MuiSvgIcon-fontSizeMedium {
            height: 20px;
            width: 20px;
        }
    `
);
