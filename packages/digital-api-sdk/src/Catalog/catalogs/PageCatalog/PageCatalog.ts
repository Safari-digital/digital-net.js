import type {
    OpenGraphEntry,
    OpenGraphPropertySchema,
    PageDto,
    PageEntityType,
    PageSheet,
    TemplateVariable,
} from '../../../Dto';
import type { HttpClient } from '../../../HttpClient';
import type { JsonPatchOp } from '../../../JsonPatch';
import type { Result } from '../../../Result';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';
import { PagePublicCatalog } from './PagePublicCatalog';
import type { PagePayload } from './types';

export const DN_API_PAGE = 'cms/pages' as const;
export const DN_API_PAGE_BY_ID = 'cms/pages/:id' as const;
export const DN_API_PAGE_PATH_AVAILABILITY = 'cms/pages/path/availability' as const;
export const DN_API_PAGE_OG_SCHEMA = 'cms/pages/open-graph-values/schema' as const;
export const DN_API_PAGE_OPENGRAPH = 'cms/pages/:id/open-graph' as const;
export const DN_API_PAGE_SHEETS = 'cms/pages/:id/sheets' as const;
export const DN_API_PAGE_TEMPLATE_VARIABLES = 'cms/pages/template-variables/:entityType' as const;

export class PageCatalog {
    private readonly http: HttpClient;

    /** Public, unauthenticated-friendly page rendering — `cms/pages/public/*`. */
    public readonly public: PagePublicCatalog;

    public constructor(http: HttpClient) {
        this.http = http;
        this.public = new PagePublicCatalog(http);
    }

    /** GET `cms/pages/:id` */
    public async getById(id: string, options: CatalogCallbacks<PageDto> = {}): Promise<Result<PageDto>> {
        return CatalogRunner.run<PageDto>(this.http, { path: DN_API_PAGE_BY_ID, slugs: { id } }, options);
    }

    /** POST `cms/pages` — body accepts `{ path, entityType? }`. Returns the new id. */
    public async create(payload: PagePayload, options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { method: 'POST', path: DN_API_PAGE, body: payload }, options);
    }

    /** GET `cms/pages/path/availability?path=...&excludeId=...` */
    public async checkAvailability(
        path: string,
        excludeId?: string,
        options: CatalogCallbacks<boolean> & { signal?: AbortSignal } = {}
    ): Promise<Result<boolean>> {
        const { signal, ...cbs } = options;
        return CatalogRunner.run<boolean>(
            this.http,
            {
                path: DN_API_PAGE_PATH_AVAILABILITY,
                params: { path, ...(excludeId ? { excludeId } : {}) },
                signal,
            },
            cbs
        );
    }

    /** PATCH `cms/pages/:id` — body = JSON Patch (RFC 6902) */
    public async update(id: string, ops: JsonPatchOp[], options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PATCH',
                path: DN_API_PAGE_BY_ID,
                slugs: { id },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }

    /** DELETE `cms/pages/:id` */
    public async delete(id: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,

            { method: 'DELETE', path: DN_API_PAGE_BY_ID, slugs: { id } },
            options
        );
    }

    /** GET `cms/pages/open-graph-values/schema` — Returns the list of valid OpenGraph properties. */
    public async getOpenGraphSchema(
        options: CatalogCallbacks<OpenGraphPropertySchema[]> = {}
    ): Promise<Result<OpenGraphPropertySchema[]>> {
        return CatalogRunner.run<OpenGraphPropertySchema[]>(this.http, { path: DN_API_PAGE_OG_SCHEMA }, options);
    }

    /** GET `cms/pages/:id/sheets` — Editable sheet list owned by the page (ordered). */
    public async getSheetsForEdit(
        id: string,
        options: CatalogCallbacks<PageSheet[]> = {}
    ): Promise<Result<PageSheet[]>> {
        return CatalogRunner.run<PageSheet[]>(this.http, { path: DN_API_PAGE_SHEETS, slugs: { id } }, options);
    }

    /** GET `cms/pages/:id/open-graph` — Editable OpenGraph entries owned by the page (ordered). */
    public async getOpenGraphForEdit(
        id: string,
        options: CatalogCallbacks<OpenGraphEntry[]> = {}
    ): Promise<Result<OpenGraphEntry[]>> {
        return CatalogRunner.run<OpenGraphEntry[]>(this.http, { path: DN_API_PAGE_OPENGRAPH, slugs: { id } }, options);
    }

    /**
     * GET `cms/pages/template-variables/:entityType` — Lists `{{ source.field }}` placeholders
     * exposed for a given PageEntityType. Empty when the entity exposes no `[Templatable]`
     * field.
     */
    public async getTemplateVariables(
        entityType: PageEntityType,
        options: CatalogCallbacks<TemplateVariable[]> = {}
    ): Promise<Result<TemplateVariable[]>> {
        return CatalogRunner.run<TemplateVariable[]>(
            this.http,
            { path: DN_API_PAGE_TEMPLATE_VARIABLES, slugs: { entityType } },
            options
        );
    }
}
