import {
    type HttpClient,
    HttpClientError,
    type HttpRequestConfig,
    type Result,
} from '@digital-net-org/digital-api-sdk';

function isResult<T>(value: unknown): value is Result<T> {
    return typeof value === 'object' && value !== null && 'hasError' in value && 'errors' in value && 'infos' in value;
}

/**
 * Runs an entity request against the backend `Result<T>` contract, the way the SDK catalogs do:
 * a 4xx/5xx returns the server's Result instead of throwing, so callers read `hasError` inline,
 * and a body that is not a Result (204 included) becomes an empty success.
 * Network failures still bubble up.
 */
export async function entityRequest<T>(http: HttpClient, config: HttpRequestConfig): Promise<Result<T>> {
    try {
        const response = await http.request<Result<T>>(config);
        return isResult<T>(response.data)
            ? response.data
            : { value: response.data as T, hasError: false, errors: [], infos: [] };
    } catch (e) {
        if (!(e instanceof HttpClientError)) throw e;
        return isResult<T>(e.data)
            ? e.data
            : { value: null as T, hasError: true, errors: [{ message: `HTTP ${e.status}` }], infos: [] };
    }
}
