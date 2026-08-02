import * as React from 'react';
import { Stack } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { FormDto, FormSubmissionDto } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, useDigitalNetApi } from '../../../api';
import { useDnToast } from '../../../app';
import { useDnEntityFormContext } from '../../../entity';
import { type DnColumnDefinition, DnEntityTable, type DnPaginationState } from '../../../ui';
import { formatDate, formatEllipsis } from '../../../ui/format';

const columns: DnColumnDefinition<FormSubmissionDto>[] = [
    { kind: 'computed', key: 'createdAt', label: 'Reçue le', compute: row => formatDate(row.createdAt) },
    { kind: 'computed', key: 'submitterIp', label: 'Adresse IP', compute: row => formatEllipsis(row.submitterIp, 60) },
    { kind: 'computed', key: 'userAgent', label: 'User-Agent', compute: row => formatEllipsis(row.userAgent, 60) },
];

export function FormTabSubmissions() {
    const navigate = useNavigate();
    const { values } = useDnEntityFormContext<FormDto>();
    const formId = values.id;
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();
    const { showToast } = useDnToast();

    const [pagination, setPagination] = React.useState<DnPaginationState>({
        page: 0,
        rowsPerPage: 10,
        totalRows: 0,
    });

    const { data, isLoading } = useQuery({
        queryKey: [...dnBuildKeyFromId('Form', formId!), 'submissions', pagination.page, pagination.rowsPerPage],
        queryFn: async () => {
            const result = await api.catalog.form.getSubmissions({
                formId,
                index: pagination.page + 1,
                size: pagination.rowsPerPage,
            });
            if (result.errors?.length) {
                throw new Error(result.errors[0]?.message ?? 'Failed to fetch submissions');
            }
            return result;
        },
        enabled: !!formId,
    });

    const handleDelete = React.useCallback(
        async (ids: Set<string>) => {
            const results = await Promise.all([...ids].map(id => api.catalog.form.deleteSubmission(id)));
            if (results.some(r => r.hasError)) {
                showToast('Erreur lors de la suppression', 'error');
                return false;
            }
            showToast(`${ids.size} soumission${ids.size > 1 ? 's' : ''} supprimée${ids.size > 1 ? 's' : ''}`, 'info');
            await queryClient.invalidateQueries({ queryKey: [...dnBuildKeyFromId('Form', formId!), 'submissions'] });
            return true;
        },
        [api.catalog.form, formId, queryClient, showToast]
    );

    if (!formId) return null;

    const rows = data?.value ?? [];
    const totalRows = data?.total ?? 0;

    return (
        <Stack sx={{ gap: 2, height: '100%' }}>
            <DnEntityTable<FormSubmissionDto>
                rows={rows}
                columns={columns}
                pagination={{ ...pagination, totalRows }}
                onPaginationChange={setPagination}
                onRowClick={row => navigate(`/content-manager/forms/${formId}/submissions/${row.id}`)}
                onDelete={handleDelete}
                loading={isLoading}
            />
        </Stack>
    );
}
