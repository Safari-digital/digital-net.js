import * as React from 'react';
import { Box } from '@mui/material';
import { useDigitalNetApi } from '../../api';
import { MediaPreviewDialog } from './MediaPreviewDialog';

export type MediaPreviewVariant = 'default' | 'list';

export interface MediaPreviewProps {
    mediaId: string;
    extension?: string;
    alt?: string;
    variant?: MediaPreviewVariant;
}

interface VariantConfig {
    size: number;
    quality: number;
    borderRadius: number;
    marginY: string | number;
}

const VARIANT_CONFIG: Record<MediaPreviewVariant, VariantConfig> = {
    default: { size: 240, quality: 100, borderRadius: 8, marginY: 0 },
    list: { size: 54, quality: 100, borderRadius: 4, marginY: '.25rem' },
};

export function MediaPreview({ mediaId, extension, alt = '', variant = 'default' }: MediaPreviewProps) {
    const api = useDigitalNetApi();
    const config = VARIANT_CONFIG[variant];
    const [dialogOpen, setDialogOpen] = React.useState(false);

    const isClickable = variant === 'default';

    const src = api.catalog.media.getImageUrl(mediaId, {
        width: config.size * 2,
        quality: config.quality,
        extension,
    });

    return (
        <React.Fragment>
            <Box
                component="img"
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onClick={isClickable ? () => setDialogOpen(true) : undefined}
                sx={{
                    display: 'block',
                    height: config.size,
                    objectFit: 'cover',
                    borderRadius: `${config.borderRadius}px`,
                    my: config.marginY,
                    mx: 'auto',
                    cursor: isClickable ? 'pointer' : undefined,
                    bgcolor: 'action.hover',
                }}
            />
            {isClickable ? (
                <MediaPreviewDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    mediaId={mediaId}
                    alt={alt}
                />
            ) : null}
        </React.Fragment>
    );
}
