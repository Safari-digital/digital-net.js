import type { HttpMethod } from './HttpMethod';
import type { HttpResponse } from './HttpResponse';

export interface HttpRequestConfig<B = any> {
    /** Relative path (e.g. `user/self`, `user/:id`). Merged with `baseUrl`. */
    path: string;
    method?: HttpMethod;
    /** Path variables (e.g. `{ id: 42 }` replaces `:id`). */
    slugs?: Record<string, string | number>;
    /** Query string parameters. */
    params?: Record<string, unknown>;
    /** Extra headers merged on top of the default ones. */
    headers?: Record<string, string>;
    /** Request body. JSON-serialized unless it is a FormData / Blob / ArrayBuffer / URLSearchParams / string. */
    body?: B;
    /** Skip the automatic API key / application key headers. The session cookie still travels. */
    skipAuth?: boolean;
    /**
     * Override the default `'include'` credentials policy for this request. `'include'` is what carries
     * the session cookie, so lowering it makes the request anonymous.
     */
    credentials?: RequestCredentials;
    /** Abort signal forwarded to `fetch`. */
    signal?: AbortSignal;
    /**
     * Hook invoked just before `fetch()`. Receives the raw config and must return
     * it (possibly mutated). Use the spread pattern to avoid accidental mutation:
     * `onRequest: cfg => ({ ...cfg, headers: { ...cfg.headers, 'X-Trace': 'abc' } })`.
     *
     * Exceptions propagate to the caller.
     */
    onRequest?: (_config: HttpRequestConfig<B>) => HttpRequestConfig<B> | Promise<HttpRequestConfig<B>>;
    /**
     * Hook invoked after `deserializeBody`, BEFORE error handling — meaning the hook
     * also fires on 4xx/5xx responses (inspect `response.ok`/`response.status`).
     *
     * Exceptions propagate to the caller.
     */
    onResponse?: (_response: HttpResponse<unknown>) => void | Promise<void>;
    /**
     * @internal
     * When true, `onRequest` and `onResponse` are skipped for this request.
     * Do NOT set this from application code.
     */
    skipHooks?: boolean;
}
