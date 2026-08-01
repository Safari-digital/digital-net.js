import * as React from 'react';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { css, styled } from '@mui/material/styles';
import { DnMediaContentImage, DnMediaInsertDialog } from '../../cms/Media';
import { LazyDnEditorCode } from '../DnEditorCode';
import { LazyDnEditorRichText } from '../DnEditorRichText';
import type { DnEditorRichTextImageAttrs, DnEditorRichTextImageDialogProps } from '../DnEditorRichText';
import { useEditorScrollMemory } from '../useEditorScrollMemory';

export type DnContentEditorMode = 'wysiwyg' | 'html';

export interface DnContentEditorProps {
    value: string;
    onChange: (_value: string) => void;
    disabled?: boolean;
    /** Replaces the media insert dialog wired by default. */
    imageDialog?: (_props: DnEditorRichTextImageDialogProps) => React.ReactNode;
    /** Replaces the authenticated media image renderer wired by default. */
    renderImage?: (_attrs: DnEditorRichTextImageAttrs) => React.ReactNode;
}

const defaultImageDialog = (props: DnEditorRichTextImageDialogProps) => <DnMediaInsertDialog {...props} />;
const defaultRenderImage = (attrs: DnEditorRichTextImageAttrs) => <DnMediaContentImage {...attrs} />;

/**
 * HTML content editor with a WYSIWYG (rich text) / HTML (code) toggle.
 *
 * Both modes edit the same HTML string — switching never converts anything.
 * A round-trip through the WYSIWYG normalizes the markup: whatever the Lexical
 * node schema does not know is lost on the first edit in that mode.
 */
export function DnContentEditor({
    value,
    onChange,
    disabled,
    imageDialog = defaultImageDialog,
    renderImage = defaultRenderImage,
}: DnContentEditorProps) {
    const [mode, setMode] = React.useState<DnContentEditorMode>('wysiwyg');
    const scrollMemory = useEditorScrollMemory(mode);

    const handleModeChange = (_: React.MouseEvent<HTMLElement>, next: DnContentEditorMode | null) =>
        next ? setMode(next) : void 0;

    return (
        <Stack sx={{ height: '100%' }}>
            <Toolbar>
                <ToggleGroup
                    value={mode}
                    onChange={handleModeChange}
                    exclusive
                    size="small"
                    aria-label="Mode d'édition"
                >
                    <ToggleButton value="wysiwyg">Texte enrichi</ToggleButton>
                    <ToggleButton value="html">HTML</ToggleButton>
                </ToggleGroup>
            </Toolbar>

            <Stack sx={{ flex: 1, minHeight: 0 }}>
                {mode === 'html' ? (
                    <LazyDnEditorCode
                        language="html"
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        {...scrollMemory}
                    />
                ) : (
                    <LazyDnEditorRichText
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        {...scrollMemory}
                        imageDialog={imageDialog}
                        renderImage={renderImage}
                    />
                )}
            </Stack>
        </Stack>
    );
}

const ToggleGroup = styled(ToggleButtonGroup)(
    ({ theme }) => css`
        padding: 0;
        transform-origin: top right;

        & .MuiButtonBase-root {
            font-size: xx-small;
            padding: ${theme.spacing(0.5)} ${theme.spacing(0.75)} ${theme.spacing(0.25)};
        }
    `
);

const Toolbar = styled(Stack)(
    ({ theme }) => css`
        padding: ${theme.spacing(1)} 0;
        flex-direction: row;
        justify-content: end;
        align-items: center;
        gap: ${theme.spacing(1)};
    `
);
