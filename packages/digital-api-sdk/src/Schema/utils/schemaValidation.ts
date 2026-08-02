import type { SchemaProperty } from '../SchemaProperty';

const toAccessor = (name: string): string => `${name.charAt(0).toLowerCase()}${name.slice(1)}`;

const isEmptyValue = (value: unknown): boolean =>
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '');

/**
 * Validate a single row against an entity schema: required, maxLength, regex and oneOf rules.
 * Secret, read-only and identity fields are skipped — they are never part of a client payload.
 **/
export function schemaRowValidation(row: unknown, schemas: SchemaProperty[]): Set<string> {
    const errors = new Set<string>();
    const record = (row ?? {}) as Record<string, unknown>;
    for (const s of schemas) {
        if (s.isReadOnly || s.isIdentity || s.isSecret) continue;
        const accessor = toAccessor(s.name);
        const value = record[accessor];
        if (s.isRequired && isEmptyValue(value)) {
            errors.add(accessor);
            continue;
        }
        if (typeof value !== 'string' || value.trim() === '') continue;
        if (s.maxLength != null && value.length > s.maxLength) errors.add(accessor);
        else if (s.regexValidation != null && !new RegExp(s.regexValidation).test(value)) errors.add(accessor);
        else if (s.oneOfValues != null && !s.oneOfValues.includes(value)) errors.add(accessor);
    }
    return errors;
}

/**
 * Validate a payload from an entity schema. Properties embedding a child schema (`children`)
 * are validated row by row; an invalid child collection reports the parent accessor.
 **/
export function schemaValidation<T>(values: Partial<T>, schemas: SchemaProperty[]): Set<string> {
    const missing = new Set<string>();
    const record = values as Record<string, unknown>;
    for (const s of schemas) {
        const accessor = toAccessor(s.name);
        if (s.children?.length) {
            const children = s.children;
            const rows = record[accessor];
            if (Array.isArray(rows) && rows.some(row => schemaRowValidation(row, children).size > 0))
                missing.add(accessor);
            continue;
        }
        if (!s.isRequired || s.isReadOnly || s.isIdentity) continue;
        if (isEmptyValue(record[accessor])) missing.add(accessor);
    }
    return missing;
}
