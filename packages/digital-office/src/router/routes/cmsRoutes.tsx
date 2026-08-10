import * as React from 'react';
import { dnLazyView } from '../dnLazyView';
import { DigitalOfficeNavGroup } from '../navGroups';
import type { DigitalOfficeRoute } from '../types';

const PageListView = dnLazyView(() => import('../../cms/Page/PageListView'), 'PageListView');
const PageEditView = dnLazyView(() => import('../../cms/Page/PageEditView'), 'PageEditView');
const FormListView = dnLazyView(() => import('../../cms/Form/FormListView'), 'FormListView');
const FormEditView = dnLazyView(() => import('../../cms/Form/FormEditView'), 'FormEditView');
const FormSubmissionDetailView = dnLazyView(
    () => import('../../cms/Form/FormSubmissionDetailView'),
    'FormSubmissionDetailView'
);
const MediaListView = dnLazyView(() => import('../../cms/Media/MediaListView'), 'MediaListView');
const MediaEditView = dnLazyView(() => import('../../cms/Media/MediaEditView'), 'MediaEditView');

/**
 * The framework's own content screens. Articles and tags are gone from here: they belong to whichever
 * application declares them, which mounts its own screens through the routes prop.
 */
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
];
