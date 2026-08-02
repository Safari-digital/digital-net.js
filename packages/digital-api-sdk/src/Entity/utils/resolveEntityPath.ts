import type { EntityName } from '../EntityName';

const ENTITY_API_PATHS: Record<EntityName, string> = {
    user: 'user',
    page: 'cms/pages',
    pageSheet: 'cms/pages/sheet',
    openGraphEntry: 'cms/pages/open-graph-entry',
    tag: 'cms/tags',
    media: 'cms/media',
    article: 'cms/articles',
    articleMedia: 'cms/articles/media',
    form: 'cms/forms',
    formField: 'cms/forms/fields',
    formSubmission: 'cms/forms/submissions',
    configValue: 'admin/config-value',
};

export function resolveEntityPath(entity: EntityName): string | undefined {
    return ENTITY_API_PATHS[entity];
}
