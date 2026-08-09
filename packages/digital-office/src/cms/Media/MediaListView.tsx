import * as React from 'react';
import type { MediaDto } from '@digital-net-org/digital-api-sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { dnBuildListKey } from '../../api';
import { DnEntityListView, type DnEntityListViewProps } from '../../entity';
import { type DnColumnDefinition } from '../../ui';
import { formatDimensions, formatFileSize } from '../../ui/format';
import { DnMediaImportDialog } from './DnMediaImportDialog';
import { MediaPreview } from './MediaPreview';

const staticProps: DnEntityListViewProps<MediaDto> = {
    title: 'Médias',
    description: 'Gérez les images uploadées dans le backoffice.',
    identifier: { singular: 'média', plural: 'médias', gender: 'm' },
    identifierAccessor: 'name',
    entityName: 'Media',
    filters: [
        { type: 'like', key: 'name', label: 'Nom', placeholder: 'logo, banner…' },
        { type: 'boolean', key: 'published', label: 'Publiés uniquement' },
    ],
};

export function MediaListView() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [importOpen, setImportOpen] = React.useState(false);

    const columns = React.useMemo<DnColumnDefinition<MediaDto>[]>(
        () => [
            {
                kind: 'computed',
                key: 'preview',
                label: 'Aperçu',
                compute: row => <MediaPreview variant="list" mediaId={row.id} alt={row.alt ?? ''} />,
            },
            { key: 'name', label: 'Nom' },
            {
                kind: 'computed',
                key: 'dimensions',
                label: 'Dimensions',
                compute: row => formatDimensions(row.width, row.height),
            },
            {
                kind: 'computed',
                key: 'fileSize',
                label: 'Taille',
                compute: row => formatFileSize(row.fileSize),
            },
            { key: 'published', label: 'Publié' },
        ],
        []
    );

    return (
        <React.Fragment>
            <DnEntityListView
                {...staticProps}
                columns={columns}
                onRowClick={row => navigate(`/content-manager/media/${row.id}`)}
                onCreate={() => setImportOpen(true)}
            />
            <DnMediaImportDialog
                open={importOpen}
                onClose={() => setImportOpen(false)}
                onUploaded={() => queryClient.invalidateQueries({ queryKey: dnBuildListKey('Media') })}
            />
        </React.Fragment>
    );
}
