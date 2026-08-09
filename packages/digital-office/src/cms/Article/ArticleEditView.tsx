import * as React from 'react';
import {
    type ArticleDto,
    JsonPatch,
    type JsonPatchOp,
    type SchemaProperty,
    schemaValidation,
} from '@digital-net-org/digital-api-sdk';
import { ObjectMapper } from '@digital-net-org/digital-core';
import { useQueryClient } from '@tanstack/react-query';
import { dnBuildListKey, useDigitalNetApi } from '../../api';
import { DnEntityEditView } from '../../entity';
import { ArticleTabContent, ArticleTabGeneral } from './Tabs';

const DEFAULT_CONTENT = '<p class="paragraph"></p>';

export function ArticleEditView() {
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();

    const handleUpdate = React.useCallback(
        async (id: string, ops: JsonPatchOp[]) => {
            const patched = ops.map(op =>
                op.op !== 'remove' && op.path === '/content' && !op.value ? { ...op, value: DEFAULT_CONTENT } : op
            );
            const result = await api.catalog.article.update(id, patched);
            if (!result.hasError && patched.some(op => op.path.startsWith('/tags')))
                await queryClient.invalidateQueries({ queryKey: dnBuildListKey('Tag') });
            return result;
        },
        [api.catalog.article, queryClient]
    );

    const validate = React.useCallback(
        (values: Partial<ArticleDto>, schemas: SchemaProperty[]) =>
            schemaValidation(
                values,
                schemas.filter(s => s.name !== 'Content')
            ),
        []
    );

    const handleCreate = React.useCallback(
        async (values: Partial<ArticleDto>) => {
            const created = await api.catalog.article.create({
                title: String(values.title ?? ''),
                slug: String(values.slug ?? ''),
                description: values.description,
                content: values.content || DEFAULT_CONTENT,
                pageId: values.pageId ?? null,
            });
            if (created.hasError || !created.value) return created;
            const extraOps = JsonPatch.fromValues(ObjectMapper.pick(values, ['tags', 'related']));
            if (extraOps.length > 0) await api.catalog.article.update(created.value, extraOps);
            if (extraOps.some(op => op.path.startsWith('/tags')))
                await queryClient.invalidateQueries({ queryKey: dnBuildListKey('Tag') });
            return created;
        },
        [api.catalog.article, queryClient]
    );

    return (
        <DnEntityEditView<ArticleDto>
            entityName="Article"
            identifier={{ singular: 'article', plural: 'articles', gender: 'm' }}
            identifierAccessor="title"
            redirectPath="/content-manager/articles"
            tabs={[
                {
                    key: 'general',
                    label: 'Général',
                    content: <ArticleTabGeneral />,
                },
                {
                    key: 'article',
                    label: 'Article',
                    content: <ArticleTabContent />,
                },
            ]}
            onUpdate={handleUpdate}
            onCreate={handleCreate}
            validate={validate}
        />
    );
}
