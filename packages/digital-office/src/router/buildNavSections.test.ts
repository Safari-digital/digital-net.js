import { describe, expect, it } from 'vitest';
import { buildNavSections, mergeNavGroupDefs } from './buildNavSections';
import type { DigitalOfficeNavGroupDef } from './navGroups';
import type { DigitalOfficeRoute } from './types';

const GROUPS: DigitalOfficeNavGroupDef[] = [
    { id: 'cms', label: 'Gestionnaire de contenu', order: 10 },
    { id: 'admin', label: 'Administration', order: 20 },
];

function route(partial: Partial<DigitalOfficeRoute> & { path: string }): DigitalOfficeRoute {
    return { element: null, ...partial };
}

describe('mergeNavGroupDefs', () => {
    it('appends unknown ids and keeps base order', () => {
        const merged = mergeNavGroupDefs(GROUPS, [{ id: 'custom', label: 'Custom', order: 15 }]);
        expect(merged.map(g => g.id)).toEqual(['cms', 'admin', 'custom']);
    });

    it('overrides a base def in place when the id is reused', () => {
        const merged = mergeNavGroupDefs(GROUPS, [{ id: 'cms', label: 'Contenu', order: 30 }]);
        expect(merged).toEqual([
            { id: 'cms', label: 'Contenu', order: 30 },
            { id: 'admin', label: 'Administration', order: 20 },
        ]);
    });

    it('defaults to the base defs without overrides', () => {
        expect(mergeNavGroupDefs(GROUPS)).toEqual(GROUPS);
    });
});

describe('buildNavSections', () => {
    it('sorts groups by declared order, not by route concatenation order', () => {
        const sections = buildNavSections(
            [
                route({ path: '/admin/user', navGroup: 'admin', navLabel: 'Utilisateurs' }),
                route({ path: '/cms/pages', navGroup: 'cms', navLabel: 'Pages' }),
            ],
            GROUPS
        );
        expect(sections.map(s => s.id)).toEqual(['cms', 'admin']);
        expect(sections[0].label).toBe('Gestionnaire de contenu');
    });

    it('interleaves a client group between lib groups through its order', () => {
        const sections = buildNavSections(
            [
                route({ path: '/cms/pages', navGroup: 'cms', navLabel: 'Pages' }),
                route({ path: '/admin/user', navGroup: 'admin', navLabel: 'Utilisateurs' }),
                route({ path: '/reports', navGroup: 'reports', navLabel: 'Rapports' }),
            ],
            mergeNavGroupDefs(GROUPS, [{ id: 'reports', label: 'Rapports', order: 15 }])
        );
        expect(sections.map(s => s.id)).toEqual(['cms', 'reports', 'admin']);
    });

    it('interleaves a client route between lib entries through navOrder', () => {
        const [section] = buildNavSections(
            [
                route({ path: '/cms/pages', navGroup: 'cms', navLabel: 'Pages', navOrder: 10 }),
                route({ path: '/cms/articles', navGroup: 'cms', navLabel: 'Articles', navOrder: 20 }),
                route({ path: '/cms/custom', navGroup: 'cms', navLabel: 'Custom', navOrder: 15 }),
            ],
            GROUPS
        );
        expect(section.items.map(i => i.label)).toEqual(['Pages', 'Custom', 'Articles']);
    });

    it('keeps declaration order for unordered routes, after ordered ones', () => {
        const [section] = buildNavSections(
            [
                route({ path: '/cms/b', navGroup: 'cms', navLabel: 'B' }),
                route({ path: '/cms/a', navGroup: 'cms', navLabel: 'A' }),
                route({ path: '/cms/pages', navGroup: 'cms', navLabel: 'Pages', navOrder: 10 }),
            ],
            GROUPS
        );
        expect(section.items.map(i => i.label)).toEqual(['Pages', 'B', 'A']);
    });

    it('sorts undeclared groups by id, immune to the caller role filter', () => {
        const routes = [
            route({ path: '/x/a', navGroup: 'x', navLabel: 'A', isAdmin: true }),
            route({ path: '/y/b', navGroup: 'y', navLabel: 'B' }),
            route({ path: '/x/c', navGroup: 'x', navLabel: 'C' }),
        ];
        const admin = buildNavSections(routes, GROUPS);
        const nonAdmin = buildNavSections(
            routes.filter(r => !r.isAdmin),
            GROUPS
        );
        expect(admin.map(s => s.id)).toEqual(['x', 'y']);
        expect(nonAdmin.map(s => s.id)).toEqual(['x', 'y']);
    });

    it('renders undeclared groups last, labelled by their id', () => {
        const sections = buildNavSections(
            [
                route({ path: '/misc', navGroup: 'misc', navLabel: 'Divers' }),
                route({ path: '/cms/pages', navGroup: 'cms', navLabel: 'Pages' }),
            ],
            GROUPS
        );
        expect(sections.map(s => s.id)).toEqual(['cms', 'misc']);
        expect(sections[1].label).toBe('misc');
    });

    it('drops declared groups without any visible route and routes without nav metadata', () => {
        const sections = buildNavSections(
            [
                route({ path: '/cms/pages', navGroup: 'cms', navLabel: 'Pages' }),
                route({ path: '/cms/pages/:id' }),
                route({ path: '/orphan', navGroup: 'cms' }),
            ],
            GROUPS
        );
        expect(sections).toEqual([
            { id: 'cms', label: 'Gestionnaire de contenu', items: [{ path: '/cms/pages', label: 'Pages' }] },
        ]);
    });
});
