import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { type UserDto, unwrapResult } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, dnBuildListKey, useDigitalNetApi } from '../api';
import { NotFoundException, useDnToast } from '../app';

type PendingAction = 'save' | 'delete';

export function useUserData(id: string | undefined) {
    const api = useDigitalNetApi();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useDnToast();

    const { data, isLoading, error } = useQuery<UserDto | undefined>({
        queryKey: dnBuildKeyFromId('user', id!),
        queryFn: async () => {
            const response = await api.http.request<unknown>({
                path: 'user/:id',
                slugs: { id: id! },
            });
            const result = unwrapResult<UserDto>(response.data);
            if (!dataInit && result) {
                setFormState({ isAdmin: result.isAdmin, isActive: result.isActive });
                setDataInit(true);
            }
            return result;
        },
        enabled: Boolean(id),
        retry: false,
    });

    if (error || !Boolean(id)) {
        throw new NotFoundException(`Utilisateur introuvable`);
    }

    const [dataInit, setDataInit] = React.useState<boolean>(false);
    const [formState, setFormState] = React.useState({ isAdmin: false, isActive: false });
    const [isSaving, setIsSaving] = React.useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState(false);
    const pendingActionRef = React.useRef<PendingAction | null>(null);

    const isDirty = React.useMemo(
        () => Boolean(data && (data.isAdmin !== formState.isAdmin || data.isActive !== formState.isActive)),
        [data, formState.isActive, formState.isAdmin]
    );

    const readOnlyData = React.useMemo(
        () => ({
            username: data?.username,
            login: data?.login,
            email: data?.email,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
        }),
        [data]
    );

    const applyChanges = React.useCallback(
        async (password?: string): Promise<boolean> => {
            if (!data || !id) return true;
            setIsSaving(true);
            setPasswordError(false);

            let passwordWrong = false;
            let demoteForbidden = false;
            let deactivateForbidden = false;
            let otherError = false;

            if (data.isAdmin !== formState.isAdmin) {
                const result = await api.catalog.user.updateUserRole(
                    { isAdmin: formState.isAdmin, password: password ?? '' },
                    id,
                    {
                        onStatus: {
                            401: () => void (passwordWrong = true),
                            403: () => void (demoteForbidden = true),
                        },
                    }
                );
                if (passwordWrong) {
                    setPasswordError(true);
                    setIsSaving(false);
                    return false;
                }
                if (result.hasError && !demoteForbidden) otherError = true;
            }

            if (data.isActive !== formState.isActive) {
                const result = await api.catalog.user.updateUserStatus({ isActive: formState.isActive }, id, {
                    onStatus: { 403: () => void (deactivateForbidden = true) },
                });
                if (result.hasError && !deactivateForbidden) otherError = true;
            }

            if (demoteForbidden) showToast('Un administrateur ne peut pas être rétrogradé.', 'error');
            if (deactivateForbidden) showToast('Un administrateur ne peut pas être désactivé.', 'error');
            if (otherError) showToast('Une erreur est survenue lors de la sauvegarde des modifications.', 'error');

            await queryClient.invalidateQueries({ queryKey: dnBuildKeyFromId('user', id) });
            setPasswordDialogOpen(false);
            setIsSaving(false);
            return true;
        },
        [api.catalog.user, data, formState.isActive, formState.isAdmin, id, queryClient, showToast]
    );

    const applyDelete = React.useCallback(
        async (password: string): Promise<boolean> => {
            if (!id) return true;
            setIsSaving(true);
            setPasswordError(false);

            let passwordWrong = false;
            let forbidden = false;
            const result = await api.catalog.user.deleteById(id, password, {
                onStatus: {
                    401: () => void (passwordWrong = true),
                    403: () => void (forbidden = true),
                },
            });

            if (passwordWrong) {
                setPasswordError(true);
                setIsSaving(false);
                return false;
            }

            if (forbidden) {
                showToast('Un administrateur ne peut pas être supprimé.', 'error');
                setPasswordDialogOpen(false);
                setIsSaving(false);
                return true;
            }
            if (result.hasError) {
                showToast("Une erreur est survenue lors de la suppression de l'utilisateur.", 'error');
                setPasswordDialogOpen(false);
                setIsSaving(false);
                return true;
            }

            await queryClient.invalidateQueries({ queryKey: dnBuildListKey('user') });
            showToast('Utilisateur supprimé.', 'info');
            navigate('/admin/user');
            return true;
        },
        [api.catalog.user, id, navigate, queryClient, showToast]
    );

    const save = React.useCallback(async () => {
        if (!data || !id || !isDirty) return;
        if (data.isAdmin !== formState.isAdmin) {
            pendingActionRef.current = 'save';
            setPasswordError(false);
            setPasswordDialogOpen(true);
            return;
        }
        await applyChanges();
    }, [applyChanges, data, formState.isAdmin, id, isDirty]);

    const requestDelete = React.useCallback(() => {
        if (!id) return;
        pendingActionRef.current = 'delete';
        setPasswordError(false);
        setPasswordDialogOpen(true);
    }, [id]);

    const confirmPassword = React.useCallback(
        async (password: string) => {
            const ok =
                pendingActionRef.current === 'delete' ? await applyDelete(password) : await applyChanges(password);
            if (ok) pendingActionRef.current = null;
        },
        [applyChanges, applyDelete]
    );

    const closePasswordDialog = React.useCallback(() => {
        pendingActionRef.current = null;
        setPasswordDialogOpen(false);
        setPasswordError(false);
    }, []);

    return {
        readOnlyData,
        formState,
        setFormState,
        isSaving,
        isLoading,
        isDirty,
        save,
        requestDelete,
        passwordDialog: {
            open: passwordDialogOpen,
            loading: isSaving,
            showError: passwordError,
            onClose: closePasswordDialog,
            onConfirm: confirmPassword,
        },
    };
}
