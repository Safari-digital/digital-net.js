import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ArticleDto, PageListDto, QueryResult } from '@digital-net-org/digital-api-sdk';
import { StringResolver } from '@digital-net-org/digital-core';
import { dnBuildListKey, useDigitalNetApi } from '../../../api';
import { type DnEntityFormProps, useDnEntityFormContext, useDnEntitySchema } from '../../../entity';

const SLUG_HELPER = 'Segment d\'URL public de l\'article (ex: "mon-article").';
const SLUG_AVAILABILITY_ERROR = "Ce segment d'URL est déjà utilisé.";
const SLUG_DEBOUNCE_MS = 1500;

const INTERPOLABLE_PAGES_PAGE_SIZE = 10;

const baseFieldProps: DnEntityFormProps['fieldProps'] = {
    Title: {
        label: 'Titre',
        helperText: "Titre éditorial de l'article, affiché dans les listings et utilisé pour le rendu.",
    },
    Description: {
        label: 'Description',
        helperText: 'Description courte (peut être utilisée par la page-template).',
    },
    Slug: {
        label: 'Segment URL',
        helperText: SLUG_HELPER,
    },
    PublishedAt: {
        label: 'Publié le',
        helperText: "Date de publication. Si vide, l'article reste en brouillon (non atteignable publiquement).",
    },
};

export function useArticleForm(articleId: string | undefined) {
    const api = useDigitalNetApi();
    const { schemas } = useDnEntitySchema('Article');
    const { values, apiData, setField } = useDnEntityFormContext<ArticleDto>();

    const slugSchema = React.useMemo(() => schemas.find(s => s.name === 'Slug'), [schemas]);
    const slugPattern = slugSchema?.regexValidation ?? undefined;
    const currentSlug = String(values.slug ?? '');
    const apiSlug = String(apiData?.slug ?? '');
    const titleSource = String(values.title ?? '');

    const [slugAvailabilityError, setSlugAvailabilityError] = React.useState(false);
    const handleSlugChange = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setSlugAvailabilityError(false);
            setField('/slug', event.target.value);
        },
        [setField]
    );
    const handleSlugDebounced = React.useCallback(
        async (next: string, signal: AbortSignal) => {
            const res = await api.catalog.article.checkSlugAvailability(next, articleId, { signal });
            if (signal.aborted) return;
            setSlugAvailabilityError(!res.hasError && !res.value);
        },
        [api.catalog.article, articleId]
    );
    const handleAutoSlug = React.useCallback(() => {
        const next = StringResolver.toKebabCase(titleSource);
        if (!next || next === currentSlug) return;
        setSlugAvailabilityError(false);
        setField('/slug', next);
    }, [currentSlug, setField, titleSource]);

    const [pagesSize, setPagesSize] = React.useState(INTERPOLABLE_PAGES_PAGE_SIZE);
    const {
        data: pagesResult,
        isLoading: pagesLoading,
        isFetching: pagesFetching,
    } = useQuery<QueryResult<PageListDto>>({
        queryKey: [...dnBuildListKey('Page'), { entityType: 'Article', size: pagesSize }],
        queryFn: async () => {
            const result = await api.http.request<QueryResult<PageListDto>>({
                path: 'cms/pages',
                params: { size: pagesSize, index: 1, entityType: 'Article' },
            });
            return result.data;
        },
    });

    const pagesItems = React.useMemo(() => pagesResult?.value ?? [], [pagesResult]);
    const selectedPage = pagesItems.find(p => p.id === values.pageId) ?? null;
    const hasMorePages = pagesResult ? pagesItems.length < pagesResult.total : false;
    const loadMorePages = React.useCallback(() => setPagesSize(size => size + INTERPOLABLE_PAGES_PAGE_SIZE), []);

    const setFieldWithAutoSlug = React.useCallback(
        (path: string, value: unknown) => {
            if (path === '/title' && typeof value === 'string') {
                const slug = String(values.slug ?? '');
                const currentKebab = StringResolver.toKebabCase(titleSource);
                const nextKebab = StringResolver.toKebabCase(value);
                if (slug === currentKebab || slug === nextKebab) {
                    setSlugAvailabilityError(false);
                    setField('/slug', nextKebab);
                }
            }
            setField(path, value);
        },
        [setField, titleSource, values.slug]
    );

    const pageDefaultedRef = React.useRef(false);
    React.useEffect(() => {
        if (pageDefaultedRef.current || values.pageId || pagesItems.length === 0) return;
        pageDefaultedRef.current = true;
        setField('/pageId', pagesItems[0].id);
    }, [values.pageId, pagesItems, setField]);

    const fieldProps = React.useMemo<DnEntityFormProps['fieldProps']>(
        () => ({
            ...baseFieldProps,
            Slug: { ...baseFieldProps.Slug },
        }),
        []
    );

    return {
        fieldProps,
        setFieldWithAutoSlug,
        titleSource,
        slug: {
            schema: slugSchema,
            pattern: slugPattern,
            current: currentSlug,
            apiValue: apiSlug,
            availabilityError: slugAvailabilityError,
            handleChange: handleSlugChange,
            handleDebounced: handleSlugDebounced,
            handleAuto: handleAutoSlug,
            debounceInMs: SLUG_DEBOUNCE_MS,
            helper: SLUG_HELPER,
            availabilityErrorMessage: SLUG_AVAILABILITY_ERROR,
        },
        pages: {
            items: pagesItems,
            selected: selectedPage,
            isLoading: pagesLoading,
            isFetching: pagesFetching,
            hasMore: hasMorePages,
            total: pagesResult?.total ?? 0,
            loadMore: loadMorePages,
        },
    };
}
