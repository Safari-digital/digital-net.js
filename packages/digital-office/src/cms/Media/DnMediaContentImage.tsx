import { Box } from '@mui/material';
import { useDigitalNetApi } from '../../api';
import type { DnEditorRichTextImageAttrs } from '../../editor';
import { dnParseMediaImageUrl } from './dnParseMediaImageUrl';

export type DnMediaContentImageProps = DnEditorRichTextImageAttrs;

export function DnMediaContentImage({ src, alt }: DnMediaContentImageProps) {
    const api = useDigitalNetApi();
    const parsed = dnParseMediaImageUrl(src);
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
