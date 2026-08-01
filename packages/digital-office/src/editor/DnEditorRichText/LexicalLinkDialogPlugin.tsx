import * as React from 'react';
import { $createLinkNode, $isLinkNode, type LinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent } from '@lexical/utils';
import { $createTextNode, $getNodeByKey, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';
import { LexicalLinkDialog, type LexicalLinkValue } from './LexicalLinkDialog';
import { OPEN_LINK_DIALOG_COMMAND } from './lexicalCommands';

interface LinkDialogState {
    open: boolean;
    initial: LexicalLinkValue | null;
    targetKey: string | null;
    selectedText: string;
    canToggle: boolean;
}

const CLOSED: LinkDialogState = { open: false, initial: null, targetKey: null, selectedText: '', canToggle: false };

export function LexicalLinkDialogPlugin() {
    const [editor] = useLexicalComposerContext();
    const [state, setState] = React.useState<LinkDialogState>(CLOSED);

    React.useEffect(
        () =>
            editor.registerCommand(
                OPEN_LINK_DIALOG_COMMAND,
                payload => {
                    const next: LinkDialogState = { ...CLOSED, open: true, initial: { url: '', text: '' } };
                    editor.getEditorState().read(() => {
                        const link = resolveLink(payload?.nodeKey);
                        if (link) {
                            next.targetKey = link.getKey();
                            next.initial = { url: link.getURL(), text: link.getTextContent() };
                            return;
                        }
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                            next.selectedText = selection.getTextContent();
                            next.canToggle = !selection.isCollapsed();
                            next.initial = { url: '', text: next.selectedText };
                        }
                    });
                    setState(next);
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
        [editor]
    );

    const close = () => setState(CLOSED);

    const handleSubmit = (value: LexicalLinkValue) => {
        applyLink(editor, state, value);
        setState(CLOSED);
        editor.focus();
    };

    return <LexicalLinkDialog open={state.open} initial={state.initial} onClose={close} onSubmit={handleSubmit} />;
}

function resolveLink(nodeKey: string | undefined): LinkNode | null {
    if (nodeKey) {
        const node = $getNodeByKey(nodeKey);
        return $isLinkNode(node) ? node : null;
    }
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    return $findMatchingParent(selection.anchor.getNode(), $isLinkNode) as LinkNode | null;
}

function applyLink(
    editor: ReturnType<typeof useLexicalComposerContext>[0],
    state: LinkDialogState,
    value: LexicalLinkValue
) {
    const url = value.url;
    const effectiveText = value.text || url;

    if (state.targetKey) {
        const key = state.targetKey;
        editor.update(() => {
            const link = $getNodeByKey(key);
            if (!$isLinkNode(link)) return;
            link.setURL(url);
            if (effectiveText !== link.getTextContent()) {
                // Append the new text before removing the old children: an element left momentarily
                // empty is garbage-collected along with its parent, which would drop the link.
                const previous = link.getChildren();
                link.append($createTextNode(effectiveText));
                previous.forEach(child => child.remove());
            }
        });
        return;
    }

    // Non-collapsed selection with unchanged text: toggle the link to preserve inline formatting.
    if (state.canToggle && effectiveText === state.selectedText) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        return;
    }

    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const link = $createLinkNode(url);
        link.append($createTextNode(effectiveText));
        selection.insertNodes([link]);
    });
}
