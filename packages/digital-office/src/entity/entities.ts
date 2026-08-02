import type { DnEntityDictionary } from './types';

/**
 * Entities served by the Digital.Net API. Client applications extend this through the `entities`
 * prop of DigitalOfficeProvider; a client key colliding with one of these throws at mount.
 *
 * Entities with no edit view get `disableDraftStore`: the five remaining ones are the only
 * IndexedDB draft stores the office creates.
 */
export const OFFICE_ENTITIES = {
    User: { path: 'user', disableDraftStore: true },
    ConfigValue: { path: 'admin/config-value', disableDraftStore: true },
    Page: { path: 'cms/pages' },
    // `cms/pages/sheet` serves the schema of Sheet, not of the PageSheet pivot.
    Sheet: { path: 'cms/pages/sheet', disableDraftStore: true },
    OpenGraphEntry: { path: 'cms/pages/open-graph-entry', disableDraftStore: true },
    Article: { path: 'cms/articles' },
    ArticleMedia: { path: 'cms/articles/media', disableDraftStore: true },
    Tag: { path: 'cms/tags' },
    Media: { path: 'cms/media' },
    Form: { path: 'cms/forms' },
    FormField: { path: 'cms/forms/fields', disableDraftStore: true },
    FormSubmission: { path: 'cms/forms/submissions', disableDraftStore: true },
} as const satisfies DnEntityDictionary;

export function buildEntityRegistry(custom: DnEntityDictionary): DnEntityDictionary {
    const collisions = Object.keys(custom).filter(name => name in OFFICE_ENTITIES);
    if (collisions.length > 0) {
        throw new Error(
            `EntityProvider: "${collisions.join('", "')}" already declared by the office. Rename the entity, or drop the declaration to use the built-in one.`
        );
    }
    return { ...OFFICE_ENTITIES, ...custom };
}

/** Entities persisting drafts — one IndexedDB object store each. */
export function resolveDraftEntities(entities: DnEntityDictionary): string[] {
    return Object.keys(entities).filter(name => !entities[name].disableDraftStore);
}
