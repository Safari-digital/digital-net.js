import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    type Entity,
    type EntityName,
    HttpClientError,
    type QueryResult,
    resolveEntityPath,
} from '@digital-net-org/digital-api-sdk';
import { ArrayBuilder, URLResolver } from '@digital-net-org/digital-core';
import { dnBuildListKey, useDigitalNetApi } from '../api';
import { useDnToast } from '../app';
import { type EntityFailureDialogContentProps } from './DnEntityListView/EntityDialogFailure';
import { resolveDeleteLabel } from './DnEntityListView/identifier';
import { type DnEntityIdentifier } from './types';

const CHUNK_SIZE = 5;

interface DeleteTarget {
    id: string;
    name: string | undefined;
}

type DeleteResult = { success: true; target: DeleteTarget } | { success: false; target: DeleteTarget; error: unknown };

export interface UseDnEntityDeleteOptions<T extends Entity> {
    entityName: string;
    apiPath?: string;
    entitiesResult: QueryResult<T> | undefined;
    identifier: DnEntityIdentifier;
    identifierAccessor: keyof T;
    protectedDelete: boolean;
}

export interface UseDnEntityDeleteResult {
    handleDelete: (_ids: Set<string>) => Promise<boolean | void>;
    passwordDialog: {
        open: boolean;
        loading: boolean;
        showError: boolean;
        onClose: () => void;
        onConfirm: (_password: string) => Promise<void>;
    };
    failureDialog: {
        content: EntityFailureDialogContentProps['content'];
        close: () => void;
    };
}

export function useDnEntityDelete<T extends Entity>({
    entitiesResult,
    entityName,
    apiPath,
    identifier,
    identifierAccessor,
    protectedDelete,
}: UseDnEntityDeleteOptions<T>): UseDnEntityDeleteResult {
    const resolvedPath = apiPath ?? resolveEntityPath(entityName as EntityName);

    const api = useDigitalNetApi();
    const queryClient = useQueryClient();
    const { showToast } = useDnToast();

    const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [failureDialog, setFailureDialog] = React.useState<EntityFailureDialogContentProps['content']>();

    const pendingDeleteRef = React.useRef<{
        ids: Set<string>;
        resolve: (_success: boolean) => void;
    } | null>(null);

    const buildTargets = React.useCallback(
        (ids: Set<string>): DeleteTarget[] => {
            const rows = entitiesResult?.value ?? [];
            return Array.from(ids).map(id => {
                const row = rows.find(r => r.id === id);
                const raw = row ? (row as Record<string, unknown>)[identifierAccessor as string] : undefined;
                return { id, name: raw != null ? String(raw) : undefined };
            });
        },
        [entitiesResult, identifierAccessor]
    );

    const deleteOne = React.useCallback(
        async (target: DeleteTarget, password?: string): Promise<DeleteResult> => {
            try {
                if (!resolvedPath) {
                    throw new Error(`useDnEntityDelete: no API path for entity "${entityName}" — pass apiPath.`);
                }
                await api.http.request({
                    method: 'DELETE',
                    path: URLResolver.resolve(resolvedPath, ':id'),
                    slugs: { id: target.id },
                    ...(password ? { body: { password } } : {}),
                });
                return { success: true, target };
            } catch (error) {
                return { success: false, target, error };
            }
        },
        [api.http, entityName, resolvedPath]
    );

    const showFeedback = React.useCallback(
        (failures: DeleteTarget[], total: number) => {
            const successCount = total - failures.length;
            if (failures.length === 0) {
                const plural = successCount > 1;
                const noun = plural ? identifier.plural : identifier.singular;
                showToast(`${successCount} ${noun} ${resolveDeleteLabel(identifier.gender, plural)}`, 'info');
            } else {
                setFailureDialog({ failures: failures.map(f => ({ name: f.name })), total });
            }
        },
        [identifier, showToast]
    );

    const executeBatchDelete = React.useCallback(
        async (ids: Set<string>, password?: string): Promise<boolean> => {
            setIsDeleting(true);
            setPasswordError(false);

            const targets = buildTargets(ids);
            const chunks = ArrayBuilder.chunk(targets, CHUNK_SIZE);
            const failures: DeleteTarget[] = [];
            let firstChunkDone = false;

            for (const chunk of chunks) {
                const results = await Promise.all(chunk.map(t => deleteOne(t, password)));

                if (protectedDelete && !firstChunkDone) {
                    const passwordWrong = results.some(
                        r => !r.success && r.error instanceof HttpClientError && r.error.status === 401
                    );
                    if (passwordWrong) {
                        setPasswordError(true);
                        setIsDeleting(false);
                        return false;
                    }
                    firstChunkDone = true;
                }

                for (const r of results) if (!r.success) failures.push(r.target);
            }

            await queryClient.invalidateQueries({ queryKey: dnBuildListKey(entityName) });
            setPasswordDialogOpen(false);
            setIsDeleting(false);
            showFeedback(failures, targets.length);
            return true;
        },
        [buildTargets, deleteOne, entityName, protectedDelete, queryClient, showFeedback]
    );

    const handleConfirmPassword = React.useCallback(
        async (password: string) => {
            const pending = pendingDeleteRef.current;
            if (!pending) return;
            const ok = await executeBatchDelete(pending.ids, password);
            if (!ok) return;
            pending.resolve(true);
            pendingDeleteRef.current = null;
        },
        [executeBatchDelete]
    );

    const handleDelete = React.useCallback(
        async (ids: Set<string>): Promise<boolean | void> => {
            if (!protectedDelete) {
                await executeBatchDelete(ids);
                return true;
            }
            return new Promise<boolean>(resolve => {
                pendingDeleteRef.current = { ids, resolve };
                setPasswordError(false);
                setPasswordDialogOpen(true);
            });
        },
        [executeBatchDelete, protectedDelete]
    );

    const handleClosePasswordDialog = React.useCallback(() => {
        if (pendingDeleteRef.current) {
            pendingDeleteRef.current.resolve(false);
            pendingDeleteRef.current = null;
        }
        setPasswordDialogOpen(false);
        setPasswordError(false);
    }, []);

    const closeFailureDialog = React.useCallback(() => setFailureDialog(undefined), []);

    return {
        handleDelete,
        passwordDialog: {
            open: passwordDialogOpen,
            loading: isDeleting,
            showError: passwordError,
            onClose: handleClosePasswordDialog,
            onConfirm: handleConfirmPassword,
        },
        failureDialog: {
            content: failureDialog,
            close: closeFailureDialog,
        },
    };
}
