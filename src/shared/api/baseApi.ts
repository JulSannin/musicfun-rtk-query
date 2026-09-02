import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
    // имя ветки в redux store, где RTK Query держит свой кеш
    reducerPath: 'baseApi',

    // базовые настройки для всех запросов
    baseQuery: fetchBaseQuery({
        // переменные окружения типизированы в src/vite-env.d.ts
        // без этого файла тут был бы any и опечатка прошла бы молча
        baseUrl: import.meta.env.VITE_BASE_URL,

        // API-KEY отправляется в каждом запросе
        headers: {
            'API-KEY': import.meta.env.VITE_API_KEY,
        },

        // перед каждым запросом добавляем access token
        prepareHeaders: (headers) => {
            headers.set(
                'Authorization',
                `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`
            )

            return headers
        },
    }),
    endpoints: () => ({}),
})
