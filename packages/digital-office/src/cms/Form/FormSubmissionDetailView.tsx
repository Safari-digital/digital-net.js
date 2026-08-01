import * as React from 'react';
import { ArrowBack as ArrowBackIcon, DeleteOutlined as DeleteIcon } from '@mui/icons-material';
import { Box, Breadcrumbs, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import type { FormDto, FormFieldDto } from '@digital-net-org/digital-api-sdk';
import { dnBuildKeyFromId, useDigitalNetApi } from '../../api';
import { NotFoundView, useDnToast } from '../../app';
import { DnLoadingView, DnView } from '../../ui';
import { formatDate } from '../../ui/format';

function parseValues(json: string): Record<string, string | null> {
    try {
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, string | null>;
    } catch {
        // ignore
    }
    return {};
}

function renderValue(field: FormFieldDto, raw: string | null | undefined): React.ReactNode {
    if (raw === null || raw === undefined || raw === '') {
        return (
            <Typography variant="body2" color="text.secondary">
                (vide)
            </Typography>
        );
    }
    if (field.type === 'checkbox') {
        return <Typography variant="body2">{raw === 'true' ? 'Oui' : 'Non'}</Typography>;
    }
    return (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {raw}
        </Typography>
    );
}

export function FormSubmissionDetailView() {
    const { formId, id } = useParams<{ formId: string; id: string }>();
    const navigate = useNavigate();
    const api = useDigitalNetApi();
    const queryClient = useQueryClient();
    const { showToast } = useDnToast();

    const submissionQuery = useQuery({
        queryKey: dnBuildKeyFromId('formSubmission', id!),
        queryFn: async () => {
            const result = await api.catalog.form.getSubmissionById(id!);
            if (result.hasError) throw new Error(result.errors?.[0]?.message ?? 'Failed to fetch submission');
            return result.value;
        },
        enabled: !!id,
        retry: false,
    });

    const formQuery = useQuery({
        queryKey: dnBuildKeyFromId('form', formId!),
        queryFn: async () => {
            const result = await api.catalog.crud.getById<FormDto>('form', formId!);
            if (result.hasError) throw new Error(result.errors?.[0]?.message ?? 'Failed to fetch form');
            return result.value;
        },
        enabled: !!formId,
        retry: false,
    });

    const handleDelete = React.useCallback(async () => {
        if (!id || !formId) return;
        const result = await api.catalog.form.deleteSubmission(id);
        if (result.hasError) {
            showToast('Erreur lors de la suppression', 'error');
            return;
        }
        showToast('Soumission supprimée', 'info');
        await queryClient.invalidateQueries({ queryKey: dnBuildKeyFromId('formSubmission', id) });
        navigate(`/content-manager/forms/${formId}`);
    }, [api.catalog, formId, id, navigate, queryClient, showToast]);

    if (submissionQuery.isLoading || formQuery.isLoading) return <DnLoadingView />;
    if (submissionQuery.isError || formQuery.isError || !submissionQuery.data || !formQuery.data) {
        return <NotFoundView />;
    }

    const submission = submissionQuery.data;
    const form = formQuery.data;
    const values = parseValues(submission.valuesJson);
    const displayFields = form.fields
        .filter(field => field.type !== 'message')
        .sort((a, b) => a.sortOrder - b.sortOrder);
    const shortId = submission.id.slice(0, 8);

    return (
        <DnView title={`Soumission #${shortId}`} description={`Reçue le ${formatDate(submission.createdAt)}`}>
            <Stack sx={{ gap: 2, pt: 2, overflowY: 'auto' }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Retour">
                        <IconButton onClick={() => navigate(`/content-manager/forms/${formId}`)}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                    <Breadcrumbs sx={{ flex: 1 }}>
                        <Typography
                            component="a"
                            variant="body2"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate('/content-manager/forms')}
                        >
                            Formulaires
                        </Typography>
                        <Typography
                            component="a"
                            variant="body2"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/content-manager/forms/${formId}`)}
                        >
                            {form.name}
                        </Typography>
                        <Typography variant="body2">Soumission #{shortId}</Typography>
                    </Breadcrumbs>
                    <Tooltip title="Supprimer la soumission">
                        <IconButton onClick={handleDelete} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <Box sx={{ borderRadius: 1, p: 2, bgcolor: 'action.hover' }}>
                    <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
                        <Stack>
                            <Typography variant="caption" color="text.secondary">
                                Adresse IP
                            </Typography>
                            <Typography variant="body2">{submission.submitterIp ?? '—'}</Typography>
                        </Stack>
                        <Stack sx={{ flex: 1, minWidth: 200 }}>
                            <Typography variant="caption" color="text.secondary">
                                User-Agent
                            </Typography>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {submission.userAgent ?? '—'}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>

                <Stack sx={{ gap: 1.5 }}>
                    {displayFields.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            Ce formulaire n&apos;a aucun champ saisissable.
                        </Typography>
                    )}
                    {displayFields.map(field => (
                        <Stack key={field.id} sx={{ gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                {field.label}
                            </Typography>
                            {renderValue(field, values[field.name] ?? null)}
                        </Stack>
                    ))}
                </Stack>
            </Stack>
        </DnView>
    );
}
