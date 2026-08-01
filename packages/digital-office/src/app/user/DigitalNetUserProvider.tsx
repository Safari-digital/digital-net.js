import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type LoginPayload, type UserDto } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../../api';
import { type LoginOptions, UserContext } from './useDigitalNetUser';

const USER_QUERY_KEY = ['dn-user', 'self'] as const;

export function DigitalNetUserProvider({ children }: React.PropsWithChildren) {
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();

    const { data: userData, isLoading: isQueryLoading } = useQuery<UserDto | null>({
        queryKey: [...USER_QUERY_KEY],
        queryFn: async () => {
            const result = await api.catalog.user.getSelf();
            return result.hasError ? null : result.value;
        },
    });

    const { data: isAdminData, isLoading: isAdminQueryLoading } = useQuery<boolean>({
        queryKey: [...USER_QUERY_KEY, 'is-admin'],
        queryFn: async () => {
            const result = await api.catalog.user.isSelfAdmin();
            return !result.hasError && result.value;
        },
        enabled: userData != null,
    });

    const clearUser = React.useCallback(() => {
        queryClient.setQueryData(USER_QUERY_KEY, null);
        queryClient.setQueryData([...USER_QUERY_KEY, 'is-admin'], false);
    }, [queryClient]);

    React.useEffect(() => {
        const unsubscribe = api.http.subscribeAuthErrorEvent(() => clearUser());
        return unsubscribe;
    }, [api, queryClient, clearUser]);

    const login = React.useCallback(
        async (payload: LoginPayload, options?: LoginOptions) => {
            const result = await api.catalog.auth.login(payload, {
                onStatus: { 401: () => options?.onInvalid?.(), 429: () => options?.onLocked?.() },
            });
            if (result.hasError) return;
            await queryClient.refetchQueries({ queryKey: [...USER_QUERY_KEY] });
        },
        [api, queryClient]
    );

    const { mutateAsync: logout, isPending: isLogoutLoading } = useMutation({
        mutationFn: async () => void (await api.catalog.auth.logout({ onResponse: () => clearUser() })),
    });

    const isLogged = React.useMemo<boolean>(() => userData != null, [userData]);
    const isAdmin = React.useMemo<boolean>(() => isLogged && isAdminData === true, [isLogged, isAdminData]);
    const isLoading = React.useMemo<boolean>(
        () => isQueryLoading || (userData != null && isAdminQueryLoading) || isLogoutLoading,
        [isQueryLoading, userData, isAdminQueryLoading, isLogoutLoading]
    );
    const user = React.useMemo(() => (isLogged ? userData : null), [isLogged, userData]);

    const refresh = React.useCallback(
        () => queryClient.invalidateQueries({ queryKey: [...USER_QUERY_KEY] }),
        [queryClient]
    );

    return (
        <UserContext.Provider
            value={{
                user,
                isLoading,
                isLogged,
                isAdmin,
                refresh,
                login,
                logout,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}
