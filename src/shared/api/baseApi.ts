import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
    // имя ветки в redux store, где RTK Query держит свой кеш
    reducerPath: 'baseApi',

    // перезапрос на возврат фокуса и появление сети; работает только с setupListeners в store
    refetchOnFocus: true,
    refetchOnReconnect: true,

    baseQuery: fetchBaseQuery({
        // переменные окружения типизированы в src/vite-env.d.ts, иначе тут был бы any
        baseUrl: import.meta.env.VITE_BASE_URL,

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
