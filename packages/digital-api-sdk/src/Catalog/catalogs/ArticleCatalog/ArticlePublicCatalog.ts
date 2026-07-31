import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { ArticlePublicDto, ArticlePublicListDto } from '../../../Dto';
import type { QueryResult, Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import type { ArticlePublicQuery } from './types';

export const DN_API_ARTICLE_PUBLIC = 'cms/articles/public' as const;
export const DN_API_ARTICLE_PUBLIC_BY_SLUG = 'cms/articles/public/slug/:slug' as const;

export class ArticlePublicCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * GET `cms/articles/public` — paginated published articles
     *
     * Returns the *flat* `QueryResult` directly (see `FormCatalog.getList`): `value` is the page
     * of items; `total`/`index`/`size` sit alongside it — it is NOT wrapped in a `Result<…>`.
     */
    public async getList(query: ArticlePublicQuery = {}): Promise<QueryResult<ArticlePublicListDto>> {
        const res = await this.http.request<QueryResult<ArticlePublicListDto>>({
            path: DN_API_ARTICLE_PUBLIC,
            params: query as Record<string, unknown>,
        });
        return res.data;
    }

    /** GET `cms/articles/public/slug/:slug` — a single published article by slug  */
    public async getBySlug(
        slug: string,
        options: CatalogCallbacks<ArticlePublicDto> = {}
    ): Promise<Result<ArticlePublicDto>> {
        return CatalogRunner.run<ArticlePublicDto>(
            this.http,
            { path: DN_API_ARTICLE_PUBLIC_BY_SLUG, slugs: { slug } },
            options
        );
    }
}
