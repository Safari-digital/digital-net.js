import * as React from 'react';
import { type Entity, type QueryResult } from '@digital-net-org/digital-api-sdk';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dnBuildListKey, useDigitalNetApi } from '../api';
import { type DnUrlParam, DnUrlParamBuilder, useDnUrlQueryState } from '../navigation';
import { type DnFilterDefinition, type DnPaginationState, type DnSortState } from '../ui';
import { useEntityDefinition } from './useEntityContext';

export interface UseDnEntityListResult<T extends Entity> {
    entitiesResult: QueryResult<T> | undefined;
    isLoading: boolean;
    pagination: DnPaginationState;
    setPagination: (_next: DnPaginationState) => void;
    sort: DnSortState;
    toggleSort: (_accessor: string) => void;
    filterValues: Record<string, string>;
    setFilterValues: (_patch: Record<string, string>) => void;
    resetFilters: () => void;
    activeFilterCount: number;
}

export function useDnEntityList<T extends Entity>(
    entityName: string,
    filters?: DnFilterDefinition[]
): UseDnEntityListResult<T> {
    const { path } = useEntityDefinition(entityName);

    const api = useDigitalNetApi();
    const [query, setQuery] = useDnUrlQueryState({
        page: DnUrlParamBuilder.buildInt(1, 'page'),
        row: DnUrlParamBuilder.buildInt(25, 'row'),
        orderBy: DnUrlParamBuilder.buildString('', 'order-by'),
        order: DnUrlParamBuilder.buildString('', 'order'),
    });

    const filterSchema = React.useMemo(() => {
        const s: Record<string, DnUrlParam<string>> = {};
        for (const f of filters ?? []) s[f.key] = DnUrlParamBuilder.buildString('', f.key);
        return s;
    }, [filters]);
    const [filterValues, setFilterValues] = useDnUrlQueryState(filterSchema);

    const urlPage = React.useMemo(() => Math.max(0, query.page - 1), [query.page]);
    const activeFilters = React.useMemo(() => {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(filterValues)) if (v !== '') out[k] = v;
        return out;
    }, [filterValues]);

    const { data: entitiesResult, isLoading } = useQuery<QueryResult<T>>({
        queryKey: [...dnBuildListKey(entityName), urlPage, query.row, query.orderBy, query.order, activeFilters],
        queryFn: async () => {
            const result = await api.http.request<QueryResult<T>>({
                path,
                params: {
                    index: urlPage + 1,
                    size: query.row,
                    ...(query.orderBy ? { 'order-by': query.orderBy, order: query.order || 'asc' } : {}),
                    ...activeFilters,
                },
            });
            return result.data;
        },
        // Keep the current page's rows (and total) visible while the next page/sort/filter loads
        // instead of flashing an empty table.
        placeholderData: keepPreviousData,
    });

    const pagination = React.useMemo<DnPaginationState>(
        () => ({
            page: urlPage,
            rowsPerPage: query.row,
            totalRows: entitiesResult?.total ?? 0,
        }),
        [urlPage, query.row, entitiesResult]
    );

    const setPagination = React.useCallback(
        (next: DnPaginationState) => setQuery({ page: next.page + 1, row: next.rowsPerPage }),
        [setQuery]
    );

    const sort = React.useMemo<DnSortState>(
        () => ({ orderBy: query.orderBy, order: (query.order as DnSortState['order']) || '' }),
        [query.orderBy, query.order]
    );

    const toggleSort = React.useCallback(
        (accessor: string) => {
            if (query.orderBy !== accessor) {
                setQuery({ orderBy: accessor, order: 'desc' });
            } else if (query.order === 'desc') {
                setQuery({ orderBy: accessor, order: 'asc' });
            } else {
                setQuery({ orderBy: '', order: '' });
            }
        },
        [query.orderBy, query.order, setQuery]
    );

    const resetFilters = React.useCallback(() => {
        const cleared: Record<string, string> = {};
        for (const key in filterSchema) cleared[key] = '';
        setFilterValues(cleared);
    }, [filterSchema, setFilterValues]);

    const activeFilterCount = React.useMemo(() => Object.keys(activeFilters).length, [activeFilters]);

    return {
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
    };
}
