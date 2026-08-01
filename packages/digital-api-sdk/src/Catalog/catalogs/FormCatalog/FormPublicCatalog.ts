import type { FormPublicDto } from '../../../Dto';
import type { HttpClient } from '../../../HttpClient';
import type { Result } from '../../../Result';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';
import type { FormSubmitPayload } from './types';

export const DN_API_FORM_PUBLIC_DEFINITION = 'cms/forms/public/:id/definition' as const;
export const DN_API_FORM_PUBLIC_BY_PATH = 'cms/forms/public/by-path' as const;
export const DN_API_FORM_PUBLIC_SUBMIT = 'cms/forms/public/:id/submit' as const;

export class FormPublicCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** GET `cms/forms/public/:id/definition` — full definition of a published form  */
    public async getDefinition(
        id: string,
        options: CatalogCallbacks<FormPublicDto> = {}
    ): Promise<Result<FormPublicDto>> {
        return CatalogRunner.run<FormPublicDto>(
            this.http,
            { path: DN_API_FORM_PUBLIC_DEFINITION, slugs: { id } },
            options
        );
    }

    /** GET `cms/forms/public/by-path?path=…` — a single published form resolved by its public path  */
    public async getDefinitionByPath(
        path: string,
        options: CatalogCallbacks<FormPublicDto> = {}
    ): Promise<Result<FormPublicDto>> {
        return CatalogRunner.run<FormPublicDto>(
            this.http,
            { path: DN_API_FORM_PUBLIC_BY_PATH, params: { path } },
            options
        );
    }

    /** POST `cms/forms/public/:id/submit` — submit values for a published form (validated server-side)  */
    public async submit(id: string, payload: FormSubmitPayload, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            { method: 'POST', path: DN_API_FORM_PUBLIC_SUBMIT, slugs: { id }, body: payload },
            options
        );
    }
}
