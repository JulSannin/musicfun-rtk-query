import type { ReactionCounters, ReactionOutput } from '@/shared/api';
import {
    applyReaction,
    baseApi,
    CurrentUserReaction,
    syncReaction,
} from '@/shared/api';
import type {
    FetchTracksArgs,
    GetTrackListOutput,
    GetTrackDetailsOutput,
    FetchTrackArgs,
} from './tracksApi.types';

// треки листаются курсором, а не номерами страниц: список пополняется,
// и при offset-пагинации новый трек сдвинул бы все остальные вниз —
// на второй странице показался бы дубль с первой
export const tracksApi = baseApi
    .enhanceEndpoints({ addTagTypes: ['Track'] })
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
    useSetTrackReactionMutation,
} = tracksApi;
