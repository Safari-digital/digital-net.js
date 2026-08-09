import * as React from 'react';
import {
    type Entity,
    type JsonPatchOp,
    type Result,
    type SchemaProperty,
    schemaValidation,
} from '@digital-net-org/digital-api-sdk';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { dnBuildKeyFromId } from '../../api';
import { NotFoundView, useDnToast } from '../../app';
import { useDnRouterBlocker } from '../../navigation';
import { DnDialog, DnLoadingView, type DnViewTab } from '../../ui';
import { DnEntityFormProvider } from '../DnEntityFormProvider';
import { EntityView } from '../EntityView';
import { type DnEntityIdentifier } from '../types';
import { useDnEntityDraft } from '../useDnEntityDraft';
import type { DnEntityFormBinding } from '../useDnEntityFormContext';
import { useDnEntitySchema } from '../useDnEntitySchema';
import { useEntityCrud } from '../useEntityCrud';
import { useEntityFormState } from '../useEntityFormState';
import {
    buildCreateErrorToast,
    buildCreateTitle,
    buildCreatedToast,
    buildDeleteTitle,
    buildDeletedToast,
} from './identifier';

export interface DnEntityEditViewProps<T extends Entity> {
    entityName: string;
    identifier: DnEntityIdentifier;
    identifierAccessor: keyof T;
    tabs: DnViewTab[];
    description?: string;
    onGet?: (_id: string) => Promise<Result<T>>;
    onCreate?: (_values: Partial<T>) => Promise<Result<string>>;
    onUpdate?: (_id: string, _ops: JsonPatchOp[]) => Promise<Result<unknown>>;
    onDelete?: (_id: string) => Promise<Result<unknown>>;
    redirectPath: string;
    validate?: (_values: Partial<T>, _schemas: SchemaProperty[]) => Set<string>;
}

export function DnEntityEditView<T extends Entity>({
    entityName,
    identifier,
    identifierAccessor,
    tabs,
    description,
    onGet,
    onCreate,
    onUpdate,
    onDelete,
    redirectPath,
    validate,
}: DnEntityEditViewProps<T>) {
    const { id } = useParams<{ id: string }>();
    const isNew = !id;

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { showToast } = useDnToast();

    const crud = useEntityCrud<T>(entityName);

    const {
        data: entity,
        isLoading,
        isFetching,
        isError,
    } = useQuery<T | undefined>({
        queryKey: dnBuildKeyFromId(entityName, id!),
        queryFn: async () => {
            const result = await (onGet ?? crud.getById)(id!);
            if (result.hasError) {
                throw new Error(result.errors?.[0]?.message ?? `Failed to fetch ${entityName}`);
            }
            return result.value;
        },
        enabled: !isNew,
        retry: false,
    });

    const edit = useDnEntityDraft<T>(entityName, id, entity, { enabled: !isNew });
    const create = useEntityFormState<T>();
    const { schemas } = useDnEntitySchema(entityName);

    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [errors, setErrors] = React.useState<ReadonlySet<string>>(new Set());
    const [resetSignal, setResetSignal] = React.useState(0);

    const blocker = useDnRouterBlocker({ when: isNew && create.isDirty && !isSaving });
    const inputsDisabled = isSaving || isDeleting || (!isNew && isFetching);

    const rawSetField = isNew ? create.setField : edit.setField;
    const setField = React.useCallback(
        (path: string, value: unknown) => {
            rawSetField(path, value);
            if (errors.size === 0) return;
            const accessor = path.startsWith('/') ? path.slice(1).split('/')[0] : path;
            if (!errors.has(accessor)) return;
            setErrors(prev => {
                const next = new Set(prev);
                next.delete(accessor);
                return next;
            });
        },
        [errors, rawSetField]
    );

    const binding: DnEntityFormBinding<T> = isNew
        ? {
              values: create.values,
              setField,
              isDirty: create.isDirty,
              errors,
              disabled: inputsDisabled,
          }
        : {
              values: edit.values,
              apiData: entity,
              setField,
              isDirty: edit.isDirty,
              errors,
              disabled: inputsDisabled,
              resetSignal,
          };

    // Mirrors the SSE prefix invalidation: the stream drops this tab's own echo, so local
    // mutations must cover every entityName-first key (get, list, template…) themselves.
    const invalidateEntity = React.useCallback(
        () => queryClient.invalidateQueries({ queryKey: [entityName] }),
        [entityName, queryClient]
    );

    const invalidateGet = React.useCallback(
        () => queryClient.invalidateQueries({ queryKey: dnBuildKeyFromId(entityName, id!) }),
        [queryClient, entityName, id]
    );

    const handleReload = React.useCallback(async () => {
        await edit.discard();
        await invalidateGet();
        // Force children that hold derived local state (sheets rows, opengraph rows) to re-init
        // from the freshly fetched API payload — TanStack's structural sharing keeps the same
        // reference when the server returns identical content, which would otherwise hide the
        // change from `useSheetsState` / `useOgState`.
        setResetSignal(s => s + 1);
    }, [edit, invalidateGet]);

    const handleSave = React.useCallback(async () => {
        if (isSaving) return;
        const values = (isNew ? create.values : edit.values) as Partial<T>;
        const missing = new Set((validate ?? schemaValidation)(values, schemas));
        if (missing.size > 0) {
            setErrors(missing);
            showToast(missing.size > 1 ? 'Certains champs requis sont vides' : 'Un champ requis est vide', 'error');
            return;
        }
        setErrors(new Set());
        setIsSaving(true);
        try {
            if (isNew) {
                const created = await (onCreate ?? crud.create)(values);
                if (created.hasError || !created.value) {
                    showToast(buildCreateErrorToast(identifier), 'error');
                    return;
                }
                await invalidateEntity();
                showToast(buildCreatedToast(identifier), 'info');
                navigate(`${redirectPath}/${created.value}`);
                return;
            }
            const updated = await (onUpdate ?? crud.update)(id, edit.ops);
            if (updated.hasError) {
                showToast('Erreur lors de la sauvegarde', 'error');
                return;
            }
            await edit.commit();
            await invalidateEntity();
            showToast('Modifications enregistrées', 'info');
        } finally {
            setIsSaving(false);
        }
    }, [
        create.values,
        crud,
        edit,
        id,
        identifier,
        invalidateEntity,
        isNew,
        isSaving,
        navigate,
        onCreate,
        onUpdate,
        redirectPath,
        schemas,
        showToast,
        validate,
    ]);

    const handleDelete = React.useCallback(async () => {
        setDeleteDialogOpen(false);
        if (!id) return;
        setIsDeleting(true);
        try {
            const result = await (onDelete ?? crud.remove)(id);
            if (result.hasError) {
                showToast('Erreur lors de la suppression', 'error');
                return;
            }
            await edit.discard();
            await invalidateEntity();
            showToast(buildDeletedToast(identifier), 'info');
            navigate(redirectPath);
        } finally {
            setIsDeleting(false);
        }
    }, [crud, edit, id, identifier, invalidateEntity, navigate, onDelete, redirectPath, showToast]);

    if (!isNew && isLoading) return <DnLoadingView />;
    if (!isNew && isError) return <NotFoundView />;

    const title = isNew
        ? buildCreateTitle(identifier)
        : `Édition : ${String((entity as Partial<T> | undefined)?.[identifierAccessor] ?? '')}`;

    return (
        <DnEntityFormProvider binding={binding}>
            <EntityView
                title={title}
                description={description}
                tabs={tabs}
                isNew={isNew}
                isSaving={isSaving || isDeleting}
                isDirty={binding.isDirty}
                hasConflict={!isNew && edit.hasConflict}
                baselineUpdatedAt={edit.baselineUpdatedAt}
                apiUpdatedAt={edit.apiUpdatedAt}
                onSave={handleSave}
                onDelete={() => setDeleteDialogOpen(true)}
                onReload={isNew ? undefined : handleReload}
            />
            <DnDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                confirmLabel="Supprimer"
                title={buildDeleteTitle(identifier)}
            >
                Cette action est définitive. Continuer ?
            </DnDialog>
            <DnDialog
                open={blocker.isBlocked}
                onClose={blocker.cancel}
                onConfirm={blocker.confirm}
                confirmLabel="Quitter sans sauvegarder"
                title="Modifications non sauvegardées"
            >
                Si vous quittez cette page, les données saisies seront perdues. Continuer ?
            </DnDialog>
        </DnEntityFormProvider>
    );
}
