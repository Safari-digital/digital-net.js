import * as React from 'react';
import { Navigate } from 'react-router';
import { useDigitalNetUser } from '../app';
import { ROUTER_HOME_PAGE, ROUTER_LOGIN_PAGE } from './routes';

export function Guards({ children }: React.PropsWithChildren) {
    const { isLogged, isAdmin, isLoading } = useDigitalNetUser();
    if (isLoading) {
        return null;
    }
    if (!isLogged) {
        return <Navigate to={ROUTER_LOGIN_PAGE} replace />;
    }
    if (!isAdmin) {
        return <h1>404</h1>;
    }
    return <React.Fragment>{children}</React.Fragment>;
}

export function AuthGuard({ children }: React.PropsWithChildren) {
    const { isLogged, isLoading } = useDigitalNetUser();
    if (isLoading) {
        return null;
    }
    if (!isLogged) {
        return <Navigate to={ROUTER_LOGIN_PAGE} replace />;
    }
    return <React.Fragment>{children}</React.Fragment>;
}

export function GuestGuard({ children }: React.PropsWithChildren) {
    const { isLogged, isLoading } = useDigitalNetUser();
    if (isLoading) {
        return null;
    }
    if (isLogged) {
        return <Navigate to={ROUTER_HOME_PAGE} replace />;
    }
    return <React.Fragment>{children}</React.Fragment>;
}
