import type { ReactionCounters, ReactionOutput } from '@/shared/api';
import {
    applyReaction,
    baseApi,
    CurrentUserReaction,
    syncReaction,
} from '@/shared/api';
import type {
    AddTrackToPlaylistRequestPayload,
    FetchPlaylistTracksArgs,
    FetchTracksArgs,
    FetchTrackArgs,
    GetTrackDetailsOutput,
    GetTrackListOutput,
    GetTracksForPlaylistOutput,
    ReorderTrackRequestPayload,
} from './tracksApi.types';

// треки листаются курсором, а не номерами страниц: список пополняется,
// и при offset-пагинации новый трек сдвинул бы все остальные вниз —
// на второй странице показался бы дубль с первой
export const tracksApi = baseApi
    // Playlists и Playlist объявлены ещё и в playlistsApi: типы тегов глобальны
    // для baseApi, дубль в списке безвреден. А вот опечатка в имени тихо
    // сломает инвалидацию — состав плейлиста меняет tracksCount и duration
    // в карточке, и сбрасывать их приходится отсюда
    .enhanceEndpoints({
        addTagTypes: ['Track', 'PlaylistTracks', 'Playlists', 'Playlist'],
    })
    .injectEndpoints({
        endpoints: (build) => ({
            // infiniteQuery, а не query: RTK Query сам копит страницы в одной записи
            // кеша и отдает их как { pages, pageParams }
            // три параметра типа: ответ одной страницы, аргумент хука, тип курсора
            fetchTracks: build.infiniteQuery<
                GetTrackListOutput,
                FetchTracksArgs,
                string | undefined
            >({
                infiniteQueryOptions: {
                    // первую страницу просим без курсора
                    // undefined, а не null: наш paramsSerializer выбрасывает оба,
                    // но undefined тут ещё и честнее — курсора просто нет
                    initialPageParam: undefined,

                    // курсор следующей страницы лежит в ответе предыдущей;
                    // на последней сервер отдает null, RTK Query это видит
                    // и переводит hasNextPage в false
                    getNextPageParam: (lastPage) =>
                        lastPage.meta.nextCursor ?? undefined,
                },

                query: ({ queryArg, pageParam }) => ({
                    method: 'GET',
                    url: 'playlists/tracks',
                    params: {
                        // фильтры раскрываем первыми: постраничные параметры ниже
                        // не должны перебиваться тем, что пришло сверху
                        ...queryArg,
                        // без этого флага сервер вернет обычные страницы,
                        // а nextCursor всегда будет null
                        paginationType: 'cursor',
                        // сервер принимает от 0 до 20
                        pageSize: 10,
                        cursor: pageParam,
                    },
                }),
            }),
            // GET запрос
            // подробности одного трека; доступен и гостю — на этой ручке
            // из защиты только API-KEY
            fetchTrack: build.query<GetTrackDetailsOutput, FetchTrackArgs>({
                query: ({ trackId }) => ({
                    method: 'GET',
                    url: `playlists/tracks/${trackId}`,
                }),

                // тег пока никто не сбрасывает: он появится под редактирование
                // трека (PUT) и загрузку обложки, а реакции кеш чинят руками
                providesTags: (_result, _error, { trackId }) => [
                    { type: 'Track', id: trackId },
                ],
            }),
            // GET запрос
            // состав плейлиста; доступен и гостю — только API-KEY.
            // Эндпоинт живёт здесь, а не в playlistsApi: ответ это треки,
            // а entities/playlist не имеет права импортировать их типы
            fetchPlaylistTracks: build.query<
                GetTracksForPlaylistOutput,
                FetchPlaylistTracksArgs
            >({
                query: ({ playlistId }) => ({
                    method: 'GET',
                    url: `playlists/${playlistId}/tracks`,
                }),

                // порядок нормализуем один раз, на входе в кеш, а не при
                // отрисовке. Дальше массивом распоряжается оптимистичный патч
                // перестановки: пересортировка по order отменяла бы его, ведь
                // новых номеров сервер в ответ на reorder не присылает
                transformResponse: (response: GetTracksForPlaylistOutput) => ({
                    ...response,
                    data: [...response.data].sort(
                        (a, b) => a.attributes.order - b.attributes.order
                    ),
                }),

                providesTags: (_result, _error, { playlistId }) => [
                    { type: 'PlaylistTracks', id: playlistId },
                ],
            }),

            // POST запрос
            // добавляет трек в плейлист
            addTrackToPlaylist: build.mutation<
                void,
                { playlistId: string; trackId: string }
            >({
                query: ({ playlistId, trackId }) => ({
                    method: 'POST',
                    url: `playlists/${playlistId}/relationships/tracks`,
                    body: {
                        data: {
                            type: 'playlist-tracks',
                            attributes: { trackId },
                        },
                    } satisfies AddTrackToPlaylistRequestPayload,
                }),

                // 403 здесь значит не только «чужой плейлист», но и «уже
                // 10 треков»: текст приходит от сервера, показывает handleErrors
                invalidatesTags: (_result, _error, { playlistId }) => [
                    { type: 'PlaylistTracks', id: playlistId },
                    // в карточке и в шапке страницы меняются tracksCount
                    // и общая длительность
                    { type: 'Playlists', id: 'LIST' },
                    { type: 'Playlist', id: playlistId },
                ],
            }),

            // DELETE запрос
            // убирает трек из плейлиста; сам трек при этом остаётся жив
            removeTrackFromPlaylist: build.mutation<
                void,
                { playlistId: string; trackId: string }
            >({
                query: ({ playlistId, trackId }) => ({
                    method: 'DELETE',
                    url: `playlists/${playlistId}/relationships/tracks/${trackId}`,
                }),

                invalidatesTags: (_result, _error, { playlistId }) => [
                    { type: 'PlaylistTracks', id: playlistId },
                    { type: 'Playlists', id: 'LIST' },
                    { type: 'Playlist', id: playlistId },
                ],
            }),

            // PUT запрос
            // меняет позицию трека внутри плейлиста
            reorderPlaylistTrack: build.mutation<
                void,
                {
                    playlistId: string;
                    trackId: string;
                    // сервер принимает id трека, ПОСЛЕ которого встать;
                    // null означает «в начало». Собственный id подставлять
                    // нельзя — бэкенд ответит 400 «cannot place after itself»
                    putAfterItemId: string | null;
                }
            >({
                query: ({ playlistId, trackId, putAfterItemId }) => ({
                    method: 'PUT',
                    url: `playlists/${playlistId}/tracks/${trackId}/reorder`,
                    body: {
                        putAfterItemId,
                    } satisfies ReorderTrackRequestPayload,
                }),

                async onQueryStarted(
                    { playlistId, trackId, putAfterItemId },
                    { dispatch, queryFulfilled }
                ) {
                    // порядок правим сразу: инвалидация заставляла бы список
                    // прыгать на каждое нажатие, пока едет ответ
                    const patch = dispatch(
                        tracksApi.util.updateQueryData(
                            'fetchPlaylistTracks',
                            { playlistId },
                            (state) => {
                                const from = state.data.findIndex(
                                    (track) => track.id === trackId
                                );

                                if (from === -1) return;

                                const [moved] = state.data.splice(from, 1);

                                const after = putAfterItemId
                                    ? state.data.findIndex(
                                          (track) => track.id === putAfterItemId
                                      )
                                    : -1;

                                // null значит «в начало»: -1 + 1 даёт 0
                                state.data.splice(after + 1, 0, moved);
                            }
                        )
                    );

                    try {
                        await queryFulfilled;
                    } catch {
                        patch.undo();
                    }
                },

                // invalidatesTags нет намеренно: порядок уже поправлен патчем,
                // а состав от перестановки не меняется
            }),

            // POST / DELETE запрос
            // ставит или снимает реакцию на трек
            // устроена как setPlaylistReaction, но кеш другой: у infiniteQuery
            // в записи лежит { pages, pageParams }, а не один список
            setTrackReaction: build.mutation<
                ReactionOutput,
                { trackId: string; reaction: CurrentUserReaction }
            >({
                query: ({ trackId, reaction }) => {
                    // снятие реакции это отдельный DELETE, а не POST с нулём
                    if (reaction === CurrentUserReaction.None) {
                        return {
                            method: 'DELETE',
                            url: `playlists/tracks/${trackId}/reactions`,
                        };
                    }

                    const action =
                        reaction === CurrentUserReaction.Like
                            ? 'likes'
                            : 'dislikes';

                    return {
                        method: 'POST',
                        url: `playlists/tracks/${trackId}/${action}`,
                    };
                },

                async onQueryStarted({ trackId, reaction }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    const cachedArgs = tracksApi.util.selectCachedArgsForQuery(
                        lifecycleApi.getState(),
                        'fetchTracks'
                    );

                    // тот же трек может лежать в составе нескольких
                    // плейлистов — патчим каждый закешированный
                    const playlistArgs =
                        tracksApi.util.selectCachedArgsForQuery(
                            lifecycleApi.getState(),
                            'fetchPlaylistTracks'
                        );

                    // в списке треков сервер отдаёт только likesCount:
                    // дизлайк меняет состояние кнопки, но своего счётчика не имеет,
                    // и applyReaction пропускает отсутствующее поле
                    const patchEverywhere = (
                        mutate: (attributes: ReactionCounters) => void
                    ) => [
                        ...cachedArgs.map((args) =>
                            dispatch(
                                tracksApi.util.updateQueryData(
                                    'fetchTracks',
                                    args,
                                    (state) => {
                                        // трек может оказаться на любой
                                        // из уже подгруженных страниц
                                        for (const page of state.pages) {
                                            const track = page.data.find(
                                                (item) => item.id === trackId
                                            );

                                            if (track) {
                                                mutate(track.attributes);
                                                // id уникален, дальше не ищем
                                                break;
                                            }
                                        }
                                    }
                                )
                            )
                        ),

                        ...playlistArgs.map((args) =>
                            dispatch(
                                tracksApi.util.updateQueryData(
                                    'fetchPlaylistTracks',
                                    args,
                                    (state) => {
                                        const track = state.data.find(
                                            (item) => item.id === trackId
                                        );

                                        // счётчиков в этой выдаче нет вовсе,
                                        // меняется только состояние кнопки —
                                        // applyReaction пропускает отсутствующие поля
                                        if (track) mutate(track.attributes);
                                    }
                                )
                            )
                        ),

                        // тот же трек лежит ещё и в карточке, если она открыта.
                        // Аргумент обязан совпасть с тем, чем зовёт хук страницы
                        // ({ trackId }), иначе ключ кеша другой и патч уйдёт
                        // в пустоту. Патч по отсутствующей записи просто ничего
                        // не делает — проверять, открыта ли страница, не нужно.
                        // Здесь, в отличие от списка, есть и dislikesCount,
                        // поэтому applyReaction поправит оба счётчика
                        dispatch(
                            tracksApi.util.updateQueryData(
                                'fetchTrack',
                                { trackId },
                                (state) => {
                                    mutate(state.data.attributes);
                                }
                            )
                        ),
                    ];

                    // состояние кнопки меняем сразу, не дожидаясь ответа
                    const patches = patchEverywhere((attributes) =>
                        applyReaction(attributes, reaction)
                    );

                    try {
                        // числа сервера точнее наших: лайкнуть могли и другие
                        const { data } = await queryFulfilled;
                        patchEverywhere((attributes) =>
                            syncReaction(attributes, data)
                        );
                    } catch {
                        patches.forEach((patch) => patch.undo());
                    }
                },

                // invalidatesTags нет намеренно, хотя тег Track уже есть:
                // сброс перезапросил бы карточку и все загруженные страницы
                // списка на каждый клик по кнопке. Кеш чиним патчами выше
            }),
        }),
    });

// у infiniteQuery имя хука собирается иначе: use + имя эндпоинта + InfiniteQuery
export const {
    useFetchTracksInfiniteQuery,
    useFetchTrackQuery,
    useFetchPlaylistTracksQuery,
    useAddTrackToPlaylistMutation,
    useRemoveTrackFromPlaylistMutation,
    useReorderPlaylistTrackMutation,
    useSetTrackReactionMutation,
} = tracksApi;
