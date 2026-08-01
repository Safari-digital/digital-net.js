import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, type HeadingTagType, QuoteNode } from '@lexical/rich-text';
import { type HTMLConfig, type Klass, type LexicalNode, TextNode, isHTMLElement } from 'lexical';
import { ImageNode } from './LexicalImageNode';
import { stripWhiteSpaceStyle } from './lexicalWhiteSpace';

export const LEXICAL_NODES: Array<Klass<LexicalNode>> = [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    ImageNode,
];

export const LEXICAL_HTML_CONFIG: HTMLConfig = {
    export: new Map([
        [
            TextNode,
            (editor, node) => {
                const output = node.exportDOM(editor);
                if (isHTMLElement(output.element)) stripWhiteSpaceStyle(output.element);
                return output;
            },
        ],
    ]),
};

export const LEXICAL_HEADING_LEVELS: HeadingTagType[] = ['h1', 'h2', 'h3', 'h4'];
export const LEXICAL_THEME = {
    paragraph: 'paragraph',
    heading: { h1: 'title-1', h2: 'title-2', h3: 'title-3', h4: 'title-4' },
    list: { ul: 'list', ol: 'list-numbered', listitem: 'list-item' },
    quote: '',
    text: {
        bold: 'bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'strikethrough',
    },
    link: 'link',
    image: 'image',
};
