import * as React from 'react';
import { Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { MediaDto } from '@digital-net-org/digital-api-sdk';
import { useCustomNode } from '../../../app';
import {
    DnEntityAuditBlock,
    DnEntityForm,
    type DnEntityFormProps,
    useDnEntityFormContext,
    useDnEntitySchema,
} from '../../../entity';
import { formatDate, formatDimensions, formatFileSize } from '../../../ui/format';
import { MediaPreview } from '../MediaPreview';

const fieldProps: DnEntityFormProps['fieldProps'] = {
    Name: {
        label: 'Nom',
        helperText: 'Nom éditorial affiché dans la liste des médias.',
    },
    Alt: {
        label: 'Texte alternatif',
        helperText: 'Description courte de l\'image pour l\'accessibilité (attribut "alt").',
    },
    Published: {
        label: 'Publié',
        helperText: "Si décoché, le média n'est pas servi publiquement.",
    },
};

export function MediaTabGeneral() {
    const { schemas } = useDnEntitySchema('media');
    const { values, setField, errors, disabled } = useDnEntityFormContext<MediaDto>();
    const { renderCustomNode } = useCustomNode();

    return (
        <Stack spacing={3}>
            {renderCustomNode({ entity: 'media', view: 'edit:tab:general:before' })}
            {values.id ? (
                <Stack direction="row" spacing={3} sx={{ alignItems: 'flex-start' }}>
                    <MediaPreview mediaId={values.id} alt={values.alt ?? ''} />
                    <MetadataList>
                        <MetadataRow label="Dimensions" value={formatDimensions(values.width, values.height)} />
                        <MetadataRow label="Taille du fichier" value={formatFileSize(values.fileSize ?? 0)} />
                        <MetadataRow label="Type MIME" value={values.mimeType ?? '—'} />
                        <MetadataRow label="Date d'upload" value={formatDate(values.createdAt)} />
                    </MetadataList>
                </Stack>
            ) : null}
            <DnEntityForm
                schemas={schemas}
                fieldProps={fieldProps}
                values={values as Record<string, unknown>}
                onFieldChange={setField}
                errors={errors}
                disabled={disabled}
            />
            {renderCustomNode({ entity: 'media', view: 'edit:tab:general:after' })}
            <DnEntityAuditBlock entity={values} />
        </Stack>
    );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
    return (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline' }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140, fontWeight: 500 }}>
                {label}
            </Typography>
            <Typography variant="body2">{value}</Typography>
        </Stack>
    );
}

const MetadataList = styled(Stack)(({ theme }) => ({
    flex: 1,
    gap: theme.spacing(1),
    paddingTop: theme.spacing(1),
}));
