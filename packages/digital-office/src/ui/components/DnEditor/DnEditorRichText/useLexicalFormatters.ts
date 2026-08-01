import * as React from 'react';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import {
    $getSelection,
    $isRangeSelection,
    FORMAT_ELEMENT_COMMAND,
    FORMAT_TEXT_COMMAND,
    type LexicalEditor,
} from 'lexical';

export function useLexicalFormatters(editor: LexicalEditor) {
    const formatHeading = React.useCallback(
        (tag: HeadingTagType) => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode(tag));
                }
            });
        },
        [editor]
    );

    const formatQuote = React.useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
            }
        });
    }, [editor]);

    const toBold = React.useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'), [editor]);
    const toItalic = React.useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'), [editor]);
    const toUnderline = React.useCallback(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'), [editor]);
    const toStrikethrough = React.useCallback(
        () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
        [editor]
    );
    const toUnorderedList = React.useCallback(
        () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
        [editor]
    );
    const toOrderedList = React.useCallback(
        () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
        [editor]
    );
    const toAlignLeft = React.useCallback(() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'), [editor]);
    const toAlignCenter = React.useCallback(() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'), [editor]);
    const toAlignRight = React.useCallback(() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'), [editor]);
    const toAlignJustify = React.useCallback(() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'), [editor]);

    return {
        formatHeading,
        formatQuote,
        toBold,
        toItalic,
        toUnderline,
        toStrikethrough,
        toUnorderedList,
        toOrderedList,
        toAlignLeft,
        toAlignCenter,
        toAlignRight,
        toAlignJustify,
    };
}
