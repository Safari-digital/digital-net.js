import * as React from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { Layout, useDigitalNetUser } from '../app';
import { DnLoadingView } from '../ui';
import { Guards, AuthGuard, GuestGuard } from './guards';
import { APP_ROUTES, ADMIN_ROUTES, CMS_ROUTES } from './routes';
import type { DigitalOfficeRoute } from './types';

export interface DigitalOfficeRouterProps {
    routes?: DigitalOfficeRoute[];
}

function guardFor(route: DigitalOfficeRoute): React.ReactNode {
    if (route.isPublic) return <GuestGuard>{route.element}</GuestGuard>;
    if (route.isAdmin) return <Guards>{route.element}</Guards>;
    return <AuthGuard>{route.element}</AuthGuard>;
}

function RouterLayout({ allRoutes }: { allRoutes: DigitalOfficeRoute[] }) {
    const { isAdmin } = useDigitalNetUser();

    const navigation = React.useMemo(
        () =>
            allRoutes
                .filter(r => r.navGroup && r.navLabel && (!r.isAdmin || isAdmin))
                .reduce<Record<string, { path: string; label: string }[]>>((acc, curr) => {
                    const item = { path: curr.path, label: curr.navLabel! };
                    if (acc[curr.navGroup!]) acc[curr.navGroup!].push(item);
                    else acc[curr.navGroup!] = [item];
                    return acc;
                }, {}),
        [allRoutes, isAdmin]
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

export function DigitalOfficeRouter({ routes }: DigitalOfficeRouterProps) {
    const { isLoading } = useDigitalNetUser();

    const router = React.useMemo(() => {
        const allRoutes: DigitalOfficeRoute[] = [...APP_ROUTES, ...ADMIN_ROUTES, ...CMS_ROUTES, ...(routes ?? [])];
        return createBrowserRouter([
            {
                element: <RouterLayout allRoutes={allRoutes} />,
                children: allRoutes.map(r => ({
                    path: r.path,
                    element: guardFor(r),
                })),
            },
        ]);
    }, [routes]);

    return isLoading ? <DnLoadingView /> : <RouterProvider router={router} />;
}
