import * as React from 'react';
import {
    Checkbox,
    Table as MuiTable,
    TableBody as MuiTableBody,
    TableCell as MuiTableCell,
    TableHead as MuiTableHead,
    TablePagination as MuiTablePagination,
    TableRow as MuiTableRow,
    Paper,
    Stack,
    TableContainer,
    TableSortLabel,
    Typography,
    alpha,
} from '@mui/material';
import { css, styled } from '@mui/material/styles';
import type { Entity, JsonPatchOp, SchemaProperty } from '@digital-net-org/digital-api-sdk';
import { DnDialog } from '../DnDialog';
import { EntityTableToolbar } from './EntityTableToolbar';
import { type DnColumnDefinition, type DnResolvedColumn, resolveColumns } from './resolveColumns';

export interface DnRowDraftInfo {
    ops: JsonPatchOp[];
}

export type { DnColumnDefinition, DnResolvedColumn };

export type DnRenderCell<T> = (_col: DnResolvedColumn<T>, _value: unknown, _row: T) => React.ReactNode;

export interface DnPaginationState {
    /** 0-based page index (MUI TablePagination convention). API `QueryResult.index` is 1-based. */
    page: number;
    rowsPerPage: number;
    totalRows: number;
}

export interface DnSortState {
    orderBy: string;
    order: 'asc' | 'desc' | '';
}

export type DnFilterDefinition =
    | { type: 'boolean'; key: string; label: string }
    | { type: 'like'; key: string; label: string; placeholder?: string }
    | { type: 'select'; key: string; label: string; options: { value: string; label: string }[] };

export interface DnEntityTableProps<T extends Entity> {
    schema?: SchemaProperty[];
    rows: T[];
    columns?: DnColumnDefinition<T>[];
    renderCell?: DnRenderCell<T>;
    pagination: DnPaginationState;
    onPaginationChange: (_pagination: DnPaginationState) => void;
    onRowClick: (_row: T) => void | Promise<void>;
    onDelete: (_id: Set<string>) => boolean | void | Promise<boolean | void>;
    onCreate?: () => void;
    loading?: boolean;
    sort?: DnSortState;
    onSortChange?: (_accessor: string) => void;
    filters?: DnFilterDefinition[];
    filterValues?: Record<string, string>;
    onFilterChange?: (_patch: Record<string, string>) => void;
    onFilterReset?: () => void;
    activeFilterCount?: number;
    getRowDraftInfo?: (_row: T) => DnRowDraftInfo | undefined;
}

export function DnEntityTable<T extends Entity>({
    schema = [],
    rows,
    columns,
    renderCell,
    pagination,
    onPaginationChange,
    onRowClick,
    onDelete,
    onCreate,
    loading,
    sort,
    onSortChange,
    filters,
    filterValues,
    onFilterChange,
    onFilterReset,
    activeFilterCount,
    getRowDraftInfo,
}: DnEntityTableProps<T>) {
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [deleting, setDeleting] = React.useState(false);
    const [confirmOpen, setConfirmOpen] = React.useState(false);

    const [prevRows, setPrevRows] = React.useState(rows);
    if (rows !== prevRows) {
        setPrevRows(rows);
        setSelectedIds(new Set());
    }

    const allSelected = React.useMemo(
        () => rows.length > 0 && selectedIds.size === rows.length,
        [rows.length, selectedIds.size]
    );
    const someSelected = React.useMemo(
        () => selectedIds.size > 0 && selectedIds.size < rows.length,
        [rows.length, selectedIds.size]
    );
    const resolvedColumns = React.useMemo(() => resolveColumns<T>(schema, columns), [schema, columns]);
    const isLoading = React.useMemo(() => loading || deleting, [deleting, loading]);

    const handleSelectAll = () =>
        allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(rows.map(r => r.id)));

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDelete = async () => {
        setConfirmOpen(false);
        setDeleting(true);
        const result = await onDelete(selectedIds);
        setDeleting(false);
        if (typeof result === 'boolean' && !result) {
            return; // Delete is considered failed, keep selection intact
        }
        setSelectedIds(new Set());
    };

    const handlePageChange = (_: unknown, newPage: number) => onPaginationChange({ ...pagination, page: newPage });
    const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onPaginationChange({
            ...pagination,
            rowsPerPage: parseInt(e.target.value, 10),
            page: 0,
        });
    };

    const colSpan = resolvedColumns.length + 1;

    return (
        <Root elevation={0}>
            <DnDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                confirmLabel="Supprimer"
            >
                <Typography>
                    Vous êtes sur le point de supprimer {selectedIds.size} element{selectedIds.size > 1 ? 's' : ''}.
                </Typography>
            </DnDialog>
            <ActionBar>
                <TablePagination
                    component="div"
                    size="small"
                    labelRowsPerPage={'Ligne par page'}
                    count={pagination.totalRows}
                    page={pagination.page}
                    rowsPerPage={pagination.rowsPerPage}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                />
                <EntityTableToolbar
                    selectedCount={selectedIds.size}
                    onDelete={() => setConfirmOpen(true)}
                    onCreate={onCreate}
                    loading={isLoading}
                    filters={filters}
                    filterValues={filterValues}
                    onFilterChange={onFilterChange}
                    onFilterReset={onFilterReset}
                    activeFilterCount={activeFilterCount}
                />
            </ActionBar>
            <TableContainer>
                <Table $loading={isLoading}>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell padding="checkbox">
                                <Checkbox
                                    indeterminate={someSelected}
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    disabled={isLoading}
                                />
                            </TableHeadCell>
                            {resolvedColumns.map(col => {
                                const sortable = col.kind === 'schema' && Boolean(onSortChange);
                                const isActive = sortable && sort?.orderBy === col.accessor && sort.order !== '';
                                return (
                                    <TableHeadCell key={col.accessor}>
                                        {sortable ? (
                                            <TableSortLabel
                                                active={isActive}
                                                direction={isActive ? (sort!.order as 'asc' | 'desc') : 'desc'}
                                                onClick={() => onSortChange!(col.accessor)}
                                            >
                                                {col.header}
                                            </TableSortLabel>
                                        ) : (
                                            col.header
                                        )}
                                    </TableHeadCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 && !isLoading ? (
                            <TableRow>
                                <TableBodyCell colSpan={colSpan} align="center" height={100}>
                                    <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                        Aucune donnée
                                    </Typography>
                                </TableBodyCell>
                            </TableRow>
                        ) : (
                            rows.map(row => {
                                const isSelected = selectedIds.has(row.id);
                                const draftInfo = getRowDraftInfo?.(row);
                                return (
                                    <TableRow
                                        key={row.id}
                                        hover
                                        selected={isSelected}
                                        onClick={() => onRowClick(row)}
                                        $dirty={Boolean(draftInfo)}
                                    >
                                        <TableBodyCell padding="checkbox" onClick={e => e.stopPropagation()}>
                                            <Checkbox
                                                checked={isSelected}
                                                onChange={() => handleSelectRow(row.id)}
                                                disabled={isLoading}
                                                size="small"
                                            />
                                        </TableBodyCell>
                                        {resolvedColumns.map((col, colIndex) => {
                                            const isFirstColumn = colIndex === 0;
                                            let cellContent: React.ReactNode;
                                            if (col.kind === 'computed') {
                                                cellContent = col.compute(row);
                                            } else {
                                                const value = (row as Record<string, unknown>)[col.accessor];
                                                cellContent = renderCell
                                                    ? renderCell(col, value, row)
                                                    : String(value ?? '');
                                            }
                                            return (
                                                <TableBodyCell
                                                    key={col.accessor}
                                                    sx={{
                                                        position: isFirstColumn && draftInfo ? 'relative' : undefined,
                                                        fontStyle:
                                                            draftInfo && col.kind === 'schema' ? 'italic' : undefined,
                                                    }}
                                                >
                                                    {cellContent}
                                                    {isFirstColumn && draftInfo ? (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                position: 'absolute',
                                                                bottom: 4,
                                                                left: 4,
                                                                fontSize: '0.7rem',
                                                                fontStyle: 'italic',
                                                                color: 'warning.main',
                                                                pointerEvents: 'none',
                                                            }}
                                                        >
                                                            (changements non sauvegardés)
                                                        </Typography>
                                                    ) : null}
                                                </TableBodyCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Root>
    );
}

const Root = styled(Paper)(
    () => css`
        background-color: transparent;
        height: 100%;
        overflow-y: hidden;
        display: flex;
        flex-direction: column;
    `
);

const ActionBar = styled(Stack)(
    () => css`
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    `
);

const Table = styled(MuiTable, {
    shouldForwardProp: prop => prop !== '$loading',
})<{ $loading?: boolean }>(
    ({ $loading }) => css`
        ${$loading &&
        css`
            opacity: 0.5;
            pointer-events: none;
        `}
    `
);

const TableHead = styled(MuiTableHead)(
    ({ theme }) => css`
        background-color: ${alpha(theme.palette.divider, 0.5)};
    `
);

const TableHeadCell = styled(MuiTableCell)(
    ({ theme }) => css`
        font-weight: ${theme.typography.fontWeightMedium};
        text-transform: uppercase;
        letter-spacing: 0.035rem;
        padding: 0 0.25rem;
    `
);

const TableBody = styled(MuiTableBody)(
    () => css`
        height: 100%;
        width: 100%;
    `
);

const TableBodyCell = styled(MuiTableCell)(
    () => css`
        padding: 0 0.25rem;
        letter-spacing: 0.02rem;
        border: none;
        max-width: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    `
);

const TableRow = styled(MuiTableRow, {
    shouldForwardProp: prop => prop !== '$dirty',
})<{ $dirty?: boolean }>(
    ({ theme, $dirty }) => css`
        cursor: pointer;
        ${$dirty &&
        css`
            background-color: ${alpha(theme.palette.divider, 0.15)};
            & td {
                padding-bottom: 12px;
            }
        `}
    `
);

const TablePagination = styled(MuiTablePagination)<{ component: string }>(
    () => css`
        flex: 1;
        min-width: 410px;
        width: 410px;
        max-width: 410px;
        padding: 0 1rem;
        & .MuiToolbar-root {
            padding: 0;
        }
        & .MuiTablePagination-spacer {
            display: none;
        }
    `
);
