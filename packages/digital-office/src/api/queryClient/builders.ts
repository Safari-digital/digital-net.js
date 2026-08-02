export const DN_KEY_ENTITY_LIST = 'dn-entity-list';
export const DN_KEY_ENTITY_GET = 'dn-entity-get';

// apiPath keeps a client entity from sharing its cache with a lib entity of the same name; it is
// only appended when given, so the keys of catalog entities stay untouched.

/** Build a QueryClient memory cache key for a given entity **/
export function dnBuildKeyFromId(entityName: string, id: string, apiPath?: string) {
    return [entityName, DN_KEY_ENTITY_GET, ...(apiPath ? [apiPath] : []), id];
}

/** Build a QueryClient memory cache key for an entity list **/
export function dnBuildListKey(entityName: string, apiPath?: string) {
    return [entityName, DN_KEY_ENTITY_LIST, ...(apiPath ? [apiPath] : [])];
}
