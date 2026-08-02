import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ArticleDto, ArticleListDto, ArticleRefDto, QueryResult } from '@digital-net-org/digital-api-sdk';
import { dnBuildListKey, useDigitalNetApi } from '../../../api';
import { useDnEntityFormContext } from '../../../entity';
import { useArticleAutocomplete } from './useArticleAutocomplete';

const RELATED_PAGE_SIZE = 20;

export function useArticleFormRelated(articleId: string | undefined) {
    const api = useDigitalNetApi();
    const { values, setField } = useDnEntityFormContext<ArticleDto>();
    const { inputValue, search, onInputChange } = useArticleAutocomplete();

    const { data: result, isFetching } = useQuery<QueryResult<ArticleListDto>>({
        queryKey: [...dnBuildListKey('Article'), { name: search, size: RELATED_PAGE_SIZE }],
        queryFn: async () => {
            const params: Record<string, unknown> = { size: RELATED_PAGE_SIZE, index: 1 };
            if (search) params.name = search;
            const response = await api.http.request<QueryResult<ArticleListDto>>({ path: 'cms/articles', params });
            return response.data;
        },
    });

    const value = React.useMemo<ArticleRefDto[]>(() => values.related ?? [], [values.related]);

    const options = React.useMemo<ArticleRefDto[]>(() => {
        const fetched = (result?.value ?? []).map<ArticleRefDto>(a => ({
            id: a.id,
            title: a.title,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        }));
        const selectedIds = new Set(value.map(r => r.id));
        return fetched.filter(opt => opt.id !== articleId && !selectedIds.has(opt.id));
    }, [result, value, articleId]);

    const onChange = React.useCallback((next: ArticleRefDto[]) => setField('/related', next), [setField]);

    return {
        value,
        options,
        inputValue,
        isFetching,
        onInputChange,
        onChange,
        isOptionEqualToValue: ((a, b) => a.id === b.id) satisfies (_a: ArticleRefDto, _b: ArticleRefDto) => boolean,
        getOptionLabel: (option => option.title) satisfies (_option: ArticleRefDto) => string,
    };
}
