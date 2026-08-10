import { PathAnalyzer } from '@digital-net-org/digital-core';

/**
 * True when a page path carries a dynamic segment (`/blog/:slug`), which is what makes it a template
 * other pages inherit from — and therefore the only kind of page an interpolated entity can hang off.
 *
 * Exposed here so a consuming application never has to reach into digital-core for a rule the
 * back-office already enforces on its own screens.
 */
export function dnHasDynamicSlug(path: string | null | undefined): boolean {
    return PathAnalyzer.hasDynamicSlug(path ?? '');
}
