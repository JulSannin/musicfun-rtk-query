import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({

  // имя ветки в redux store, где RTK Query держит свой кеш
    reducerPath: "baseApi",

    // типы тегов для автоматического обновления кеша
    // Playlists это список плейлистов, Playlist это одна карточка
    // запрос помечает свой кеш тегом, мутация этот тег сбрасывает
    // важно: имена должны совпадать в providesTags и invalidatesTags,
    // иначе инвалидация молча не сработает, а TS этого не заметит
    tagTypes: ["Playlists", "Playlist"],

    // базовые настройки для всех запросов
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_BASE_URL,

        // API-KEY отправляется в каждом запросе
        headers: {
            "API-KEY": import.meta.env.VITE_API_KEY,
        },

        // перед каждым запросом добавляем access token
        prepareHeaders: (headers) => {
            headers.set(
                "Authorization",
                `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`,
            );

            return headers;
        },
    }),
  endpoints: () => ({}),
})