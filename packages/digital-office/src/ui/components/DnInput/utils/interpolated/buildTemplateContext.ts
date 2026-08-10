import { FALLBACK_SEPARATOR } from './validateInterpolatedString';

const TRIGGER = '{';

export interface TemplateContext {
    /** Where the term being typed starts — an insertion replaces from here to the caret. */
    start: number;
    query: string;
    /** True when the caret sits after a `??`, i.e. on a later term of a fallback chain. */
    insideChain: boolean;
}

export function buildTemplateContext(value: string, caret: number): TemplateContext | null {
    const before = value.slice(0, caret);
    let open = before.lastIndexOf(TRIGGER);
    if (open === -1) return null;
    const close = before.indexOf('}', open);
    if (close !== -1 && close < caret) return null;

    // Walk backwards across consecutive `{` so `open` lands on the very first opener.
    while (open > 0 && before[open - 1] === TRIGGER) open--;

    // Only the term being typed is completed: the earlier terms of a chain are left alone.
    const fallback = before.lastIndexOf(FALLBACK_SEPARATOR);
    const insideChain = fallback > open;
    const start = insideChain ? fallback + FALLBACK_SEPARATOR.length : open;
    const query = before.slice(start).replace(/^\{+/, '').trimStart();

    return { start, query, insideChain };
}
