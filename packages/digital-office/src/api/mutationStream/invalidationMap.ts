import type { MutationSignal } from '@digital-net-org/digital-api-sdk';
import type { Query } from '@tanstack/react-query';
import type { DnEntityDictionary } from '../../entity/types';

export interface InvalidationFilter {
    queryKey?: readonly unknown[];
    predicate?: (_query: Query) => boolean;
}

/** Additional invalidation rules: backend CLR entity type (exact match, e.g. `Ticket`) → query key prefixes. */
export type DnInvalidationRules = Readonly<Record<string, ReadonlyArray<readonly unknown[]>>>;

export function resolveInvalidations(
    signal: MutationSignal,
    entities: DnEntityDictionary,
    currentUserId?: string,
    rules?: DnInvalidationRules
): InvalidationFilter[] {
    const custom: InvalidationFilter[] = (rules?.[signal.entity] ?? []).map(queryKey => ({ queryKey }));
    return [...custom, ...resolveRegistryInvalidations(signal, entities, currentUserId)];
}

function resolveRegistryInvalidations(
    signal: MutationSignal,
    entities: DnEntityDictionary,
    currentUserId?: string
): InvalidationFilter[] {
    // Entity names are the backend entity types, so the signal indexes the registry directly.
    // Anything tracked backend-side without an office entity (ApiKey, Document) is ignored.
    const entityName = signal.entity;
    if (!(entityName in entities)) return [];

    switch (entityName) {
        // Fields are embedded in the parent FormDto: the form caches are their only cache location.
        case 'FormField':
            return [{ queryKey: ['Form'] }];
        // The signal carries the submission id, not the parent form's: the paginated submissions
        // (stored under the form get key) are only reachable through a predicate.
        case 'FormSubmission':
            return [
                { queryKey: ['FormSubmission'] },
                { predicate: query => query.queryKey[0] === 'Form' && query.queryKey.includes('submissions') },
            ];
        // Restricted entity: received only when the stream credential belongs to an admin.
        case 'User': {
            const filters: InvalidationFilter[] = [{ queryKey: ['User'] }];
            if (currentUserId && signal.entityId === currentUserId) {
                filters.push({ queryKey: ['dn-user'] });
            }
            return filters;
        }
        default:
            return [{ queryKey: [entityName] }];
    }
}
