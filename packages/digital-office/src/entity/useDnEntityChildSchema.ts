import { type UseDnEntitySchemaResult, useDnEntitySchema } from './useDnEntitySchema';

/**
 * Resolves the schema of a child collection embedded in a parent entity schema (cascade pivots,
 * `[ChildSchema]` navigations). Throws once the parent schema is loaded if the accessor does not
 * carry an embedded child schema.
 */
export function useDnEntityChildSchema(entityName: string, accessor: string): UseDnEntitySchemaResult {
    const { schemas, loading } = useDnEntitySchema(entityName);
    const entry = schemas.find(s => `${s.name.charAt(0).toLowerCase()}${s.name.slice(1)}` === accessor);
    if (!loading && schemas.length > 0 && !entry?.children) {
        throw new Error(`Entity "${entityName}" does not embed a child schema under "${accessor}".`);
    }
    return { schemas: entry?.children ?? [], loading };
}
