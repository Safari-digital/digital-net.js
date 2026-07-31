export const DN_API_KEY_HEADER = 'DN-Api-Key' as const;
export const DN_APPLICATION_KEY_HEADER = 'DN-Application-Key' as const;
export const DN_CLIENT_ID_HEADER = 'DN-Client-Id' as const;

/**
 * CSRF marker required by the API on mutating, session-authenticated requests. Only its presence is
 * checked: a cross-site context cannot set a custom header without a preflight the API refuses.
 */
export const DN_REQUESTED_WITH_HEADER = 'DN-Requested-With' as const;
export const DN_REQUESTED_WITH_VALUE = 'digital-net' as const;

export const DN_DEFAULT_HEADERS = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
} as const satisfies Readonly<Record<string, string>>;
