import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ArticleDto, QueryResult, TagDto } from '@digital-net-org/digital-api-sdk';
import { dnBuildListKey, useDigitalNetApi } from '../../../api';
import { useDnEntityFormContext } from '../../../entity';
import { useArticleAutocomplete } from './useArticleAutocomplete';

export type TagOption = Omit<TagDto, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
};

const TAGS_PAGE_SIZE = 20;

export interface UseArticleFormTagsResult {
    value: TagOption[];
    options: TagOption[];
    inputValue: string;
    isFetching: boolean;
    onInputChange: (_event: unknown, _next: string) => void;
    onChange: (_next: TagOption[]) => void;
    isOptionEqualToValue: (_a: TagOption, _b: TagOption) => boolean;
    getOptionLabel: (_option: TagOption) => string;
    createOptionFromText: (_text: string) => TagOption;
}

export function useArticleFormTags(): UseArticleFormTagsResult {
    const api = useDigitalNetApi();
    const { values, setField } = useDnEntityFormContext<ArticleDto>();
    const { inputValue, search, onInputChange } = useArticleAutocomplete();

    const { data: result, isFetching } = useQuery<QueryResult<TagDto>>({
        queryKey: [...dnBuildListKey('tag'), { name: search, size: TAGS_PAGE_SIZE }],
        queryFn: async () => {
            const params: Record<string, unknown> = { size: TAGS_PAGE_SIZE, index: 1 };
            if (search) params.name = search;
            const response = await api.http.request<QueryResult<TagDto>>({ path: 'cms/tags', params });
            return response.data;
        },
    });

    const value = React.useMemo<TagOption[]>(() => (values.tags ?? []) as TagOption[], [values.tags]);
    const options = React.useMemo<TagOption[]>(() => {
        const fetched = (result?.value ?? []) as TagOption[];
        return fetched.filter(
            opt =>
                !value.some(t => (t.id && opt.id ? t.id === opt.id : t.name.toLowerCase() === opt.name.toLowerCase()))
        );
    }, [result, value]);

    const onChange = React.useCallback((next: TagOption[]) => setField('/tags', next), [setField]);

    return {
        value,
        options,
        inputValue,
        isFetching,
        onInputChange,
        onChange,
        isOptionEqualToValue: (a, b) => (a.id && b.id ? a.id === b.id : a.name.toLowerCase() === b.name.toLowerCase()),
        getOptionLabel: option => option.name,
        createOptionFromText: text => ({ name: text.trim(), color: null }),
    };
}
