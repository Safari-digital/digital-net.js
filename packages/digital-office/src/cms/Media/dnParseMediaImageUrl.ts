export interface DnParsedMediaImageUrl {
    id: string;
    extension: string;
}

// Mirrors the site's rewriteContentImages regex: matches /cms/media/image/{guid}.{ext} with an
// optional origin and ignores any query string.
const MEDIA_IMAGE_URL_REGEX = /\/cms\/media\/image\/([0-9a-fA-F-]{36})\.([a-z0-9]+)/i;

export function dnParseMediaImageUrl(src: string): DnParsedMediaImageUrl | null {
    const match = MEDIA_IMAGE_URL_REGEX.exec(src);
    if (!match) return null;
    const [, id, extension] = match;
    if (!id || !extension) return null;
    return { id, extension };
}
