import * as React from 'react';
import type { DnEditorRichTextImageAttrs } from './types';

export interface LexicalImageContextValue {
    renderImage?: (_attrs: DnEditorRichTextImageAttrs) => React.ReactNode;
}

export const LexicalImageContext = React.createContext<LexicalImageContextValue>({});
