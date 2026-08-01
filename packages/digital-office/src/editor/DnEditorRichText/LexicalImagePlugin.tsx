import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
    $createParagraphNode,
    $getNodeByKey,
    $insertNodes,
    $isRootOrShadowRoot,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_LOW,
} from 'lexical';
import { $createImageNode, $isImageNode, ImageNode } from './LexicalImageNode';
import { INSERT_IMAGE_COMMAND, OPEN_IMAGE_DIALOG_COMMAND } from './lexicalCommands';
import type { DnEditorRichTextImageAttrs, DnEditorRichTextImageDialogProps } from './types';

interface LexicalImagePluginProps {
    imageDialog?: (_props: DnEditorRichTextImageDialogProps) => React.ReactNode;
}

interface ImageDialogState {
    open: boolean;
    initial: DnEditorRichTextImageAttrs | null;
    targetKey: string | null;
}

const CLOSED: ImageDialogState = { open: false, initial: null, targetKey: null };

export function LexicalImagePlugin({ imageDialog }: LexicalImagePluginProps) {
    const [editor] = useLexicalComposerContext();
    const [state, setState] = React.useState<ImageDialogState>(CLOSED);
    const hasImageAction = !!imageDialog;

    React.useEffect(() => {
        if (!editor.hasNodes([ImageNode]))
            throw new Error('LexicalImagePlugin requires the ImageNode to be registered');
        return mergeRegister(
            editor.registerCommand<DnEditorRichTextImageAttrs>(
                INSERT_IMAGE_COMMAND,
                payload => {
                    const node = $createImageNode(payload);
                    $insertNodes([node]);
                    if ($isRootOrShadowRoot(node.getParentOrThrow())) {
                        $wrapNodeInElement(node, $createParagraphNode).selectEnd();
                    }
                    return true;
                },
                COMMAND_PRIORITY_EDITOR
            ),
            editor.registerCommand(
                OPEN_IMAGE_DIALOG_COMMAND,
                payload => {
                    if (!hasImageAction) return false;
                    const next: ImageDialogState = { ...CLOSED, open: true };
                    if (payload?.nodeKey) {
                        const key = payload.nodeKey;
                        editor.getEditorState().read(() => {
                            const node = $getNodeByKey(key);
                            if ($isImageNode(node)) {
                                next.targetKey = node.getKey();
                                next.initial = { src: node.getSrc(), alt: node.getAlt() };
                            }
                        });
                    }
                    setState(next);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, hasImageAction]);

    if (!imageDialog) return null;

    const close = () => setState(CLOSED);

    const handleSubmit = (attrs: DnEditorRichTextImageAttrs) => {
        if (state.targetKey) {
            const key = state.targetKey;
            editor.update(() => {
                const node = $getNodeByKey(key);
                if ($isImageNode(node)) {
                    node.setSrc(attrs.src);
                    node.setAlt(attrs.alt);
                }
            });
        } else {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, attrs);
        }
        setState(CLOSED);
        editor.focus();
    };

    return imageDialog({ open: state.open, initial: state.initial, onClose: close, onSubmit: handleSubmit });
}
