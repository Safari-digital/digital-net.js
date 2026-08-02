import { describe, expect, it } from 'vitest';
import { DN_KEY_ENTITY_GET, DN_KEY_ENTITY_LIST, dnBuildKeyFromId, dnBuildListKey } from './builders';

describe('queryClient builders', () => {
    it('builds a list key from the entity name', () => {
        expect(dnBuildListKey('Article')).toEqual(['Article', DN_KEY_ENTITY_LIST]);
    });

    it('appends the id last so composed keys stay readable', () => {
        expect(dnBuildKeyFromId('Article', 'id-1')).toEqual(['Article', DN_KEY_ENTITY_GET, 'id-1']);
    });

    it('keeps the entity name first so mutation signals still invalidate by prefix', () => {
        expect(dnBuildListKey('Article')[0]).toBe('Article');
        expect(dnBuildKeyFromId('Article', 'id-1')[0]).toBe('Article');
    });

    it('separates two entities', () => {
        expect(dnBuildListKey('Article')).not.toEqual(dnBuildListKey('Page'));
    });
});
