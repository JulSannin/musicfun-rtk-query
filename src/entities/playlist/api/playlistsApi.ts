import type {
    Images,
    ReactionCounters,
    ReactionOutput,
    TagRef,
} from '@/shared/api';
import {
    applyReaction,
    baseApi,
    CurrentUserReaction,
    syncReaction,
} from '@/shared/api';

import type {
    CreatePlaylistAttributes,
    CreatePlaylistRequestPayload,
    FetchPlaylistsArgs,
    GetPlaylistOutput,
    GetPlaylistsOutput,
    ReorderPlaylistRequestPayload,
    UpdatePlaylistAttributes,
    UpdatePlaylistRequestPayload,
} from './playlistsApi.types';

// createApi на приложение один и лежит в shared/api/baseApi.ts,
// а слайсы дописывают в него свои эндпоинты через injectEndpoints

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
                    // одна запись это одна страница под свои pageNumber/pageSize/search,
                    // а тег у всех них общий, поэтому мутация сбрасывает их разом
                    //
                    // Playlists/LIKED достаётся только выдаче «понравившееся»:
                    // там реакция меняет сам состав списка, а не счётчик внутри
                    // карточки, и патчем это не чинится. Узкий id вместо LIST —
                    // чтобы клик по лайку не перезапрашивал все списки подряд
                    providesTags: (_result, _error, { onlyLikedByMe }) =>
                        onlyLikedByMe
                            ? [
                                  { type: 'Playlists', id: 'LIST' },
                                  { type: 'Playlists', id: 'LIKED' },
                              ]
                            : [{ type: 'Playlists', id: 'LIST' }],
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
                {
                    playlistId: string;
                    attributes: UpdatePlaylistAttributes;
                    // теги целиком нужны только патчу кеша: на сервер уходят
                    // одни id, а в списке лежат TagRef с именами, и взять имя
                    // патчу больше неоткуда
                    tags: TagRef[];
                }
            >({
                query: ({ playlistId, attributes }) => ({
                    method: 'PUT',
                    url: `playlists/${playlistId}`,
                    body: {
                        data: { type: 'playlists', attributes },
                    } satisfies UpdatePlaylistRequestPayload,
                }),

                async onQueryStarted(
                    { playlistId, attributes, tags },
                    lifecycleApi
                ) {
                    // getState берем через lifecycleApi, а не деструктуризацией:
                    // RTK Query типизирует его как метод, и eslint (unbound-method)
                    // ругается на потерю this при отрыве от объекта
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    // список плейлистов кешируется отдельно под каждый набор аргументов
                    // (страница/поиск/сортировка) — патчим все закешированные варианты разом
                    const cachedArgs =
                        playlistsApi.util.selectCachedArgsForQuery(
                            lifecycleApi.getState(),
                            'fetchPlaylists'
                        );

                    const patches = cachedArgs.map((args) =>
                        dispatch(
                            playlistsApi.util.updateQueryData(
                                'fetchPlaylists',
                                args,
                                (state) => {
                                    const index = state.data.findIndex(
                                        (playlist) => playlist.id === playlistId
                                    );
                                    if (index !== -1) {
                                        const playlist = state.data[index];
                                        playlist.attributes.title =
                                            attributes.title;
                                        // теги карточка показывает, поэтому
                                        // патчим и их — иначе до перезапроса
                                        // рядом с новым названием висели бы
                                        // старые теги
                                        playlist.attributes.tags = tags;
                                        // а вот description в списке нет вовсе:
                                        // его в этом типе просто не существует
                                    }
                                }
                            )
                        )
                    );

                    try {
                        await queryFulfilled;
                    } catch {
                        patches.forEach((patch) => patch.undo());
                    }
                },

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
                    const formData = new FormData();
                    formData.append('file', file);
                    return {
                        url: `playlists/${playlistId}/images/main`,
                        method: 'POST',
                        body: formData,
                    };
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

            // POST / DELETE запрос
            // ставит или снимает реакцию на плейлист
            // три эндпоинта спрятаны в одну мутацию: для UI это одно действие —
            // переключение состояния кнопки, и оптимистичное обновление у них общее
            setPlaylistReaction: build.mutation<
                ReactionOutput,
                { playlistId: string; reaction: CurrentUserReaction }
            >({
                query: ({ playlistId, reaction }) => {
                    // снятие реакции это отдельный DELETE, а не POST с нулём
                    if (reaction === CurrentUserReaction.None) {
                        return {
                            method: 'DELETE',
                            url: `playlists/${playlistId}/reactions`,
                        };
                    }

                    const action =
                        reaction === CurrentUserReaction.Like
                            ? 'likes'
                            : 'dislikes';

                    return {
                        method: 'POST',
                        url: `playlists/${playlistId}/${action}`,
                    };
                },

                async onQueryStarted({ playlistId, reaction }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    const cachedArgs =
                        playlistsApi.util.selectCachedArgsForQuery(
                            lifecycleApi.getState(),
                            'fetchPlaylists'
                        );

                    // один плейлист лежит сразу в нескольких местах кеша: в каждом
                    // варианте списка и в карточке — правку применяем везде одинаково
                    const patchEverywhere = (
                        mutate: (attributes: ReactionCounters) => void
                    ) => [
                        ...cachedArgs.map((args) =>
                            dispatch(
                                playlistsApi.util.updateQueryData(
                                    'fetchPlaylists',
                                    args,
                                    (state) => {
                                        const playlist = state.data.find(
                                            (item) => item.id === playlistId
                                        );
                                        if (playlist)
                                            mutate(playlist.attributes);
                                    }
                                )
                            )
                        ),
                        // если карточка не открыта, записи в кеше нет и патч просто
                        // ничего не делает — проверять наличие отдельно не нужно
                        dispatch(
                            playlistsApi.util.updateQueryData(
                                'fetchPlaylist',
                                { playlistId },
                                (state) => mutate(state.data.attributes)
                            )
                        ),
                    ];

                    // счётчик двигаем сразу, не дожидаясь ответа
                    const patches = patchEverywhere((attributes) =>
                        applyReaction(attributes, reaction)
                    );

                    try {
                        // наши +1/−1 это догадка: пока страница висела открытой,
                        // лайкнуть мог кто угодно ещё — заменяем числами сервера
                        const { data } = await queryFulfilled;
                        patchEverywhere((attributes) =>
                            syncReaction(attributes, data)
                        );
                    } catch {
                        patches.forEach((patch) => patch.undo());
                    }
                },

                // Playlists/LIST намеренно не сбрасываем: он перезапрашивал бы
                // всю страницу списка на каждый клик по кнопке.
                //
                // Но выдачу «только понравившееся» патч не чинит — лайк должен
                // добавить в неё карточку, которой в ответе не было, — поэтому
                // сбрасываем узкий Playlists/LIKED. Пока библиотека закрыта,
                // это лишь пометка «устарело»: запрос уйдёт при её открытии
                invalidatesTags: [{ type: 'Playlists', id: 'LIKED' }],
            }),

            // PUT запрос
            // меняет порядок своих плейлистов; сервер отвечает 204 без тела
            // принимает не позицию, а id соседа, после которого встать
            // (null — «в начало»), как и перестановка треков
            reorderPlaylist: build.mutation<
                void,
                {
                    playlistId: string;
                    putAfterItemId: string | null;
                }
            >({
                query: ({ playlistId, putAfterItemId }) => ({
                    method: 'PUT',
                    url: `playlists/${playlistId}/reorder`,
                    body: {
                        putAfterItemId,
                    } satisfies ReorderPlaylistRequestPayload,
                }),

                async onQueryStarted(
                    { playlistId, putAfterItemId },
                    lifecycleApi
                ) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    // патчим только списки одного пользователя: порядок
                    // персональный, а в общей выдаче /playlists карточки идут
                    // по addedAt, и там его правка ничего не значит
                    const cachedArgs = playlistsApi.util
                        .selectCachedArgsForQuery(
                            lifecycleApi.getState(),
                            'fetchPlaylists'
                        )
                        .filter((args) => args.userId);

                    // тут единственное отличие от перестановки треков:
                    // там порядок нормализуется один раз в transformResponse,
                    // и дальше массивом распоряжается только патч. Здесь
                    // transformResponse общий для всех страниц списка, и
                    // сортировать в нём по order нельзя — сломается выдача
                    // по addedAt на /playlists. Поэтому правим сами значения
                    // order, а список сортирует по ним тот, кто его показывает
                    const patches = cachedArgs.map((args) =>
                        dispatch(
                            playlistsApi.util.updateQueryData(
                                'fetchPlaylists',
                                args,
                                (state) => {
                                    const ordered = [...state.data].sort(
                                        (a, b) =>
                                            a.attributes.order -
                                            b.attributes.order
                                    );

                                    const from = ordered.findIndex(
                                        (playlist) => playlist.id === playlistId
                                    );

                                    if (from === -1) return;

                                    const [moved] = ordered.splice(from, 1);

                                    const after = putAfterItemId
                                        ? ordered.findIndex(
                                              (playlist) =>
                                                  playlist.id === putAfterItemId
                                          )
                                        : -1;

                                    // null значит «в начало»: -1 + 1 даёт 0
                                    ordered.splice(after + 1, 0, moved);

                                    // номера переписываем подряд: настоящие
                                    // сервер не присылает (в ответе 204),
                                    // а для отрисовки важен только их порядок
                                    ordered.forEach((playlist, index) => {
                                        playlist.attributes.order = index;
                                    });
                                }
                            )
                        )
                    );

                    try {
                        await queryFulfilled;
                    } catch {
                        patches.forEach((patch) => patch.undo());
                    }
                },

                // invalidatesTags нет намеренно, только патч: сброс заставлял
                // бы список прыгать на каждое нажатие, пока едет ответ
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
    useUploadPlaylistCoverMutation,
    useDeletePlaylistCoverMutation,
    useSetPlaylistReactionMutation,
    useReorderPlaylistMutation,
} = playlistsApi;
