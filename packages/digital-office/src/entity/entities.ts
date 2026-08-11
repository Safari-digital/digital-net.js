import type { DnEntityDictionary } from './types';

/**
 * Entities served by the Digital.Net API. Client applications extend this through the `entities`
 * prop of DigitalOfficeProvider; a client key colliding with one of these throws at mount.
 *
 * Entities with no edit view get `disableDraftStore`: the three remaining ones are the only
 * IndexedDB draft stores the office creates.
 *
 * Child collections edited inline (page sheets and openGraph, form fields) have no entry: their
 * schema is embedded in the parent schema (see useDnEntityChildSchema). FormField stays declared
 * because its mutation signals must invalidate the form caches (see invalidationMap).
 *
 * A blog is a client concern: Article and Tag left with the CMS that used to serve them, and an
 * application owning one declares them itself, on its own routes.
 */
export const OFFICE_ENTITIES = {
    User: { path: 'user', disableDraftStore: true },
    ConfigValue: { path: 'admin/config-value', disableDraftStore: true },
    Page: { path: 'cms/pages' },
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
