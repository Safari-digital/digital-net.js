import { describe, expect, it } from 'vitest';
import { DN_KEY_ENTITY_GET, DN_KEY_ENTITY_LIST, dnBuildKeyFromId, dnBuildListKey } from './builders';

describe('queryClient builders', () => {
    it('keeps catalog entity keys untouched when no path is given', () => {
        expect(dnBuildListKey('article')).toEqual(['article', DN_KEY_ENTITY_LIST]);
        expect(dnBuildKeyFromId('article', 'id-1')).toEqual(['article', DN_KEY_ENTITY_GET, 'id-1']);
    });

    it('separates a client entity from a lib entity sharing its name', () => {
        expect(dnBuildListKey('article', 'client/articles')).not.toEqual(dnBuildListKey('article'));
        expect(dnBuildKeyFromId('article', 'id-1', 'client/articles')).not.toEqual(dnBuildKeyFromId('article', 'id-1'));
        expect(dnBuildListKey('article', 'client/articles')).not.toEqual(dnBuildListKey('article', 'cms/articles'));
    });

    it('keeps the entity name first so mutation signals still invalidate by prefix', () => {
        expect(dnBuildListKey('article', 'client/articles')[0]).toBe('article');
        expect(dnBuildKeyFromId('article', 'id-1', 'client/articles')[0]).toBe('article');
    });

    it('appends the id last so composed keys stay readable', () => {
        expect(dnBuildKeyFromId('article', 'id-1', 'client/articles')).toEqual([
            'article',
            DN_KEY_ENTITY_GET,
            'client/articles',
            'id-1',
        ]);
    });
});
