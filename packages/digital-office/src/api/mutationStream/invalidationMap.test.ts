import type { Query } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { MutationSignal } from '@digital-net-org/digital-api-sdk';
import { resolveInvalidations } from './invalidationMap';

function signal(entity: string, entityId = 'id-1'): MutationSignal {
    return { type: 'Updated', entity, entityId };
}

function fakeQuery(queryKey: readonly unknown[]): Query {
    return { queryKey } as unknown as Query;
}

describe('resolveInvalidations', () => {
    it.each([
        ['Article', 'article'],
        ['Page', 'page'],
        ['Media', 'media'],
        ['Tag', 'tag'],
        ['Form', 'form'],
    ])('maps %s to its single entity prefix', (entity, entityName) => {
        expect(resolveInvalidations(signal(entity, 'abc'))).toEqual([{ queryKey: [entityName] }]);
    });

    it('maps FormField to the form prefix (fields are embedded in the FormDto)', () => {
        expect(resolveInvalidations(signal('FormField'))).toEqual([{ queryKey: ['form'] }]);
    });

    it('maps FormSubmission to its prefix and the submissions tabs of any form', () => {
        const filters = resolveInvalidations(signal('FormSubmission', 'sub-1'));

        expect(filters[0]).toEqual({ queryKey: ['formSubmission'] });
        const predicate = filters[1].predicate!;
        expect(predicate(fakeQuery(['form', 'dn-entity-get', 'f1', 'submissions', 1, 25]))).toBe(true);
        expect(predicate(fakeQuery(['form', 'dn-entity-get', 'f1']))).toBe(false);
        expect(predicate(fakeQuery(['form', 'dn-entity-list']))).toBe(false);
        expect(predicate(fakeQuery(['formSubmission', 'dn-entity-get', 'sub-1']))).toBe(false);
    });

    it('maps User to the user prefix only when the mutation targets someone else', () => {
        expect(resolveInvalidations(signal('User', 'u1'), 'someone-else')).toEqual([{ queryKey: ['user'] }]);
    });

    it('also invalidates the self user when the mutation targets the current user', () => {
        expect(resolveInvalidations(signal('User', 'u1'), 'u1')).toEqual([
            { queryKey: ['user'] },
            { queryKey: ['dn-user'] },
        ]);
    });

    it('maps ConfigValue to its prefix and the legacy config-value convention', () => {
        expect(resolveInvalidations(signal('ConfigValue'))).toEqual([
            { queryKey: ['configValue'] },
            { queryKey: ['config-value'] },
        ]);
    });

    it('ignores backend types without an SDK entity (Document, ApiKey, unknown)', () => {
        expect(resolveInvalidations(signal('Document'))).toEqual([]);
        expect(resolveInvalidations(signal('ApiKey'))).toEqual([]);
        expect(resolveInvalidations(signal('SomethingNew'))).toEqual([]);
    });

    it('matches entity names case-insensitively', () => {
        expect(resolveInvalidations(signal('page', 'p1'))).toEqual([{ queryKey: ['page'] }]);
        expect(resolveInvalidations(signal('FORMFIELD'))).toEqual([{ queryKey: ['form'] }]);
    });
});
