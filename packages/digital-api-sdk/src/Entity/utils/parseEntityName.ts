import { ENTITY_NAMES, type EntityName } from '../EntityName';

/** Resolves a backend CLR entity type (PascalCase, e.g. mutation signals' `entity`) to its EntityName. */
export function parseEntityName(value: string): EntityName | undefined {
    const lower = value.toLowerCase();
    return ENTITY_NAMES.find(name => name.toLowerCase() === lower);
}
