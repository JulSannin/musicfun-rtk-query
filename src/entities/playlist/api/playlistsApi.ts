import type { Images } from '@/shared/api'
import type {
    CreatePlaylistAttributes,
    CreatePlaylistRequestPayload,
    FetchPlaylistsArgs,
    GetPlaylistOutput,
    GetPlaylistsOutput,
    UpdatePlaylistAttributes,
    UpdatePlaylistRequestPayload,
} from './playlistsApi.types'
import { baseApi } from '@/shared/api'

// создаем RTK Query API

// здесь описаны все запросы и мутации для работы с плейлистами
export const playlistsApi = baseApi
    // типы тегов для автоматического обновления кеша
    // Playlists это список плейлистов, Playlist это одна карточка
    // запрос помечает свой кеш тегом, мутация этот тег сбрасывает
    // важно: имена должны совпадать в providesTags и invalidatesTags,
    // иначе инвалидация молча не сработает, а TS этого не заметит
    .enhanceEndpoints({ addTagTypes: ['Playlists', 'Playlist'] })
    .injectEndpoints({
        // описываем все запросы и мутации
        endpoints: (build) => ({
            // GET запрос
            // получает список плейлистов
            fetchPlaylists: build.query<GetPlaylistsOutput, FetchPlaylistsArgs>(
                {
                    query: (params) => ({
                        method: 'GET',
                        url: 'playlists/',
                        // params уходят в query строку: ?pageNumber=1&search=...
                        params,
                    }),

                    // помечаем кеш списка
                    // id: "LIST" это просто метка, что запись хранит весь список
                    providesTags: [{ type: 'Playlists', id: 'LIST' }],
                }
            ),

            // GET запрос
            // получает один плейлист по id
            // нужен для формы редактирования: в списке нет description,
            // он есть только в ответе по одному плейлисту
            fetchPlaylist: build.query<
                GetPlaylistOutput,
                { playlistId: string }
            >({
                query: ({ playlistId }) => ({
                    method: 'GET',
                    url: `playlists/${playlistId}`,
                }),

                // помечаем кеш карточки ее собственным id
                // благодаря этому правка плейлиста A не сбрасывает кеш плейлиста B
                providesTags: (_result, _error, { playlistId }) => [
                    { type: 'Playlist', id: playlistId },
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
                    method: 'POST',
                    url: 'playlists',
                    // satisfies сверяет конверт с нашим типом, не меняя выводимый тип
                    // без него ошибку никто не поймает: body в RTK Query имеет тип any
                    body: {
                        data: { type: 'playlists', attributes },
                    } satisfies CreatePlaylistRequestPayload,
                }),

                // новый плейлист меняет список
                // карточки с ним еще нет, сбрасывать нечего
                invalidatesTags: [{ type: 'Playlists', id: 'LIST' }],
            }),

            // DELETE запрос
            // удаляет плейлист по id
            deletePlaylist: build.mutation<void, string>({
                query: (playlistId) => ({
                    method: 'DELETE',
                    url: `playlists/${playlistId}`,
                }),

                // удаление меняет список и убивает карточку удаленного плейлиста
                // аргумент здесь просто строка, поэтому без фигурных скобок
                invalidatesTags: (_result, _error, playlistId) => [
                    { type: 'Playlists', id: 'LIST' },
                    { type: 'Playlist', id: playlistId },
                ],
            }),

            // PUT запрос
            // обновляет выбранный плейлист
            // возвращает 204 без тела, поэтому тип ответа void
            updatePlaylist: build.mutation<
                void,
                { playlistId: string; attributes: UpdatePlaylistAttributes }
            >({
                query: ({ playlistId, attributes }) => ({
                    method: 'PUT',
                    url: `playlists/${playlistId}`,
                    body: {
                        data: { type: 'playlists', attributes },
                    } satisfies UpdatePlaylistRequestPayload,
                }),

                // правка меняет и список (там виден title), и саму карточку
                // здесь аргумент объект, поэтому достаем playlistId деструктуризацией
                invalidatesTags: (_result, _error, { playlistId }) => [
                    { type: 'Playlists', id: 'LIST' },
                    { type: 'Playlist', id: playlistId },
                ],
            }),

            // POST запрос
            // загружает обложку плейлиста
            // файл уходит как FormData, поэтому body собираем внутри query
            // Content-Type руками не ставим: браузер сам допишет boundary
            uploadPlaylistCover: build.mutation<
                Images,
                { playlistId: string; file: File }
            >({
                query: ({ playlistId, file }) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    return {
                        url: `playlists/${playlistId}/images/main`,
                        method: 'POST',
                        body: formData,
                    }
                },
                // обложка видна и в списке, и в карточке, поэтому сбрасываем оба тега
                invalidatesTags: (_result, _error, { playlistId }) => [
                    { type: 'Playlists', id: 'LIST' },
                    { type: 'Playlist', id: playlistId },
                ],
            }),

            // DELETE запрос
            // удаляет обложку плейлиста
            // аргумент объект, и деструктуризация нужна именно в query:
            // без нее в url подставится [object Object], а TS этого не заметит,
            // потому что в шаблонную строку можно положить что угодно
            deletePlaylistCover: build.mutation<void, { playlistId: string }>({
                query: ({ playlistId }) => ({
                    method: 'DELETE',
                    url: `/playlists/${playlistId}/images/main`,
                }),
                invalidatesTags: (_result, _error, { playlistId }) => [
                    { type: 'Playlists', id: 'LIST' },
                    { type: 'Playlist', id: playlistId },
                ],
            }),
        }),
    })

// экспортируем готовые RTK Query хуки
// имена генерируются автоматически: use + имя эндпоинта + Query или Mutation
export const {
    useFetchPlaylistsQuery,
    useFetchPlaylistQuery,
    useCreatePlaylistMutation,
    useDeletePlaylistMutation,
    useUpdatePlaylistMutation,
    useUploadPlaylistCoverMutation,
    useDeletePlaylistCoverMutation,
} = playlistsApi
