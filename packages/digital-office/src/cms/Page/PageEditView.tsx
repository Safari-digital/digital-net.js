import * as React from 'react';
import {
    JsonPatch,
    type OpenGraphEntry,
    type PageDto,
    type PageSheet,
    type SchemaProperty,
    schemaValidation,
} from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../../api';
import { DnEntityEditView, isCollectionValid, useDnEntitySchema } from '../../entity';
import { PageTabGeneral, PageTabJsonLd, PageTabOpenGraph, PageTabSheets } from './Tabs';

export function PageEditView() {
    const api = useDigitalNetApi();

    const { schemas: sheetSchemas, loading: sheetSchemaLoading } = useDnEntitySchema('pageSheet');
    const { schemas: ogSchemas, loading: ogSchemaLoading } = useDnEntitySchema('openGraphEntry');
    const validate = React.useCallback(
        (values: Partial<PageDto>, pageSchemas: SchemaProperty[]) => {
            const missing = schemaValidation(values, pageSchemas);
            const sheets = (values as { sheets?: PageSheet[] }).sheets;
            const openGraph = (values as { openGraph?: OpenGraphEntry[] }).openGraph;
            if (sheets?.length && (sheetSchemaLoading || !isCollectionValid(sheets, sheetSchemas)))
                missing.add('sheets');
            if (openGraph?.length && (ogSchemaLoading || !isCollectionValid(openGraph, ogSchemas)))
                missing.add('openGraph');
            return missing;
        },
        [sheetSchemas, sheetSchemaLoading, ogSchemas, ogSchemaLoading]
    );

    const handleCreate = React.useCallback(
        async (values: Partial<PageDto>) => {
            const created = await api.catalog.page.create({ path: String(values.path ?? '') });
            if (created.hasError || !created.value) return created;
            const extraOps = JsonPatch.fromValues(values, { omit: ['path', 'media'] });
            if (extraOps.length > 0) await api.catalog.page.update(created.value, extraOps);
            return created;
        },
        [api.catalog.page]
    );

    return (
        <DnEntityEditView<PageDto>
            entityName="page"
            identifier={{ singular: 'page', plural: 'pages', gender: 'f' }}
            identifierAccessor="path"
            draftStoreName="pages"
            redirectPath="/content-manager/pages"
            tabs={[
                {
                    key: 'general',
                    label: 'Général',
                    content: <PageTabGeneral />,
                },
                {
                    key: 'jsonld',
                    label: 'JSON-LD',
                    content: <PageTabJsonLd />,
                },
                {
                    key: 'opengraph',
                    label: 'OpenGraph',
                    content: <PageTabOpenGraph />,
                },
                {
                    key: 'sheets',
                    label: 'Sheets',
                    content: <PageTabSheets />,
                },
            ]}
            validate={validate}
            onCreate={handleCreate}
        />
    );
}
