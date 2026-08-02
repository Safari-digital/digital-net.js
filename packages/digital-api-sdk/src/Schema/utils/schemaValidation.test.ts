import { describe, expect, it } from 'vitest';
import type { SchemaProperty } from '../SchemaProperty';
import { schemaRowValidation, schemaValidation } from './schemaValidation';

const prop = (overrides: Partial<SchemaProperty> & { name: string }): SchemaProperty => ({
    path: overrides.name,
    type: 'String',
    isReadOnly: false,
    isSecret: false,
    isRequired: false,
    isUnique: false,
    isTemplatable: false,
    maxLength: null,
    isIdentity: false,
    isForeignKey: false,
    regexValidation: null,
    enumValues: null,
    oneOfValues: null,
    children: null,
    ...overrides,
});

const childSchemas = [prop({ name: 'Name', isRequired: true }), prop({ name: 'Content', maxLength: 5 })];

describe('schemaValidation', () => {
    it('reports required root fields that are empty', () => {
        const schemas = [prop({ name: 'Title', isRequired: true }), prop({ name: 'Description' })];
        expect(schemaValidation({ title: '  ' }, schemas)).toEqual(new Set(['title']));
    });

    it('skips read-only, identity and non-required root fields', () => {
        const schemas = [
            prop({ name: 'Id', isRequired: true, isIdentity: true }),
            prop({ name: 'CreatedAt', isRequired: true, isReadOnly: true }),
            prop({ name: 'Description' }),
        ];
        expect(schemaValidation({}, schemas)).toEqual(new Set());
    });

    it('reports the parent accessor when a child row is invalid', () => {
        const schemas = [prop({ name: 'Sheets', type: 'Collection', children: childSchemas })];
        const values = { sheets: [{ name: 'ok' }, { name: '' }] };
        expect(schemaValidation(values, schemas)).toEqual(new Set(['sheets']));
    });

    it('applies row rules (maxLength) to child collections', () => {
        const schemas = [prop({ name: 'Sheets', type: 'Collection', children: childSchemas })];
        const values = { sheets: [{ name: 'ok', content: 'too long' }] };
        expect(schemaValidation(values, schemas)).toEqual(new Set(['sheets']));
    });

    it('accepts valid, empty or absent child collections', () => {
        const schemas = [prop({ name: 'Sheets', type: 'Collection', children: childSchemas })];
        expect(schemaValidation({ sheets: [{ name: 'ok', content: 'short' }] }, schemas)).toEqual(new Set());
        expect(schemaValidation({ sheets: [] }, schemas)).toEqual(new Set());
        expect(schemaValidation({}, schemas)).toEqual(new Set());
    });

    it('ignores collections without an embedded child schema', () => {
        const schemas = [prop({ name: 'Tags', type: 'Collection' })];
        expect(schemaValidation({ tags: [{ anything: true }] }, schemas)).toEqual(new Set());
    });
});

describe('schemaRowValidation', () => {
    it('validates required, regex and oneOf rules', () => {
        const schemas = [
            prop({ name: 'Name', isRequired: true }),
            prop({ name: 'Slug', regexValidation: '^[a-z]+$' }),
            prop({ name: 'Type', oneOfValues: ['css', 'js'] }),
        ];
        expect(schemaRowValidation({ slug: 'UPPER', type: 'html' }, schemas)).toEqual(
            new Set(['name', 'slug', 'type'])
        );
        expect(schemaRowValidation({ name: 'x', slug: 'lower', type: 'css' }, schemas)).toEqual(new Set());
    });

    it('skips secret, read-only and identity fields', () => {
        const schemas = [
            prop({ name: 'Hash', isRequired: true, isSecret: true }),
            prop({ name: 'Id', isRequired: true, isIdentity: true }),
            prop({ name: 'UpdatedAt', isRequired: true, isReadOnly: true }),
        ];
        expect(schemaRowValidation({}, schemas)).toEqual(new Set());
    });
});
