export interface PageBuildPayload {
    path: string;
    /**
     * Transitional. Tells apart the sources sharing a template page, until every source owns a
     * dedicated page and the contract reduces to `path` alone.
     */
    pageSlug?: string;
}
