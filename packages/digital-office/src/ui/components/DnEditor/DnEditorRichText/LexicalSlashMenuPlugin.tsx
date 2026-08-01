import * as React from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
    LexicalTypeaheadMenuPlugin,
    MenuOption,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { Image as ImageIcon, InsertLink as LinkIcon } from '@mui/icons-material';
import { ListItemIcon, ListItemText, MenuItem, MenuList, Paper, css, styled } from '@mui/material';
import type { TextNode } from 'lexical';
import { OPEN_IMAGE_DIALOG_COMMAND, OPEN_LINK_DIALOG_COMMAND } from './lexicalCommands';

interface LexicalSlashMenuPluginProps {
    hasImageAction: boolean;
}

class SlashMenuOption extends MenuOption {
    public readonly label: string;
    public readonly menuIcon: React.JSX.Element;
    public readonly keywords: string[];
    public readonly run: () => void;

    public constructor(
        key: string,
        config: { label: string; icon: React.JSX.Element; keywords: string[]; run: () => void }
    ) {
        super(key);
        this.label = config.label;
        this.menuIcon = config.icon;
        this.keywords = config.keywords;
        this.run = config.run;
    }
}

export function LexicalSlashMenuPlugin({ hasImageAction }: LexicalSlashMenuPluginProps) {
    const [editor] = useLexicalComposerContext();
    const [query, setQuery] = React.useState<string | null>(null);
    const triggerFn = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });

    const options = React.useMemo(() => {
        const all = [
            new SlashMenuOption('link', {
                label: 'Lien',
                icon: <LinkIcon fontSize="small" />,
                keywords: ['lien', 'link', 'url', 'a'],
                run: () => editor.dispatchCommand(OPEN_LINK_DIALOG_COMMAND, undefined),
            }),
        ];
        if (hasImageAction) {
            all.push(
                new SlashMenuOption('image', {
                    label: 'Image',
                    icon: <ImageIcon fontSize="small" />,
                    keywords: ['image', 'img', 'media', 'média', 'photo'],
                    run: () => editor.dispatchCommand(OPEN_IMAGE_DIALOG_COMMAND, undefined),
                })
            );
        }
        const q = (query ?? '').toLowerCase();
        if (!q) return all;
        return all.filter(o => o.label.toLowerCase().includes(q) || o.keywords.some(k => k.includes(q)));
    }, [editor, hasImageAction, query]);

    const onSelectOption = React.useCallback(
        (option: SlashMenuOption, textNodeContainingQuery: TextNode | null, closeMenu: () => void) => {
            editor.update(() => textNodeContainingQuery?.remove());
            closeMenu();
            option.run();
        },
        [editor]
    );

    return (
        <LexicalTypeaheadMenuPlugin<SlashMenuOption>
            options={options}
            triggerFn={triggerFn}
            onQueryChange={setQuery}
            onSelectOption={onSelectOption}
            menuRenderFn={(
                anchorRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex, options: opts }
            ) => {
                const anchor = anchorRef.current;
                if (!anchor || opts.length === 0) return null;
                return createPortal(
                    <Dropdown>
                        <MenuList dense>
                            {opts.map((option, index) => (
                                <MenuItem
                                    key={option.key}
                                    selected={index === selectedIndex}
                                    onMouseDown={event => event.preventDefault()}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                    onClick={() => selectOptionAndCleanUp(option)}
                                >
                                    <ListItemIcon>{option.menuIcon}</ListItemIcon>
                                    <ListItemText>{option.label}</ListItemText>
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Dropdown>,
                    anchor
                );
            }}
        />
    );
}

const Dropdown = styled(Paper)(
    ({ theme }) => css`
        min-width: 12rem;
        margin-top: ${theme.spacing(0.5)};
        z-index: ${theme.zIndex.modal};
        box-shadow: ${theme.shadows[4]};
    `
);
