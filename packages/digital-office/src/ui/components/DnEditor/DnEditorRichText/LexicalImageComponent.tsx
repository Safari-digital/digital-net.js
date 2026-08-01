import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { Box } from '@mui/material';
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    type NodeKey,
} from 'lexical';
import { LexicalImageContext } from './LexicalImageContext';
import type { DnEditorRichTextImageAttrs } from './types';

interface LexicalImageComponentProps extends DnEditorRichTextImageAttrs {
    nodeKey: NodeKey;
}

export function LexicalImageComponent({ src, alt, nodeKey }: LexicalImageComponentProps) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelected] = useLexicalNodeSelection(nodeKey);
    const { renderImage } = React.useContext(LexicalImageContext);

    React.useEffect(() => {
        const onDelete = (event: KeyboardEvent) => {
            if (!isSelected || !$isNodeSelection($getSelection())) return false;
            event.preventDefault();
            $getNodeByKey(nodeKey)?.remove();
            return true;
        };
        return mergeRegister(
            editor.registerCommand<MouseEvent>(
                CLICK_COMMAND,
                event => {
                    const element = editor.getElementByKey(nodeKey);
                    if (event.target instanceof Node && element?.contains(event.target)) {
                        clearSelected();
                        setSelected(true);
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
            editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW)
        );
    }, [editor, nodeKey, isSelected, setSelected, clearSelected]);

    return (
        <Box
            component="span"
            sx={theme => ({
                display: 'inline-block',
                lineHeight: 0,
                borderRadius: 0.5,
                outline: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
            })}
        >
            {renderImage ? renderImage({ src, alt }) : <img src={src} alt={alt} style={{ maxWidth: '100%' }} />}
        </Box>
    );
}
