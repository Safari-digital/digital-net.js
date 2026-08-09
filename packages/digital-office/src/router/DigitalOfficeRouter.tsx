import * as React from 'react';
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router';
import { Layout, useDigitalNetUser } from '../app';
import { DnLoadingView } from '../ui';
import { buildNavSections, mergeNavGroupDefs } from './buildNavSections';
import { AuthGuard, Guards, GuestGuard } from './guards';
import { type DigitalOfficeNavGroupDef, NAV_GROUP_DEFS } from './navGroups';
import { ADMIN_ROUTES, APP_ROUTES, CMS_ROUTES } from './routes';
import type { DigitalOfficeRoute } from './types';

export interface DigitalOfficeRouterProps {
    routes?: DigitalOfficeRoute[];
    /** Client nav groups; reusing a built-in id overrides its label/order. */
    navGroups?: DigitalOfficeNavGroupDef[];
}

function guardFor(route: DigitalOfficeRoute): React.ReactNode {
    if (route.isPublic) return <GuestGuard>{route.element}</GuestGuard>;
    if (route.isAdmin) return <Guards>{route.element}</Guards>;
    return <AuthGuard>{route.element}</AuthGuard>;
}

function RouterLayout({
    allRoutes,
    navGroups,
}: {
    allRoutes: DigitalOfficeRoute[];
    navGroups?: DigitalOfficeNavGroupDef[];
}) {
    const { isAdmin } = useDigitalNetUser();

    const navigation = React.useMemo(
        () =>
            buildNavSections(
                allRoutes.filter(r => !r.isAdmin || isAdmin),
                mergeNavGroupDefs(NAV_GROUP_DEFS, navGroups)
            ),
        [allRoutes, navGroups, isAdmin]
    );

    const routePatterns = React.useMemo(() => allRoutes.map(r => r.path).filter(p => !p.includes('*')), [allRoutes]);

    return (
        <Layout navigation={navigation} routePatterns={routePatterns}>
            <React.Suspense fallback={<DnLoadingView />}>
                <Outlet />
            </React.Suspense>
        </Layout>
    );
}

export function DigitalOfficeRouter({ routes, navGroups }: DigitalOfficeRouterProps) {
    const { isLoading } = useDigitalNetUser();

    const router = React.useMemo(() => {
        const allRoutes: DigitalOfficeRoute[] = [...APP_ROUTES, ...ADMIN_ROUTES, ...CMS_ROUTES, ...(routes ?? [])];
        return createBrowserRouter([
            {
                element: <RouterLayout allRoutes={allRoutes} navGroups={navGroups} />,
                children: allRoutes.map(r => ({
                    path: r.path,
                    element: guardFor(r),
                })),
            },
        ]);
    }, [routes, navGroups]);

    return isLoading ? <DnLoadingView /> : <RouterProvider router={router} />;
}
