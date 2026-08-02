export const ENTITY_NAMES = [
    'page',
    'user',
    'pageSheet',
    'openGraphEntry',
    'tag',
    'media',
    'article',
    'articleMedia',
    'form',
    'formField',
    'formSubmission',
    'configValue',
] as const;

export type EntityName = (typeof ENTITY_NAMES)[number];
