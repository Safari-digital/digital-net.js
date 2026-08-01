import * as React from 'react';
import {
    $applyNodeReplacement,
    type DOMConversionMap,
    type DOMExportOutput,
    DecoratorNode,
    type EditorConfig,
    type LexicalNode,
    type NodeKey,
    type SerializedLexicalNode,
    type Spread,
} from 'lexical';
import { LexicalImageComponent } from './LexicalImageComponent';
import type { DnEditorRichTextImageAttrs } from './types';

export type SerializedImageNode = Spread<DnEditorRichTextImageAttrs, SerializedLexicalNode>;

// Inline decorator node: it survives the HTML round-trip via importDOM/exportDOM, and renders
// through an injected renderImage (authenticated preview) — the node itself stays business-agnostic.
export class ImageNode extends DecoratorNode<React.JSX.Element> {
    private __src: string;
    private __alt: string;

    public static getType(): string {
        return 'image';
    }

    public static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__alt, node.__key);
    }

    public static importJSON(serialized: SerializedImageNode): ImageNode {
        return $createImageNode({ src: serialized.src, alt: serialized.alt });
    }

    public static importDOM(): DOMConversionMap | null {
        return {
            img: () => ({
                conversion: element => {
                    const img = element as HTMLImageElement;
                    return {
                        node: $createImageNode({
                            src: img.getAttribute('src') ?? '',
                            alt: img.getAttribute('alt') ?? '',
                        }),
                    };
                },
                priority: 0,
            }),
        };
    }

    public constructor(src: string, alt: string, key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__alt = alt;
    }

    public exportJSON(): SerializedImageNode {
        return { ...super.exportJSON(), src: this.__src, alt: this.__alt };
    }

    public exportDOM(): DOMExportOutput {
        const element = document.createElement('img');
        element.setAttribute('src', this.__src);
        element.setAttribute('alt', this.__alt);
        return { element };
    }

    public createDOM(config: EditorConfig): HTMLElement {
        const span = document.createElement('span');
        const className = (config.theme as { image?: string }).image;
        if (className) span.className = className;
        return span;
    }

    public updateDOM(): false {
        return false;
    }

    public isInline(): boolean {
        return true;
    }

    public getSrc(): string {
        return this.getLatest().__src;
    }

    public getAlt(): string {
        return this.getLatest().__alt;
    }

    public setSrc(src: string): void {
        this.getWritable().__src = src;
    }

    public setAlt(alt: string): void {
        this.getWritable().__alt = alt;
    }

    public decorate(): React.JSX.Element {
        return <LexicalImageComponent src={this.__src} alt={this.__alt} nodeKey={this.getKey()} />;
    }
}

export function $createImageNode(attrs: DnEditorRichTextImageAttrs): ImageNode {
    return $applyNodeReplacement(new ImageNode(attrs.src, attrs.alt));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
