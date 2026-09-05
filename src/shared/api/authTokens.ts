export const AUTH_KEYS = {
    accessToken: 'musicfun-access-token',
    refreshToken: 'musicfun-refresh-token',
} as const;

export const getAccessToken = () => localStorage.getItem(AUTH_KEYS.accessToken);
export const getRefreshToken = () =>
    localStorage.getItem(AUTH_KEYS.refreshToken);

export const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(AUTH_KEYS.accessToken, accessToken);
    localStorage.setItem(AUTH_KEYS.refreshToken, refreshToken);
};

export const clearTokens = () => {
    localStorage.removeItem(AUTH_KEYS.accessToken);
    localStorage.removeItem(AUTH_KEYS.refreshToken);
};

export const isTokens = (
    data: unknown
): data is { accessToken: string; refreshToken: string } =>
    typeof data === 'object' &&
    data !== null &&
    'accessToken' in data &&
    'refreshToken' in data;
