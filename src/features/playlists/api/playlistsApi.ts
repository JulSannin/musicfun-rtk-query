import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {
    CreatePlaylistAttributes,
    CreatePlaylistRequestPayload,
    FetchPlaylistsArgs,
    GetPlaylistOutput,
    GetPlaylistsOutput,
    UpdatePlaylistAttributes,
    UpdatePlaylistRequestPayload,
} from "./playlistsApi.types";

// создаем RTK Query API
// здесь описаны все запросы и мутации для работы с плейлистами
export const playlistsApi = createApi({
    // имя ветки в redux store, где RTK Query держит свой кеш
    reducerPath: "playlistsApi",

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

    // описываем все запросы и мутации
    endpoints: (build) => ({
        // GET запрос
        // получает список плейлистов
        fetchPlaylists: build.query<GetPlaylistsOutput, FetchPlaylistsArgs>({
            query: (params) => ({
                method: "GET",
                url: "playlists/",
                // params уходят в query строку: ?pageNumber=1&search=...
                params,
            }),

            // помечаем кеш списка
            // id: "LIST" это просто метка, что запись хранит весь список
            providesTags: [{type: "Playlists", id: "LIST"}],
        }),

        // GET запрос
        // получает один плейлист по id
        // нужен для формы редактирования: в списке нет description,
        // он есть только в ответе по одному плейлисту
        fetchPlaylist: build.query<GetPlaylistOutput, {playlistId: string}>({
            query: ({playlistId}) => ({
                method: "GET",
                url: `playlists/${playlistId}`,
            }),

            // помечаем кеш карточки ее собственным id
            // благодаря этому правка плейлиста A не сбрасывает кеш плейлиста B
            providesTags: (_result, _error, {playlistId}) => [
                {type: "Playlist", id: playlistId},
            ],
        }),

        // POST запрос
        // создает новый плейлист
        // наружу принимаем только attributes, конверт JSON API собираем здесь,
        // чтобы компоненты про структуру data.type.attributes не знали
        createPlaylist: build.mutation<
            GetPlaylistOutput,
            CreatePlaylistAttributes
        >({
            query: (attributes) => ({
                method: "POST",
                url: "playlists",
                // satisfies сверяет конверт с нашим типом, не меняя выводимый тип
                // без него ошибку никто не поймает: body в RTK Query имеет тип any
                body: {
                    data: {type: "playlists", attributes},
                } satisfies CreatePlaylistRequestPayload,
            }),

            // новый плейлист меняет список
            // карточки с ним еще нет, сбрасывать нечего
            invalidatesTags: [{type: "Playlists", id: "LIST"}],
        }),

        // DELETE запрос
        // удаляет плейлист по id
        deletePlaylist: build.mutation<void, string>({
            query: (playlistId) => ({
                method: "DELETE",
                url: `playlists/${playlistId}`,
            }),

            // удаление меняет список и убивает карточку удаленного плейлиста
            // аргумент здесь просто строка, поэтому без фигурных скобок
            invalidatesTags: (_result, _error, playlistId) => [
                {type: "Playlists", id: "LIST"},
                {type: "Playlist", id: playlistId},
            ],
        }),

        // PUT запрос
        // обновляет выбранный плейлист
        // возвращает 204 без тела, поэтому тип ответа void
        updatePlaylist: build.mutation<
            void,
            {playlistId: string; attributes: UpdatePlaylistAttributes}
        >({
            query: ({playlistId, attributes}) => ({
                method: "PUT",
                url: `playlists/${playlistId}`,
                body: {
                    data: {type: "playlists", attributes},
                } satisfies UpdatePlaylistRequestPayload,
            }),

            // правка меняет и список (там виден title), и саму карточку
            // здесь аргумент объект, поэтому достаем playlistId деструктуризацией
            invalidatesTags: (_result, _error, {playlistId}) => [
                {type: "Playlists", id: "LIST"},
                {type: "Playlist", id: playlistId},
            ],
        }),
    }),
});

// экспортируем готовые RTK Query хуки
// имена генерируются автоматически: use + имя эндпоинта + Query или Mutation
export const {
    useFetchPlaylistsQuery,
    useFetchPlaylistQuery,
    useCreatePlaylistMutation,
    useDeletePlaylistMutation,
    useUpdatePlaylistMutation,
} = playlistsApi;
