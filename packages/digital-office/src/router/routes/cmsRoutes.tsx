import * as React from 'react';
import { dnLazyView } from '../dnLazyView';
import { DigitalOfficeNavGroup } from '../navGroups';
import type { DigitalOfficeRoute } from '../types';

const PageListView = dnLazyView(() => import('../../cms/Page/PageListView'), 'PageListView');
const PageEditView = dnLazyView(() => import('../../cms/Page/PageEditView'), 'PageEditView');
const ArticleListView = dnLazyView(() => import('../../cms/Article/ArticleListView'), 'ArticleListView');
const ArticleEditView = dnLazyView(() => import('../../cms/Article/ArticleEditView'), 'ArticleEditView');
const FormListView = dnLazyView(() => import('../../cms/Form/FormListView'), 'FormListView');
const FormEditView = dnLazyView(() => import('../../cms/Form/FormEditView'), 'FormEditView');
const FormSubmissionDetailView = dnLazyView(
    () => import('../../cms/Form/FormSubmissionDetailView'),
    'FormSubmissionDetailView'
);
const MediaListView = dnLazyView(() => import('../../cms/Media/MediaListView'), 'MediaListView');
const MediaEditView = dnLazyView(() => import('../../cms/Media/MediaEditView'), 'MediaEditView');
const TagListView = dnLazyView(() => import('../../cms/Tag/TagListView'), 'TagListView');
const TagEditView = dnLazyView(() => import('../../cms/Tag/TagEditView'), 'TagEditView');

export const CMS_ROUTES: DigitalOfficeRoute[] = [
    {
        path: '/content-manager/pages',
        navGroup: DigitalOfficeNavGroup.ContentManager,
        navLabel: 'Pages',
        navOrder: 10,
        element: <PageListView />,
    },
    {
        path: '/content-manager/pages/new',
        element: <PageEditView />,
    },
    {
        path: '/content-manager/pages/:id',
        element: <PageEditView />,
    },
    {
        path: '/content-manager/articles',
        navGroup: DigitalOfficeNavGroup.ContentManager,
        navLabel: 'Articles',
        navOrder: 20,
        element: <ArticleListView />,
    },
    {
        path: '/content-manager/articles/new',
        element: <ArticleEditView />,
    },
    {
        path: '/content-manager/articles/:id',
        element: <ArticleEditView />,
    },
    {
        path: '/content-manager/forms',
        navGroup: DigitalOfficeNavGroup.ContentManager,
        navLabel: 'Formulaires',
        navOrder: 30,
        element: <FormListView />,
    },
    {
        path: '/content-manager/forms/new',
        element: <FormEditView />,
    },
    {
        path: '/content-manager/forms/:id',
        element: <FormEditView />,
    },
    {
        path: '/content-manager/forms/:formId/submissions/:id',
        element: <FormSubmissionDetailView />,
    },
    {
        path: '/content-manager/media',
        navGroup: DigitalOfficeNavGroup.ContentManager,
        navLabel: 'Médias',
        navOrder: 40,
        element: <MediaListView />,
    },
    {
        path: '/content-manager/media/:id',
        element: <MediaEditView />,
    },
    {
        path: '/content-manager/tags',
        navGroup: DigitalOfficeNavGroup.ContentManager,
        navLabel: 'Tags',
        navOrder: 50,
        element: <TagListView />,
    },
    {
        path: '/content-manager/tags/new',
        element: <TagEditView />,
    },
    {
        path: '/content-manager/tags/:id',
        element: <TagEditView />,
    },
];
