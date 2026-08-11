import { describe, expect, it } from 'vitest';
import { OFFICE_ENTITIES, buildEntityRegistry, resolveDraftEntities } from './entities';

describe('buildEntityRegistry', () => {
    it('returns the office entities when the app declares none', () => {
        expect(buildEntityRegistry({})).toEqual(OFFICE_ENTITIES);
    });

    it('adds client entities to the office ones', () => {
        const registry = buildEntityRegistry({ Ticket: { path: 'client/tickets' } });
        expect(registry.Ticket).toEqual({ path: 'client/tickets' });
        expect(registry.Page).toEqual(OFFICE_ENTITIES.Page);
    });

    it('throws instead of letting a client entity shadow an office one', () => {
        expect(() => buildEntityRegistry({ Page: { path: 'client/pages' } })).toThrow(/"Page"/);
    });

    it('names every colliding key at once', () => {
        const build = () => buildEntityRegistry({ Page: { path: 'a' }, Media: { path: 'b' } });
        expect(build).toThrow(/"Page", "Media"/);
    });

    it('leaves the blog entities to the application', () => {
        const registry = buildEntityRegistry({ Article: { path: 'articles' }, Tag: { path: 'tags' } });
        expect(registry.Article).toEqual({ path: 'articles' });
        expect(registry.Tag).toEqual({ path: 'tags' });
    });
});

describe('resolveDraftEntities', () => {
    it('keeps the entities that persist drafts', () => {
        expect(resolveDraftEntities(OFFICE_ENTITIES).sort()).toEqual(['Form', 'Media', 'Page']);
    });

    it('excludes entities opting out', () => {
        const entities = { Ticket: { path: 'client/tickets' }, Log: { path: 'client/logs', disableDraftStore: true } };
        expect(resolveDraftEntities(entities)).toEqual(['Ticket']);
    });
});
