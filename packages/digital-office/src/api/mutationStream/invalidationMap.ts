import type { Query } from '@tanstack/react-query';
import { type MutationSignal, parseEntityName } from '@digital-net-org/digital-api-sdk';

export interface InvalidationFilter {
    queryKey?: readonly unknown[];
    predicate?: (_query: Query) => boolean;
}

/** Additional invalidation rules: backend CLR entity type (exact match, e.g. `Ticket`) → query key prefixes. */
export type DnInvalidationRules = Readonly<Record<string, ReadonlyArray<readonly unknown[]>>>;

export function resolveInvalidations(
    signal: MutationSignal,
    currentUserId?: string,
    rules?: DnInvalidationRules
): InvalidationFilter[] {
    const custom: InvalidationFilter[] = (rules?.[signal.entity] ?? []).map(queryKey => ({ queryKey }));
    return [...custom, ...resolveRegistryInvalidations(signal, currentUserId)];
}

function resolveRegistryInvalidations(signal: MutationSignal, currentUserId?: string): InvalidationFilter[] {
    const entityName = parseEntityName(signal.entity);
    if (!entityName) return [];

    switch (entityName) {
        // Fields are embedded in the parent FormDto: the form caches are their only cache location.
        case 'formField':
            return [{ queryKey: ['form'] }];
        // The signal carries the submission id, not the parent form's: the paginated submissions
        // (stored under the form get key) are only reachable through a predicate.
        case 'formSubmission':
            return [
                { queryKey: ['formSubmission'] },
                { predicate: query => query.queryKey[0] === 'form' && query.queryKey.includes('submissions') },
            ];
        // Restricted entity: received only when the stream credential belongs to an admin.
        case 'user': {
            const filters: InvalidationFilter[] = [{ queryKey: ['user'] }];
            if (currentUserId && signal.entityId === currentUserId) {
                filters.push({ queryKey: ['dn-user'] });
            }
            return filters;
        }
        // Convention: consumer apps' config queries start with 'config-value'.
        case 'configValue':
            return [{ queryKey: ['configValue'] }, { queryKey: ['config-value'] }];

        default:
            return [{ queryKey: [entityName] }];
    }
}
