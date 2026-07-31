import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { ArticleDto } from '../../../Dto';
import type { JsonPatchOp } from '../../../JsonPatch';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import { ArticlePublicCatalog } from './ArticlePublicCatalog';
import type { ArticlePayload } from './types';

export const DN_API_ARTICLE = 'cms/articles' as const;
export const DN_API_ARTICLE_BY_ID = 'cms/articles/:id' as const;
export const DN_API_ARTICLE_SLUG_AVAILABILITY = 'cms/articles/slug/availability' as const;

export class ArticleCatalog {
    private readonly http: HttpClient;

    /** Public, unauthenticated-friendly reads — `cms/articles/public/*`. */
    public readonly public: ArticlePublicCatalog;

    public constructor(http: HttpClient) {
        this.http = http;
        this.public = new ArticlePublicCatalog(http);
    }

    /** GET `cms/articles/:id` */
    public async getById(id: string, options: CatalogCallbacks<ArticleDto> = {}): Promise<Result<ArticleDto>> {
        return CatalogRunner.run<ArticleDto>(this.http, { path: DN_API_ARTICLE_BY_ID, slugs: { id } }, options);
    }

    /** POST `cms/articles`. Returns the new article id. */
    public async create(payload: ArticlePayload, options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { method: 'POST', path: DN_API_ARTICLE, body: payload }, options);
    }

    /** GET `cms/articles/slug/availability?slug=...&excludeId=...` */
    public async checkSlugAvailability(
        slug: string,
        excludeId?: string,
        options: CatalogCallbacks<boolean> & { signal?: AbortSignal } = {}
    ): Promise<Result<boolean>> {
        const { signal, ...cbs } = options;
        return CatalogRunner.run<boolean>(
            this.http,
            {
                path: DN_API_ARTICLE_SLUG_AVAILABILITY,
                params: { slug, ...(excludeId ? { excludeId } : {}) },
                signal,
            },
            cbs
        );
    }

    /** PATCH `cms/articles/:id` — body = JSON Patch (RFC 6902). */
    public async update(id: string, ops: JsonPatchOp[], options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PATCH',
                path: DN_API_ARTICLE_BY_ID,
                slugs: { id },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }

    /** DELETE `cms/articles/:id` */
    public async delete(id: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            { method: 'DELETE', path: DN_API_ARTICLE_BY_ID, slugs: { id } },
            options
        );
    }
}
