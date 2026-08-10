import type { TemplateVariable } from '@digital-net-org/digital-api-sdk';
import { describe, expect, it } from 'vitest';
import { buildTemplateContext } from './buildTemplateContext';
import { validateInterpolatedString } from './validateInterpolatedString';

const variables: TemplateVariable[] = [
    { token: '{{ article.title }}', source: 'Article', field: 'Title' },
    { token: '{{ article.metatitle }}', source: 'Article', field: 'MetaTitle' },
];

describe('validateInterpolatedString', () => {
    it('accepts a single known variable', () => {
        expect(validateInterpolatedString('{{ article.title }}', variables)).toEqual([]);
    });

    it('accepts a fallback chain whose terms are all known', () => {
        expect(validateInterpolatedString('{{ article.metatitle ?? article.title }}', variables)).toEqual([]);
    });

    it('flags the unknown term of an otherwise valid chain', () => {
        const [invalid] = validateInterpolatedString('{{ article.metatitle ?? article.nope }}', variables);
        expect(invalid.message).toContain('article.nope');
    });

    it('lists every unknown term when several are wrong', () => {
        const [invalid] = validateInterpolatedString('{{ article.nope ?? article.nada }}', variables);
        expect(invalid.message).toContain('article.nope');
        expect(invalid.message).toContain('article.nada');
    });

    it('reports a malformed term as a format error', () => {
        const [invalid] = validateInterpolatedString('{{ article.title ?? }}', variables);
        expect(invalid.message).toContain('Format attendu');
    });
});

describe('buildTemplateContext', () => {
    it('returns the term being typed after the opening braces', () => {
        const value = '{{ art';
        expect(buildTemplateContext(value, value.length)).toEqual({ start: 0, query: 'art', insideChain: false });
    });

    it('returns only the current term inside a fallback chain', () => {
        const value = '{{ article.metatitle ?? art';
        const context = buildTemplateContext(value, value.length);
        expect(context?.query).toBe('art');
        expect(context?.insideChain).toBe(true);
        // Insertion starts right after the separator, so the earlier term survives untouched.
        expect(value.slice(0, context!.start)).toBe('{{ article.metatitle ??');
    });

    it('returns null once the token is closed', () => {
        const value = '{{ article.title }} ';
        expect(buildTemplateContext(value, value.length)).toBeNull();
    });
});
