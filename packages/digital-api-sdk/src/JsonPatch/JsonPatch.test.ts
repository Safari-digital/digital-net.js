import { describe, expect, it } from 'vitest';
import { JsonPatch } from './JsonPatch';

describe('JsonPatch.diff', () => {
    it('emits replace ops only for changed keys', () => {
        const previous = { a: 1, b: 2, c: 3 };
        const next = { a: 1, b: 20, c: 3 };
        expect(JsonPatch.diff(previous, next)).toEqual([{ op: 'replace', path: '/b', value: 20 }]);
    });

    it('restricts the comparison to the provided keys', () => {
        const previous = { a: 1, b: 2 };
        const next = { a: 10, b: 20 };
        expect(JsonPatch.diff(previous, next, ['b'])).toEqual([{ op: 'replace', path: '/b', value: 20 }]);
    });

    it('normalises undefined values to null', () => {
        const previous: { a?: string } = { a: 'x' };
        const next: { a?: string } = { a: undefined };
        expect(JsonPatch.diff(previous, next, ['a'])).toEqual([{ op: 'replace', path: '/a', value: null }]);
    });

    it('returns an empty array when nothing changed', () => {
        const obj = { a: 1, b: 2 };
        expect(JsonPatch.diff(obj, { ...obj })).toEqual([]);
    });
});

describe('JsonPatch.fromValues', () => {
    it('emits replace ops for every defined entry', () => {
        expect(JsonPatch.fromValues({ a: 1, b: 'x' })).toEqual([
            { op: 'replace', path: '/a', value: 1 },
            { op: 'replace', path: '/b', value: 'x' },
        ]);
    });

    it('skips undefined entries', () => {
        expect(JsonPatch.fromValues({ a: 1, b: undefined })).toEqual([{ op: 'replace', path: '/a', value: 1 }]);
    });

    it('skips omitted keys', () => {
        expect(JsonPatch.fromValues({ a: 1, b: 2, c: 3 }, { omit: ['b'] })).toEqual([
            { op: 'replace', path: '/a', value: 1 },
            { op: 'replace', path: '/c', value: 3 },
        ]);
    });

    it('keeps falsy-but-defined values', () => {
        expect(JsonPatch.fromValues({ a: 0, b: '', c: false })).toEqual([
            { op: 'replace', path: '/a', value: 0 },
            { op: 'replace', path: '/b', value: '' },
            { op: 'replace', path: '/c', value: false },
        ]);
    });
});
