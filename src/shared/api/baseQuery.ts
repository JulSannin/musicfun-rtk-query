import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from './authTokens';

export const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    headers: { 'API-KEY': import.meta.env.VITE_API_KEY },
    // бэкенд ждёт массивы повторяющимся ключом: tagsIds=a&tagsIds=b
    // URLSearchParams по умолчанию склеивает массив запятой и отдаёт tagsIds=a%2Cb,
    // что сервер принимает за один несуществующий id — фильтр молча вернёт пусто
    paramsSerializer: (params: Record<string, unknown>) => {
        const query = new URLSearchParams();

        // в урл кладём только примитивы, и на этом же условии отсеиваются
        // undefined с null: свой paramsSerializer отключает встроенный
        // stripUndefined, так что чистить параметры приходится самим,
        // а объект String() превратил бы в "[object Object]"
        const append = (key: string, value: unknown) => {
            if (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
            ) {
                query.append(key, String(value));
            }
        };

        for (const [key, value] of Object.entries(params)) {
            if (Array.isArray(value)) {
                value.forEach((item: unknown) => append(key, item));
            } else {
                append(key, value);
            }
        }

        return query.toString();
    },
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
