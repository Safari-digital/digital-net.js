import * as React from 'react';
import type { Entity } from '@digital-net-org/digital-api-sdk';
import { type DnColumnDefinition, DnEntityTable, type DnFilterDefinition, type DnRenderCell, DnView } from '../../ui';
import { DialogConfirmPassword } from '../../ui/components/DialogConfirmPassword';
import { formatDate } from '../../ui/format';
import { type DnEntityIdentifier } from '../types';
import { useDnEntityDelete } from '../useDnEntityDelete';
import { useDnEntityDraftIndex } from '../useDnEntityDraftIndex';
import { useDnEntityList } from '../useDnEntityList';
import { useDnEntitySchema } from '../useDnEntitySchema';
import { useEntityDefinition } from '../useEntityContext';
import { EntityDialogFailure } from './EntityDialogFailure';

function defaultRenderCell<T extends Entity>(...args: Parameters<DnRenderCell<T>>): React.ReactNode {
    const [col, value] = args;
    if (col.kind === 'schema') {
        if (col.schema.type === 'Boolean') return value ? 'Oui' : 'Non';
        if (['DateTime', 'DateTimeOffset'].includes(col.schema.type)) return formatDate(value as string);
    }

    return String(value ?? '');
}

export interface DnEntityListViewProps<T extends Entity> {
    title: string;
    description: string;
    identifier: DnEntityIdentifier;
    identifierAccessor: keyof T;
    entityName: string;
    columns?: DnColumnDefinition<T>[];
    filters?: DnFilterDefinition[];
    protectedDelete?: boolean;
    onRowClick?: (_row: T) => void;
    onCreate?: () => void;
}

export function DnEntityListView<T extends Entity>({
    title,
    description,
    identifier,
    identifierAccessor,
    entityName,
    columns,
    filters,
    protectedDelete = false,
    onRowClick,
    onCreate,
}: DnEntityListViewProps<T>) {
    const { disableDraftStore } = useEntityDefinition(entityName);
    const { schemas, loading: isSchemaLoading } = useDnEntitySchema(entityName);

    const {
        entitiesResult,
        isLoading,
        pagination,
        setPagination,
        sort,
        toggleSort,
        filterValues,
        setFilterValues,
        resetFilters,
        activeFilterCount,
    } = useDnEntityList<T>(entityName, filters);

    const { handleDelete, passwordDialog, failureDialog } = useDnEntityDelete<T>({
        entityName,
        entitiesResult,
        identifier,
        identifierAccessor,
        protectedDelete,
    });

    const { drafts } = useDnEntityDraftIndex(entityName);

    const getRowDraftInfo = React.useCallback(
        (row: T) => {
            const ops = drafts.get(row.id);
            return ops ? { ops } : undefined;
        },
        [drafts]
    );

    const handleRowClick = React.useCallback((row: T) => (onRowClick ? onRowClick(row) : void 0), [onRowClick]);

    return (
        <DnView title={title} description={description}>
            <DnEntityTable
                schema={schemas}
                rows={entitiesResult?.value ?? []}
                columns={columns}
                renderCell={defaultRenderCell}
                pagination={pagination}
                onPaginationChange={setPagination}
                onRowClick={handleRowClick}
                onCreate={onCreate}
                onDelete={handleDelete}
                loading={isLoading || isSchemaLoading}
                sort={sort}
                onSortChange={toggleSort}
                filters={filters}
                filterValues={filterValues}
                onFilterChange={setFilterValues}
                onFilterReset={resetFilters}
                activeFilterCount={activeFilterCount}
                getRowDraftInfo={disableDraftStore ? undefined : getRowDraftInfo}
            />
            {protectedDelete ? <DialogConfirmPassword {...passwordDialog} /> : null}
            <EntityDialogFailure
                open={Boolean(failureDialog.content)}
                content={failureDialog.content}
                identifier={identifier}
                onClose={failureDialog.close}
                onConfirm={failureDialog.close}
            />
        </DnView>
    );
}
