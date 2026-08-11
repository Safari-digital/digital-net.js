import type { SitemapEntryDto } from '../../../Dto';
import type { HttpClient } from '../../../HttpClient';
import type { Result } from '../../../Result';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';

export const DN_API_SITEMAP_DATA = 'cms/sitemaps/data' as const;

export class SitemapCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * GET `cms/sitemaps/data` — published & indexed pages for sitemap generation. Templates are left
     * out: a path carrying a dynamic slug is a pattern, not an address.
     */
    public async getData(options: CatalogCallbacks<SitemapEntryDto[]> = {}): Promise<Result<SitemapEntryDto[]>> {
        return CatalogRunner.run<SitemapEntryDto[]>(this.http, { path: DN_API_SITEMAP_DATA }, options);
    }
}
