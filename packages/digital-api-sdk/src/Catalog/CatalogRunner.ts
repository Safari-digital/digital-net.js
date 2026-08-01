import { HttpClientError } from '../HttpClient';
import type { HttpClient, HttpRequestConfig } from '../HttpClient';
import type { Result } from '../Result';
import type { CatalogCallbacks, CatalogError } from './types';

export class CatalogRunner {
    /**
     * Executes an HttpClient request and dispatches granular callbacks on the
     * resulting `Result<T>`. Assumes the backend contract: every JSON response
     * is a `Result<T>`. On `204 No Content`, synthesizes an empty success Result.
     *
     * HTTP errors (4xx/5xx) do NOT throw: they return the server's `Result<T>`
     * (available on `HttpClientError.data`) so the caller can inspect `hasError`
     * inline without try/catch. Network errors (non-`HttpClientError`) bubble up.
     *
     * Callback order on error: `onReference[ref]` (for each matching ref in
     * `result.errors`) → `onStatus[status]` → `onError`. All matching callbacks
     * are invoked; none of them short-circuit the others.
     */
    public static async run<T>(
        http: HttpClient,
        request: HttpRequestConfig,
        options: CatalogCallbacks<T> = {}
    ): Promise<Result<T>> {
        const forwardedRequest = CatalogRunner.composeHooks(request, options);
        try {
            const response = await http.request<Result<T>>(forwardedRequest);
            const result: Result<T> = CatalogRunner.isResult<T>(response.data)
                ? response.data
                : { value: response.data as T, hasError: false, errors: [], infos: [] };

            if (result.hasError) {
                await CatalogRunner.doErrorCallbacks<T>(
                    {
                        status: response.status,
                        result,
                        messages: result.errors,
                    },
                    options
                );
            } else if (options.onSuccess) {
                await CatalogRunner.safeInvoke(() => options.onSuccess!(result.value), 'onSuccess');
            }
            return result;
        } catch (e) {
            if (!(e instanceof HttpClientError)) throw e;

            const result = CatalogRunner.isResult<T>(e.data) ? e.data : null;
            const callError: CatalogError<T> = {
                status: e.status,
                result,
                messages: result?.errors ?? [{ message: `HTTP ${e.status}` }],
            };
            await CatalogRunner.doErrorCallbacks<T>(callError, options);
            return (
                result ?? {
                    value: null as T,
                    hasError: true,
                    errors: callError.messages,
                    infos: [],
                }
            );
        }
    }

    private static async doErrorCallbacks<T>(error: CatalogError<T>, options: CatalogCallbacks<T>): Promise<void> {
        if (error.result?.errors && options.onReference) {
            for (const msg of error.result.errors) {
                const handler = msg.reference ? options.onReference[msg.reference] : undefined;
                if (handler) {
                    await CatalogRunner.safeInvoke(() => handler(msg, error), `onReference[${msg.reference}]`);
                }
            }
        }

        const statusHandler = options.onStatus?.[error.status];
        if (statusHandler) {
            await CatalogRunner.safeInvoke(() => statusHandler(error), `onStatus[${error.status}]`);
        }

        if (options.onError) {
            await CatalogRunner.safeInvoke(() => options.onError!(error), 'onError');
        }
    }

    /**
     * Callbacks supplied by the caller are best-effort: a throwing callback must NOT
     * break the dispatch chain nor propagate up to the caller of `run()`. We log the
     * error on `console.error` and swallow it so the next callback still runs.
     */
    private static async safeInvoke(fn: () => void | Promise<void>, label: string): Promise<void> {
        try {
            await fn();
        } catch (e) {
            console.error(`[CatalogRunner] ${label} callback threw`, e);
        }
    }

    /**
     * Merges `onRequest`/`onResponse` from CatalogCallbacks into the HttpRequestConfig.
     * Catalog-level hooks run FIRST, request-level hooks run SECOND (last-write-wins).
     * Transport-level hook exceptions propagate to the caller (they are NOT isolated,
     * unlike the dispatch callbacks `onSuccess`/`onError`/etc.).
     */
    private static composeHooks<T>(request: HttpRequestConfig, options: CatalogCallbacks<T>): HttpRequestConfig {
        const catalogOnRequest = options.onRequest;
        const requestOnRequest = request.onRequest;
        const catalogOnResponse = options.onResponse;
        const requestOnResponse = request.onResponse;

        const needsRequestCompose = !!(catalogOnRequest && requestOnRequest);
        const needsResponseCompose = !!(catalogOnResponse && requestOnResponse);

        if (!catalogOnRequest && !catalogOnResponse) {
            return request;
        }

        const onRequest: HttpRequestConfig['onRequest'] = needsRequestCompose
            ? async cfg => requestOnRequest!(await catalogOnRequest!(cfg))
            : (catalogOnRequest ?? requestOnRequest);

        const onResponse: HttpRequestConfig['onResponse'] = needsResponseCompose
            ? async resp => {
                  await catalogOnResponse!(resp);
                  await requestOnResponse!(resp);
              }
            : (catalogOnResponse ?? requestOnResponse);

        return { ...request, onRequest, onResponse };
    }

    private static isResult<T>(value: unknown): value is Result<T> {
        return (
            typeof value === 'object' && value !== null && 'hasError' in value && 'errors' in value && 'infos' in value
        );
    }
}
