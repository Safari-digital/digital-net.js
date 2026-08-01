import * as React from 'react';
import { type TagDto } from '@digital-net-org/digital-api-sdk';
import { useDigitalNetApi } from '../../api';
import { DnEntityEditView } from '../../entity';
import { TagFormGeneral } from './TagFormGeneral';

export function TagEditView() {
    const api = useDigitalNetApi();

    const handleCreate = React.useCallback(
        async (values: Partial<TagDto>) => {
            const created = await api.catalog.tag.create({
                name: String(values.name ?? ''),
                color: values.color ?? null,
            });
            return created;
        },
        [api.catalog.tag]
    );

    return (
        <DnEntityEditView<TagDto>
            entityName="tag"
            identifier={{ singular: 'tag', plural: 'tags', gender: 'm' }}
            identifierAccessor="name"
            draftStoreName="tags"
            redirectPath="/content-manager/tags"
            tabs={[
                {
                    key: 'general',
                    label: 'Général',
                    content: <TagFormGeneral />,
                },
            ]}
            onCreate={handleCreate}
        />
    );
}
