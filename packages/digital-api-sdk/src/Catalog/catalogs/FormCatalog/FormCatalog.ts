import type { FormDto, FormListDto, FormSubmissionDto } from '../../../Dto';
import type { HttpClient } from '../../../HttpClient';
import type { JsonPatchOp } from '../../../JsonPatch';
import type { QueryResult, Result } from '../../../Result';
import type { SchemaProperty } from '../../../Schema';
import { CatalogRunner } from '../../CatalogRunner';
import type { CatalogCallbacks } from '../../types';
import { FormPublicCatalog } from './FormPublicCatalog';
import type { FormCreatePayload, FormFieldPayload, FormQuery, FormSubmissionQuery } from './types';

export const DN_API_FORM = 'cms/forms' as const;
export const DN_API_FORM_BY_ID = 'cms/forms/:id' as const;
export const DN_API_FORM_FIELDS_SCHEMA = 'cms/forms/fields/schema' as const;
export const DN_API_FORM_FIELDS_NESTED = 'cms/forms/:formId/fields' as const;
export const DN_API_FORM_FIELD_BY_ID_NESTED = 'cms/forms/:formId/fields/:fieldId' as const;
export const DN_API_FORM_SUBMISSIONS = 'cms/forms/submissions' as const;
export const DN_API_FORM_SUBMISSION_BY_ID = 'cms/forms/submissions/:id' as const;

export class FormCatalog {
    private readonly http: HttpClient;

    /** Public, unauthenticated-friendly form access — `cms/forms/public/*`. */
    public readonly public: FormPublicCatalog;

    public constructor(http: HttpClient) {
        this.http = http;
        this.public = new FormPublicCatalog(http);
    }

    /** GET `cms/forms/:id` */
    public async getById(id: string, options: CatalogCallbacks<FormDto> = {}): Promise<Result<FormDto>> {
        return CatalogRunner.run<FormDto>(this.http, { path: DN_API_FORM_BY_ID, slugs: { id } }, options);
    }

    /**
     * GET `cms/forms` — paginated list
     *
     * The paginated endpoint returns a *flat* `QueryResult` (server-side it derives from
     * `Result`), so the body is read directly — it is NOT wrapped in an extra `Result<…>`
     * envelope. `value` is the page of items; `total`/`index`/`size` sit alongside it.
     * Mirrors `useEntityList`'s consumption of the same contract.
     */
    public async getList(query: FormQuery = {}): Promise<QueryResult<FormListDto>> {
        const res = await this.http.request<QueryResult<FormListDto>>({
            path: DN_API_FORM,
            params: query as Record<string, unknown>,
        });
        return res.data;
    }

    /** POST `cms/forms` — Returns the new form id. */
    public async create(payload: FormCreatePayload, options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { method: 'POST', path: DN_API_FORM, body: payload }, options);
    }

    /** PATCH `cms/forms/:id` — body = JSON Patch (RFC 6902) */
    public async update(id: string, ops: JsonPatchOp[], options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PATCH',
                path: DN_API_FORM_BY_ID,
                slugs: { id },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }

    /** DELETE `cms/forms/:id` */
    public async delete(id: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            { method: 'DELETE', path: DN_API_FORM_BY_ID, slugs: { id } },
            options
        );
    }

    /** GET `cms/forms/fields/schema` — Returns the FormField schema. */
    public async getFieldSchema(options: CatalogCallbacks<SchemaProperty[]> = {}): Promise<Result<SchemaProperty[]>> {
        return CatalogRunner.run<SchemaProperty[]>(this.http, { path: DN_API_FORM_FIELDS_SCHEMA }, options);
    }

    /** POST `cms/forms/:formId/fields` — Creates a field attached to the form. */
    public async createField(
        formId: string,
        payload: FormFieldPayload,
        options: CatalogCallbacks<string> = {}
    ): Promise<Result<string>> {
        return CatalogRunner.run<string>(
            this.http,
            {
                method: 'POST',
                path: DN_API_FORM_FIELDS_NESTED,
                slugs: { formId },
                body: payload,
            },
            options
        );
    }

    /** PATCH `cms/forms/:formId/fields/:fieldId` — body = JSON Patch */
    public async updateField(
        formId: string,
        fieldId: string,
        ops: JsonPatchOp[],
        options: CatalogCallbacks<null> = {}
    ): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'PATCH',
                path: DN_API_FORM_FIELD_BY_ID_NESTED,
                slugs: { formId, fieldId },
                body: ops,
                headers: { 'Content-Type': 'application/json-patch+json' },
            },
            options
        );
    }

    /** DELETE `cms/forms/:formId/fields/:fieldId` */
    public async deleteField(formId: string, fieldId: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            {
                method: 'DELETE',
                path: DN_API_FORM_FIELD_BY_ID_NESTED,
                slugs: { formId, fieldId },
            },
            options
        );
    }

    /**
     * GET `cms/forms/submissions?formId=...`
     *
     * Returns the *flat* `QueryResult` directly (see `getList`): `value` is the page of
     * submissions, `total` the row count — there is no enclosing `Result<…>` level.
     */
    public async getSubmissions(query: FormSubmissionQuery = {}): Promise<QueryResult<FormSubmissionDto>> {
        const res = await this.http.request<QueryResult<FormSubmissionDto>>({
            path: DN_API_FORM_SUBMISSIONS,
            params: query as Record<string, unknown>,
        });
        return res.data;
    }

    /** GET `cms/forms/submissions/:id` */
    public async getSubmissionById(
        id: string,
        options: CatalogCallbacks<FormSubmissionDto> = {}
    ): Promise<Result<FormSubmissionDto>> {
        return CatalogRunner.run<FormSubmissionDto>(
            this.http,
            { path: DN_API_FORM_SUBMISSION_BY_ID, slugs: { id } },
            options
        );
    }

    /** DELETE `cms/forms/submissions/:id` */
    public async deleteSubmission(id: string, options: CatalogCallbacks<null> = {}): Promise<Result> {
        return CatalogRunner.run<null>(
            this.http,
            { method: 'DELETE', path: DN_API_FORM_SUBMISSION_BY_ID, slugs: { id } },
            options
        );
    }
}
