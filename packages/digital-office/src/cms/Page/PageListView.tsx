import { useNavigate } from 'react-router';
import type { PageListDto } from '@digital-net-org/digital-api-sdk';
import { DnEntityListView, type DnEntityListViewProps } from '../../entity';

const staticProps: DnEntityListViewProps<PageListDto> = {
    title: 'Pages',
    description: 'Gérez les méta-données, les redirections, les scripts ou feuilles de style des pages du site.',
    identifier: { singular: 'page', plural: 'pages', gender: 'f' },
    identifierAccessor: 'path',
    columns: [
        { key: 'path', label: 'Chemin' },
        { key: 'title', label: 'Titre' },
        { key: 'indexed', label: 'Indexée' },
        { key: 'published', label: 'Publiée' },
    ],
    entityName: 'Page',
    filters: [
        { type: 'like', key: 'path', label: 'Chemin', placeholder: '/blog/...' },
        { type: 'boolean', key: 'published', label: 'Publiées uniquement' },
        { type: 'boolean', key: 'indexed', label: 'Indexées uniquement' },
    ],
};

export function PageListView() {
    const navigate = useNavigate();
    return (
        <DnEntityListView
            {...staticProps}
            onRowClick={row => navigate(`/content-manager/pages/${row.id}`)}
            onCreate={() => navigate('new')}
        />
    );
}
