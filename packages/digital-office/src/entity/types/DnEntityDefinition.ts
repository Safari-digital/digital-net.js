export interface DnEntityDefinition {
    /** Base API path the entity is served from, e.g. `cms/pages`. */
    path: string;
    /** Opt out of IndexedDB draft persistence — no object store is created for the entity. */
    disableDraftStore?: boolean;
}

/** Keyed by entity name, which is also the backend entity type carried by mutation signals. */
export type DnEntityDictionary = Readonly<Record<string, DnEntityDefinition>>;
