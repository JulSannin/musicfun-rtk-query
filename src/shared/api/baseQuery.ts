import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAccessToken } from './authTokens';

export const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    headers: { 'API-KEY': import.meta.env.VITE_API_KEY },
    // бэкенд ждёт массивы повторяющимся ключом: tagsIds=a&tagsIds=b
    // URLSearchParams по умолчанию склеивает массив запятой и отдаёт tagsIds=a%2Cb,
    // что сервер принимает за один несуществующий id — фильтр молча вернёт пусто
    // свой paramsSerializer отменяет встроенный stripUndefined,
    // поэтому пустые значения выбрасываем здесь сами
    paramsSerializer: (params: Record<string, unknown>) => {
        const query = new URLSearchParams();

        // в урл кладём только примитивы: объект String() превратил бы
        // в "[object Object]" и молча отправил на бэкенд
        // здесь же отсеиваются undefined и null — встроенный stripUndefined
        // свой paramsSerializer отключает, чистить приходится самим
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
