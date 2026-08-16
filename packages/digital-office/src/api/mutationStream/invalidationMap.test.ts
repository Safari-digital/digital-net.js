import type { MutationSignal } from '@digital-net-org/digital-api-sdk';
import type { Query } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { OFFICE_ENTITIES } from '../../entity/entities';
import { type DnInvalidationRules, resolveInvalidations } from './invalidationMap';

function signal(entity: string, entityId = 'id-1'): MutationSignal {
    return { type: 'Updated', entity, entityId };
}

function fakeQuery(queryKey: readonly unknown[]): Query {
    return { queryKey } as unknown as Query;
}

function resolve(s: MutationSignal, currentUserId?: string, rules?: DnInvalidationRules) {
    return resolveInvalidations(s, OFFICE_ENTITIES, currentUserId, rules);
}

describe('resolveInvalidations', () => {
    it.each([['Page'], ['Media'], ['Form']])('maps %s to its single entity prefix', entityName => {
        expect(resolve(signal(entityName, 'abc'))).toEqual([{ queryKey: [entityName] }]);
    });

    it('maps FormField to the form prefix (fields are embedded in the FormDto)', () => {
        expect(resolve(signal('FormField'))).toEqual([{ queryKey: ['Form'] }]);
    });

    it('maps FormSubmission to its prefix and the submissions tabs of any form', () => {
        const filters = resolve(signal('FormSubmission', 'sub-1'));

        expect(filters[0]).toEqual({ queryKey: ['FormSubmission'] });
        const predicate = filters[1].predicate!;
        expect(predicate(fakeQuery(['Form', 'dn-entity-get', 'f1', 'submissions', 1, 25]))).toBe(true);
        expect(predicate(fakeQuery(['Form', 'dn-entity-get', 'f1']))).toBe(false);
        expect(predicate(fakeQuery(['Form', 'dn-entity-list']))).toBe(false);
        expect(predicate(fakeQuery(['FormSubmission', 'dn-entity-get', 'sub-1']))).toBe(false);
    });

    it('maps User to the user prefix only when the mutation targets someone else', () => {
        expect(resolve(signal('User', 'u1'), 'someone-else')).toEqual([{ queryKey: ['User'] }]);
    });

    it('also invalidates the self user when the mutation targets the current user', () => {
        expect(resolve(signal('User', 'u1'), 'u1')).toEqual([{ queryKey: ['User'] }, { queryKey: ['dn-user'] }]);
    });

    it('ignores backend types with no office entity (Document, ApiKey, unknown)', () => {
        expect(resolve(signal('Document'))).toEqual([]);
        expect(resolve(signal('ApiKey'))).toEqual([]);
        expect(resolve(signal('SomethingNew'))).toEqual([]);
    });

    it('matches the CLR casing only, since entity names now are the CLR names', () => {
        expect(resolve(signal('page', 'p1'))).toEqual([]);
        expect(resolve(signal('FORMFIELD'))).toEqual([]);
    });

    it('invalidates a client entity declared in the registry', () => {
        const entities = { ...OFFICE_ENTITIES, Ticket: { path: 'client/tickets' } };
        expect(resolveInvalidations(signal('Ticket'), entities)).toEqual([{ queryKey: ['Ticket'] }]);
    });

    it('maps a CLR entity absent from the registry through its injected rule', () => {
        expect(resolve(signal('Ticket'), undefined, { Ticket: [['ticket']] })).toEqual([{ queryKey: ['ticket'] }]);
    });

    it('prepends injected rules to the registry resolution of a known entity', () => {
        expect(resolve(signal('Page'), undefined, { Page: [['landing'], ['sitemap']] })).toEqual([
            { queryKey: ['landing'] },
            { queryKey: ['sitemap'] },
            { queryKey: ['Page'] },
        ]);
    });

    it('matches rule keys on the exact CLR casing only', () => {
        expect(resolve(signal('ticket'), undefined, { Ticket: [['ticket']] })).toEqual([]);
    });

    it('still ignores unknown entities without a rule', () => {
        expect(resolve(signal('Ticket'), undefined, {})).toEqual([]);
    });
});
