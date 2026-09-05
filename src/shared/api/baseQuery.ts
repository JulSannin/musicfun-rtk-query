import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from './authTokens';

export const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    headers: { 'API-KEY': import.meta.env.VITE_API_KEY },
    prepareHeaders: (headers, { endpoint }) => {
        // на /auth/login токен вешать не нужно: это обмен OAuth-кода на новую пару
        // токенов, а не запрос от имени пользователя. Если в localStorage завалялся
        // старый accessToken, бэкенд отвечает на login 401 из-за лишнего заголовка
        if (endpoint === 'login') return headers;

        const accessToken = getAccessToken();
        if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
        return headers;
    },
});
