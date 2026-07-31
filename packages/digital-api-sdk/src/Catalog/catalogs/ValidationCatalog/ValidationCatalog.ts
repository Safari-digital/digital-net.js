import { CatalogRunner } from '../../CatalogRunner';
import type { HttpClient } from '../../../HttpClient';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';

export const DN_API_VALIDATION_PATTERN_EMAIL = 'validation/pattern/email' as const;
export const DN_API_VALIDATION_PATTERN_USERNAME = 'validation/pattern/username' as const;
export const DN_API_VALIDATION_PATTERN_PASSWORD = 'validation/pattern/password' as const;
export const DN_API_VALIDATION_PATTERN_API_KEY_NAME = 'validation/pattern/api-key-name' as const;
export const DN_API_VALIDATION_SIZE_AVATAR = 'validation/size/avatar' as const;

export class ValidationCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /** GET `validation/pattern/email` — email validation regex (public) */
    public async getEmailPattern(options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { path: DN_API_VALIDATION_PATTERN_EMAIL, skipAuth: true }, options);
    }

    /** GET `validation/pattern/username` — username validation regex */
    public async getUsernamePattern(options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { path: DN_API_VALIDATION_PATTERN_USERNAME }, options);
    }

    /** GET `validation/pattern/password` — password validation regex */
    public async getPasswordPattern(options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { path: DN_API_VALIDATION_PATTERN_PASSWORD }, options);
    }

    /** GET `validation/pattern/api-key-name` — API key name validation regex */
    public async getApiKeyNamePattern(options: CatalogCallbacks<string> = {}): Promise<Result<string>> {
        return CatalogRunner.run<string>(this.http, { path: DN_API_VALIDATION_PATTERN_API_KEY_NAME }, options);
    }

    /** GET `validation/size/avatar` — maximum allowed avatar size in bytes */
    public async getAvatarSizeLimit(options: CatalogCallbacks<number> = {}): Promise<Result<number>> {
        return CatalogRunner.run<number>(this.http, { path: DN_API_VALIDATION_SIZE_AVATAR }, options);
    }
}
