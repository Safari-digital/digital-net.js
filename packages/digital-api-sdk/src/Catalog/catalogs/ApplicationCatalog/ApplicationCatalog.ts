import type { HttpClient } from '../../../HttpClient';
import { CatalogRunner } from '../../CatalogRunner';
import type { Result } from '../../../Result';
import type { CatalogCallbacks } from '../../types';
import type { ApplicationVersionDto } from '../../../Dto';

export const DN_API_PING = 'ping' as const;
export const DN_API_ROOT = '' as const;

export interface PingCallbacks {
    onSuccess?: () => void | Promise<void>;
    onError?: (_error: unknown) => void | Promise<void>;
}

export class ApplicationCatalog {
    private readonly http: HttpClient;

    public constructor(http: HttpClient) {
        this.http = http;
    }

    /**
     * GET `/ping` (public, out-of-schema)
     *
     * Health-check endpoint. The API responds with the plain text `"pong"`,
     * NOT wrapped in a `Result<T>`. Returns `true` when the API is reachable
     * and answered correctly, `false` otherwise. Never throws.
     */
    public async ping(options: PingCallbacks = {}): Promise<boolean> {
        try {
            const { data } = await this.http.request<string>({
                method: 'GET',
                path: DN_API_PING,
                skipAuth: true,
            });
            if (data !== 'pong') {
                await options.onError?.(new Error(`Unexpected ping response: ${String(data)}`));
                return false;
            }
            await options.onSuccess?.();
            return true;
        } catch (e) {
            await options.onError?.(e);
            return false;
        }
    }

    /**
     * GET `/` (root)
     *
     * Returns the application version: framework name and the build-time git
     * branch / tag / commit injected into the backend configuration.
     */
    public async version(
        options: CatalogCallbacks<ApplicationVersionDto> = {}
    ): Promise<Result<ApplicationVersionDto>> {
        return CatalogRunner.run<ApplicationVersionDto>(
            this.http,
            { method: 'GET', path: DN_API_ROOT },
            options
        );
    }
}
