import { type SchemaProperty, schemaRowValidation } from '@digital-net-org/digital-api-sdk';

export function computeRowErrors<TRow extends { id: string }>(
    rows: TRow[],
    schemas: SchemaProperty[]
): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    if (schemas.length === 0) return map;
    for (const row of rows) {
        const errors = schemaRowValidation(row, schemas);
        if (errors.size > 0) map.set(row.id, errors);
    }
    return map;
}
