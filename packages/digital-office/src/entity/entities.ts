import type { DnEntityDictionary } from './types';

export const OFFICE_ENTITIES = {
    User: { path: 'user', disableDraftStore: true },
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

export function resolveDraftEntities(entities: DnEntityDictionary): string[] {
    // Entities persisting drafts: one IDB store each.
    return Object.keys(entities).filter(name => !entities[name].disableDraftStore);
}
