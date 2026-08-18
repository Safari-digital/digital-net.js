import type { PagePublicDto, PageSheetResourceDto } from '../../../Dto';
import type { HttpClient } from '../../../HttpClient';
import type { Result } from '../../../Result';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';
import type { PageBuildPayload } from './types';

export const DN_API_PAGE_PUBLIC_BUILD = 'cms/pages/public/build' as const;
export const DN_API_PAGE_PUBLIC_BUILD_SHEETS = 'cms/pages/public/build/sheets' as const;

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

}
