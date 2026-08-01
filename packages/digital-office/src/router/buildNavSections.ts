import type { DigitalOfficeNavGroupDef } from './navGroups';
import type { DigitalOfficeRoute } from './types';

export interface NavSection {
    id: string;
    label: string;
    items: Array<{ path: string; label: string }>;
}

// Infinity breaks Array.sort comparators (Infinity - Infinity = NaN).
const UNORDERED = Number.MAX_SAFE_INTEGER;

/** Merges group declarations by id; an override reusing an id replaces its label/order in place. */
export function mergeNavGroupDefs(
    base: DigitalOfficeNavGroupDef[],
    overrides: DigitalOfficeNavGroupDef[] = []
): DigitalOfficeNavGroupDef[] {
    const merged = new Map(base.map(def => [def.id, def]));
    for (const def of overrides) merged.set(def.id, def);
    return [...merged.values()];
}

/**
 * Groups sort by declared `order`, routes by `navOrder` within their group; ties keep
 * declaration order. Groups referenced by a route but never declared render last,
 * labelled and sorted by their id — insertion order would vary with the caller's
 * role filter. Declared groups without any visible route are dropped.
 */
export function buildNavSections(routes: DigitalOfficeRoute[], defs: DigitalOfficeNavGroupDef[]): NavSection[] {
    const byGroup = new Map<string, Array<{ path: string; label: string; order: number }>>();
    for (const route of routes) {
        if (!route.navGroup || !route.navLabel) continue;
        const items = byGroup.get(route.navGroup) ?? [];
        items.push({ path: route.path, label: route.navLabel, order: route.navOrder ?? UNORDERED });
        byGroup.set(route.navGroup, items);
    }

    const declared = new Set(defs.map(def => def.id));
    const synthesized = [...byGroup.keys()]
        .filter(id => !declared.has(id))
        .sort((a, b) => a.localeCompare(b))
        .map(id => ({ id, label: id, order: UNORDERED }));

    return [...defs, ...synthesized]
        .filter(def => byGroup.has(def.id))
        .sort((a, b) => a.order - b.order)
        .map(def => ({
            id: def.id,
            label: def.label,
            items: byGroup
                .get(def.id)!
                .sort((a, b) => a.order - b.order)
                .map(({ path, label }) => ({ path, label })),
        }));
}
