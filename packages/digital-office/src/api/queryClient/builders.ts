export const DN_KEY_ENTITY_LIST = 'dn-entity-list';
export const DN_KEY_ENTITY_GET = 'dn-entity-get';

/** Build a QueryClient memory cache key for a given entity **/
export function dnBuildKeyFromId(entityName: string, id: string) {
    return [entityName, DN_KEY_ENTITY_GET, id];
}

/** Build a QueryClient memory cache key for an entity list **/
export function dnBuildListKey(entityName: string) {
    return [entityName, DN_KEY_ENTITY_LIST];
}
