import * as React from 'react';
import { dnLazyView } from '../dnLazyView';
import { DigitalOfficeNavGroup } from '../navGroups';
import type { DigitalOfficeRoute } from '../types';

const UserListView = dnLazyView(() => import('../../admin/UserListView'), 'UserListView');
const UserEditView = dnLazyView(() => import('../../admin/UserEditView'), 'UserEditView');

export const ADMIN_ROUTES: DigitalOfficeRoute[] = [
    {
        path: '/admin/user',
        navGroup: DigitalOfficeNavGroup.Administration,
        navLabel: 'Utilisateurs',
        navOrder: 10,
        element: <UserListView />,
        isAdmin: true,
    },
    {
        path: '/admin/user/:id',
        element: <UserEditView />,
        isAdmin: true,
    },
];
