import type { TagDto } from '@digital-net-org/digital-api-sdk';
import { useNavigate } from 'react-router';
import { DnEntityListView, type DnEntityListViewProps } from '../../entity';

const staticProps: DnEntityListViewProps<TagDto> = {
    title: 'Tags',
    description: 'Gérez les tags utilisés par les articles.',
    identifier: { singular: 'tag', plural: 'tags', gender: 'm' },
    identifierAccessor: 'name',
    columns: [
        { key: 'name', label: 'Nom' },
        { key: 'color', label: 'Couleur' },
    ],
    entityName: 'Tag',
    filters: [{ type: 'like', key: 'name', label: 'Nom', placeholder: 'marketing, design...' }],
};

export function TagListView() {
    const navigate = useNavigate();
    return (
        <DnEntityListView
            {...staticProps}
            onRowClick={row => navigate(`/content-manager/tags/${row.id}`)}
            onCreate={() => navigate('new')}
        />
    );
}
