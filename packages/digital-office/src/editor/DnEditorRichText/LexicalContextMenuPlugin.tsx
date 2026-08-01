import * as React from 'react';
import { $isLinkNode, type LinkNode } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent } from '@lexical/utils';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { $getNearestNodeFromDOMNode, $getNodeByKey, type LexicalEditor, type NodeKey } from 'lexical';
import { ContextMenu, type ContextMenuItem, useContextMenu } from '../../ui/components/ContextMenu';
import { $isImageNode } from './LexicalImageNode';
import { OPEN_IMAGE_DIALOG_COMMAND, OPEN_LINK_DIALOG_COMMAND } from './lexicalCommands';

interface LexicalContextMenuPluginProps {
    hasImageAction: boolean;
}

interface ContextTarget {
    kind: 'link' | 'image';
    key: NodeKey;
}

export function LexicalContextMenuPlugin({ hasImageAction }: LexicalContextMenuPluginProps) {
    const [editor] = useLexicalComposerContext();
    const { position, openAt, close } = useContextMenu();
    const [target, setTarget] = React.useState<ContextTarget | null>(null);

    React.useEffect(() => {
        const handler = (event: MouseEvent) => {
            let found: ContextTarget | null = null;
            editor.read(() => {
                if (!(event.target instanceof Node)) return;
                const node = $getNearestNodeFromDOMNode(event.target);
                if (!node) return;
                if ($isImageNode(node)) {
                    found = { kind: 'image', key: node.getKey() };
                    return;
                }
                const link = $findMatchingParent(node, $isLinkNode) as LinkNode | null;
                if (link) found = { kind: 'link', key: link.getKey() };
            });
            if (found) {
                setTarget(found);
                openAt(event);
            }
        };
        return editor.registerRootListener((rootElement, prevRootElement) => {
            prevRootElement?.removeEventListener('contextmenu', handler);
            rootElement?.addEventListener('contextmenu', handler);
        });
    }, [editor, openAt]);

    const items = React.useMemo<ContextMenuItem[]>(() => {
        if (!target) return [];
        const result: ContextMenuItem[] = [];
        if (target.kind === 'link' || hasImageAction) {
            const command = target.kind === 'link' ? OPEN_LINK_DIALOG_COMMAND : OPEN_IMAGE_DIALOG_COMMAND;
            result.push({
                label: 'Modifier',
                icon: <EditIcon fontSize="small" />,
                onClick: () => editor.dispatchCommand(command, { nodeKey: target.key }),
            });
        }
        result.push({
            label: 'Supprimer',
            icon: <DeleteIcon fontSize="small" />,
            onClick: () => removeTarget(editor, target),
        });
        return result;
    }, [editor, target, hasImageAction]);

    return <ContextMenu position={position} items={items} onClose={close} />;
}

function removeTarget(editor: LexicalEditor, target: ContextTarget) {
    editor.update(() => {
        const node = $getNodeByKey(target.key);
        if (!node) return;
        if (target.kind === 'image') {
            node.remove();
            return;
        }
        if ($isLinkNode(node)) {
            // Unwrap the link, keeping its text content in place.
            node.getChildren().forEach(child => node.insertBefore(child));
            node.remove();
        }
    });
}
