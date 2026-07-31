import { Box } from '@mui/material';
import type { DnEditorRichTextImageAttrs } from '../../ui';
import { useDigitalNetApi } from '../../api';
import { parseMediaImageUrl } from './parseMediaImageUrl';

export type MediaContentImageProps = DnEditorRichTextImageAttrs;

export function MediaContentImage({ src, alt }: MediaContentImageProps) {
    const api = useDigitalNetApi();
    const parsed = parseMediaImageUrl(src);
    const resolved = parsed
        ? api.catalog.media.getImageUrl(parsed.id, { width: 1200, extension: parsed.extension })
        : src;

    return (
        <Box
            component="img"
            src={resolved}
            alt={alt}
            loading="lazy"
            decoding="async"
            sx={{ maxWidth: '100%', display: 'block' }}
        />
    );
}
