import type { UserDto } from '@digital-net-org/digital-api-sdk';
import { useNavigate } from 'react-router';
import { DnEntityListView, type DnEntityListViewProps } from '../entity';

const staticProps: DnEntityListViewProps<UserDto> = {
    title: 'Gestion des utilisateurs du back-office',
    description: 'Créez, modifiez ou supprimez des utilisateurs et gérez leurs accès.',
    identifier: { singular: 'utilisateur', plural: 'utilisateurs', gender: 'm' },
    identifierAccessor: 'username',
    columns: [
        { key: 'username', label: "Nom d'utilisateur" },
        { key: 'email', label: 'E-mail' },
        { key: 'isActive', label: 'Actif' },
        { key: 'isAdmin', label: 'Administrateur' },
    ],
    entityName: 'User',
    filters: [
        { type: 'boolean', key: 'isactive', label: 'Actif uniquement' },
        { type: 'like', key: 'username', label: "Nom d'utilisateur", placeholder: 'Benoit...' },
        {
            type: 'select',
            key: 'isAdmin',
            label: 'Rôle',
            options: [
                { value: 'true', label: 'Administrateur' },
                { value: 'false', label: 'Utilisateur' },
            ],
        },
    ],
};

export function UserListView() {
    const navigate = useNavigate();
    return <DnEntityListView {...staticProps} onRowClick={row => navigate(`/admin/user/${row.id}`)} protectedDelete />;
}
