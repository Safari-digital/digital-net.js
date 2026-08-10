import type { PagePublicDto, PageSheetInfoDto, PageSheetResourceDto } from '../../../Dto';
import type { HttpClient } from '../../../HttpClient';
import type { Result } from '../../../Result';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';
import type { PageBuildPayload, PageSheetBuildPayload } from './types';

export const DN_API_PAGE_PUBLIC_BUILD = 'cms/pages/public/build' as const;
export const DN_API_PAGE_PUBLIC_BUILD_SHEETS = 'cms/pages/public/build/sheets' as const;
export const DN_API_PAGE_PUBLIC_BUILD_SHEET = 'cms/pages/public/build/sheet' as const;
export const DN_API_PAGE_PUBLIC_SHEETS = 'cms/pages/public/:id/sheets' as const;

export class PagePublicCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** POST `cms/pages/public/build` — builds a published page for the declared templated path  */
    public async build(
        payload: PageBuildPayload,
        options: CatalogCallbacks<PagePublicDto> = {}
    ): Promise<Result<PagePublicDto>> {
        return CatalogRunner.run<PagePublicDto>(
            this.http,
            { method: 'POST', path: DN_API_PAGE_PUBLIC_BUILD, body: payload },
            options
        );
    }

    /**
     * POST `cms/pages/public/build/sheets` — builds every published sheet of the page, inheritance
     * applied and content interpolated, ordered by load order. One round-trip instead of one per sheet.
     */
    public async buildSheets(
        payload: PageBuildPayload,
        options: CatalogCallbacks<PageSheetResourceDto[]> = {}
    ): Promise<Result<PageSheetResourceDto[]>> {
        return CatalogRunner.run<PageSheetResourceDto[]>(
            this.http,
            { method: 'POST', path: DN_API_PAGE_PUBLIC_BUILD_SHEETS, body: payload },
            options
        );
    }

    /**
     * POST `cms/pages/public/build/sheet` — builds a published sheet resource
     *
     * On success the endpoint returns the RAW sheet content with its own Content-Type
     * (css/js/html), NOT a `Result<…>` envelope — so the body string is returned directly.
     */
    public async buildSheet(payload: PageSheetBuildPayload): Promise<string> {
        const res = await this.http.request<string>({
            method: 'POST',
            path: DN_API_PAGE_PUBLIC_BUILD_SHEET,
            body: payload,
        });
        return res.data;
    }

    /** GET `cms/pages/public/:id/sheets` — published sheet infos owned by the page (ordered)  */
    public async getSheets(
        id: string,
        options: CatalogCallbacks<PageSheetInfoDto[]> = {}
    ): Promise<Result<PageSheetInfoDto[]>> {
        return CatalogRunner.run<PageSheetInfoDto[]>(
            this.http,
            { path: DN_API_PAGE_PUBLIC_SHEETS, slugs: { id } },
            options
        );
    }
}
