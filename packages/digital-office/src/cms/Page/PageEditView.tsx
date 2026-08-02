import * as React from 'react';
import { JsonPatch, type PageDto } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../../api';
import { DnEntityEditView } from '../../entity';
import { PageTabGeneral, PageTabJsonLd, PageTabOpenGraph, PageTabSheets } from './Tabs';

export function PageEditView() {
    const api = useDigitalNetApi();

    const handleCreate = React.useCallback(
        async (values: Partial<PageDto>) => {
            const created = await api.catalog.page.create({ path: String(values.path ?? '') });
            if (created.hasError || !created.value) return created;
            const extraOps = JsonPatch.fromValues(values, { omit: ['path'] });
            if (extraOps.length > 0) await api.catalog.page.update(created.value, extraOps);
            return created;
        },
        [api.catalog.page]
    );

    return (
        <DnEntityEditView<PageDto>
            entityName="Page"
            identifier={{ singular: 'page', plural: 'pages', gender: 'f' }}
            identifierAccessor="path"
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
            onCreate={handleCreate}
        />
    );
}
