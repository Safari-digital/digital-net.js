import type { HttpRequestConfig, HttpResponse } from '../../HttpClient';
import type { ResultMessage } from '../../Result';
import type { CatalogError } from './CatalogError';

export interface CatalogCallbacks<T = unknown> {
    /** Invoked on 2xx responses when the parsed Result is not an error. `value` is `result.value`. */
    onSuccess?: (_value: T) => void | Promise<void>;
    /** Generic fallback invoked on any HTTP error (4xx/5xx) with or without a Result body. Not called on network errors. */
    onError?: (_error: CatalogError<T>) => void | Promise<void>;
    /** Invoked when the server returns a specific HTTP status code. Called in addition to onError and onReference. */
    onStatus?: Partial<Record<number, (_error: CatalogError<T>) => void | Promise<void>>>;
    /**
     * Invoked once per matching `ResultMessage.reference` in `result.errors`.
     * Lets the caller react to specific .NET exception types (e.g., INVALID_CREDENTIALS_EXCEPTION).
     * Called in addition to onStatus and onError.
     */
    onReference?: Partial<Record<string, (_message: ResultMessage, _error: CatalogError<T>) => void | Promise<void>>>;
    /**
     * Transport hook forwarded to the underlying `HttpRequestConfig.onRequest`.
     * When composed with a request-level hook, the catalog hook runs FIRST, then the
     * request hook runs SECOND (last-write-wins semantics on overlapping mutations).
     * Exceptions propagate to the caller.
     */
    onRequest?: (_config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
    /**
     * Transport hook forwarded to the underlying `HttpRequestConfig.onResponse`.
     * When composed with a request-level hook, the catalog hook runs FIRST, then the
     * request hook runs SECOND. Exceptions propagate to the caller.
     */
    onResponse?: (_response: HttpResponse<unknown>) => void | Promise<void>;
}
