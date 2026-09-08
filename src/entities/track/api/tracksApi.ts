import type { Images, ReactionCounters, ReactionOutput } from '@/shared/api';
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
    UpdateTrackAttributes,
    UpdateTrackRequestPayload,
} from './tracksApi.types';

// состояние стора в том виде, в каком его принимают селекторы самого api:
// собственного RootState тут взять неоткуда — entities не имеет права
// импортировать app, а этот тип выводится из уже готовой сигнатуры
type ApiState = Parameters<typeof tracksApi.util.selectCachedArgsForQuery>[0];

// применяет одну и ту же правку к треку во всех СПИСКАХ, где он может лежать:
// в каждом варианте выдачи fetchTracks и в каждом закешированном составе
// плейлиста. Карточку подробностей сюда не включаем: у неё свой набор полей,
// и от неё каждой мутации нужно своё. Функция только собирает патчи, а dispatch
// остаётся на вызывающей стороне: там он типизирован самим RTK Query.
// Параметр mutate описан структурно и намеренно узко — общее у двух выдач
// только название и картинки: в составе плейлиста нет ни счётчиков, ни isPublished
const trackListPatches = (
    state: ApiState,
    trackId: string,
    mutate: (attributes: { title: string; images: Images }) => void
) => [
    ...tracksApi.util
        .selectCachedArgsForQuery(state, 'fetchTracks')
        .map((args) =>
            tracksApi.util.updateQueryData('fetchTracks', args, (draft) => {
                // трек может оказаться на любой из уже подгруженных страниц
                for (const page of draft.pages) {
                    const track = page.data.find((item) => item.id === trackId);

                    if (track) {
                        // правим черновик immer на месте: вернуть отсюда новый
                        // объект нельзя, изменения молча потеряются
                        mutate(track.attributes);
                        // id уникален, дальше не ищем
                        break;
                    }
                }
            })
        ),

    ...tracksApi.util
        .selectCachedArgsForQuery(state, 'fetchPlaylistTracks')
        .map((args) =>
            tracksApi.util.updateQueryData(
                'fetchPlaylistTracks',
                args,
                (draft) => {
                    const track = draft.data.find(
                        (item) => item.id === trackId
                    );

                    if (track) mutate(track.attributes);
                }
            )
        ),
];

// патч карточки подробностей: аргумент обязан совпасть с тем, чем зовёт хук
// панели ({ trackId }), иначе ключ кеша другой и патч уйдёт в пустоту.
// Патч по отсутствующей записи просто ничего не делает — проверять,
// открыта ли панель, не нужно
const trackDetailsPatch = (
    trackId: string,
    mutate: (state: GetTrackDetailsOutput) => void
) => tracksApi.util.updateQueryData('fetchTrack', { trackId }, mutate);

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

                // единственный тег списка треков, и сбрасывает его только
                // загрузка нового трека. Остальные мутации чинят кеш патчами
                // именно поэтому: сброс этого тега перезапрашивает ВСЕ
                // подгруженные страницы всех вариантов списка, и на каждый
                // клик по лайку это было бы недопустимо дорого
                providesTags: [{ type: 'Track', id: 'LIST' }],
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

            // POST запрос
            // загружает обложку трека
            // имя поля именно cover: у плейлиста оно file, и копипаст мутации
            // с плейлиста на трек молча не сработает — сервер не разберёт тело.
            // Content-Type руками не ставим: браузер сам допишет boundary
            uploadTrackCover: build.mutation<
                Images,
                { trackId: string; file: File }
            >({
                query: ({ trackId, file }) => {
                    const formData = new FormData();
                    formData.append('cover', file);

                    return {
                        method: 'POST',
                        url: `playlists/tracks/${trackId}/cover`,
                        body: formData,
                    };
                },

                async onQueryStarted({ trackId }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    // оптимистичного патча здесь не бывает: превью режет сервер
                    // и отдаёт готовый набор вариантов, угадать их урлы нечем.
                    // Поэтому кеш правим только после ответа, его же данными
                    try {
                        const { data } = await queryFulfilled;

                        const patches = [
                            ...trackListPatches(
                                lifecycleApi.getState(),
                                trackId,
                                (attributes) => {
                                    attributes.images = data;
                                }
                            ),
                            trackDetailsPatch(trackId, (draft) => {
                                draft.data.attributes.images = data;
                            }),
                        ];

                        patches.forEach((patch) => dispatch(patch));
                    } catch {
                        // тост уже показал handleErrors, кеш мы не трогали
                    }
                },

                // invalidatesTags нет намеренно, хотя тег Track существует:
                // в ответе уже лежат новые картинки, и перезапрашивать карточку
                // ради тех же данных незачем. Списку сброс всё равно не помог бы —
                // fetchTracks не отдаёт providesTags вовсе, а инвалидация всех
                // его загруженных страниц разом дороже самой загрузки файла
            }),

            // DELETE запрос
            // снимает обложку трека; сервер отвечает 204 без тела
            deleteTrackCover: build.mutation<void, { trackId: string }>({
                query: ({ trackId }) => ({
                    method: 'DELETE',
                    url: `playlists/tracks/${trackId}/cover`,
                }),

                async onQueryStarted({ trackId }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    try {
                        await queryFulfilled;

                        // после успешного 204 картинок не осталось ни одной,
                        // и это не догадка о состоянии сервера, а его результат.
                        // Пустой массив читатели понимают так же, как отсутствие
                        // поля: TrackCover покажет заглушку, кнопка удаления уйдёт
                        const patches = [
                            ...trackListPatches(
                                lifecycleApi.getState(),
                                trackId,
                                (attributes) => {
                                    attributes.images = { main: [] };
                                }
                            ),
                            trackDetailsPatch(trackId, (draft) => {
                                draft.data.attributes.images = { main: [] };
                            }),
                        ];

                        patches.forEach((patch) => dispatch(patch));
                    } catch {
                        // тост уже показал handleErrors, кеш мы не трогали
                    }
                },
            }),

            // POST запрос
            // создаёт трек из mp3; сервер отдаёт его целиком, как карточку
            // трек появляется черновиком — публикуется отдельной ручкой
            uploadTrack: build.mutation<
                GetTrackDetailsOutput,
                { title: string; file: File }
            >({
                query: ({ title, file }) => {
                    const formData = new FormData();
                    // имена полей из свагера: здесь title и file, а у обложки
                    // того же трека поле называется cover — копипаст не сработает
                    formData.append('title', title);
                    formData.append('file', file);

                    return {
                        method: 'POST',
                        url: 'playlists/tracks/upload',
                        body: formData,
                    };
                },

                // единственная мутация треков, которая сбрасывает тег, а не
                // патчит кеш руками: куда сервер поставит новый трек в текущей
                // сортировке, клиент не знает, а вставлять его наугад в начало
                // нельзя — те же записи кеша держат и общий список /tracks,
                // где чужому черновику не место. Загрузка редкая, один
                // перезапрос за неё не жалко
                invalidatesTags: [{ type: 'Track', id: 'LIST' }],
            }),

            // PUT запрос
            // правит трек: название, текст, дату релиза, теги и артистов
            // частичного обновления у этой ручки нет — сервер заменяет трек
            // целиком, поэтому форма обязана отправлять и то, что не трогали
            updateTrack: build.mutation<
                GetTrackDetailsOutput,
                { trackId: string; attributes: UpdateTrackAttributes }
            >({
                query: ({ trackId, attributes }) => ({
                    method: 'PUT',
                    url: `playlists/tracks/${trackId}`,
                    // body в RTK Query имеет тип any, без satisfies ошибку
                    // в конверте никто не поймает
                    body: {
                        data: { type: 'tracks', attributes },
                    } satisfies UpdateTrackRequestPayload,
                }),

                async onQueryStarted({ trackId }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    try {
                        const { data } = await queryFulfilled;

                        // карточку чиним ответом: он содержит трек целиком,
                        // и перезапрашивать её незачем
                        dispatch(
                            trackDetailsPatch(trackId, (draft) => {
                                draft.data = data.data;
                            })
                        );
                    } catch {
                        // тост уже показал handleErrors, кеш мы не трогали
                    }
                },

                // списки сбрасываем тегом, а не патчим руками: имена артистов
                // лежат не в атрибутах трека, а в included страницы, и точечная
                // правка там получается хрупкой. Правка трека — действие редкое
                // и осознанное, один перезапрос за неё не жалко
                invalidatesTags: [{ type: 'Track', id: 'LIST' }],
            }),

            // POST запрос
            // делает черновик публичным; 204 без тела
            // обратного действия в API нет: снять трек с публикации нельзя
            publishTrack: build.mutation<void, { trackId: string }>({
                query: ({ trackId }) => ({
                    method: 'POST',
                    url: `playlists/tracks/${trackId}/actions/publish`,
                }),

                async onQueryStarted({ trackId }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    try {
                        await queryFulfilled;

                        // пометку draft рисует isPublished, и это поле есть
                        // только в общем списке треков: в составе плейлиста
                        // его нет вовсе, поэтому общим trackListPatches
                        // здесь не обойтись
                        const patches = tracksApi.util
                            .selectCachedArgsForQuery(
                                lifecycleApi.getState(),
                                'fetchTracks'
                            )
                            .map((args) =>
                                tracksApi.util.updateQueryData(
                                    'fetchTracks',
                                    args,
                                    (draft) => {
                                        for (const page of draft.pages) {
                                            const track = page.data.find(
                                                (item) => item.id === trackId
                                            );

                                            if (track) {
                                                track.attributes.isPublished = true;
                                                break;
                                            }
                                        }
                                    }
                                )
                            );

                        patches.forEach((patch) => dispatch(patch));
                    } catch {
                        // 403 (чужой трек) и 409 (уже опубликован) показал handleErrors
                    }
                },

                // дату публикации проставляет сервер, а видна она в карточке —
                // её и сбрасываем: это один маленький запрос, в отличие от
                // сброса всех загруженных страниц списка
                invalidatesTags: (_result, _error, { trackId }) => [
                    { type: 'Track', id: trackId },
                ],
            }),

            // DELETE запрос
            // удаляет трек насовсем; из плейлистов он пропадает заодно
            // не путать с removeTrackFromPlaylist: та ручка оставляет трек жив
            deleteTrack: build.mutation<void, { trackId: string }>({
                query: ({ trackId }) => ({
                    method: 'DELETE',
                    url: `playlists/tracks/${trackId}`,
                }),

                async onQueryStarted({ trackId }, lifecycleApi) {
                    const { dispatch, queryFulfilled } = lifecycleApi;

                    try {
                        await queryFulfilled;

                        // строку убираем руками: providesTags у fetchTracks нет
                        // вовсе, а сброс всех подгруженных страниц ради одной
                        // исчезнувшей строки стоил бы дороже самого удаления
                        const state = lifecycleApi.getState();

                        const patches = [
                            ...tracksApi.util
                                .selectCachedArgsForQuery(state, 'fetchTracks')
                                .map((args) =>
                                    tracksApi.util.updateQueryData(
                                        'fetchTracks',
                                        args,
                                        (draft) => {
                                            for (const page of draft.pages) {
                                                const index =
                                                    page.data.findIndex(
                                                        (item) =>
                                                            item.id === trackId
                                                    );

                                                if (index !== -1) {
                                                    page.data.splice(index, 1);
                                                    break;
                                                }
                                            }
                                        }
                                    )
                                ),

                            ...tracksApi.util
                                .selectCachedArgsForQuery(
                                    state,
                                    'fetchPlaylistTracks'
                                )
                                .map((args) =>
                                    tracksApi.util.updateQueryData(
                                        'fetchPlaylistTracks',
                                        args,
                                        (draft) => {
                                            const index = draft.data.findIndex(
                                                (item) => item.id === trackId
                                            );

                                            if (index !== -1)
                                                draft.data.splice(index, 1);
                                        }
                                    )
                                ),
                        ];

                        patches.forEach((patch) => dispatch(patch));
                    } catch {
                        // тост уже показал handleErrors, кеш мы не трогали
                    }
                },

                // у карточек плейлистов меняются tracksCount и длительность,
                // а в каких плейлистах лежал трек, клиент не знает — поэтому
                // сбрасываем список целиком. Точечный тег Playlist подставить
                // не из чего, и счётчик в шапке открытой страницы плейлиста
                // обновится только при следующем запросе
                invalidatesTags: [{ type: 'Playlists', id: 'LIST' }],
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
    useUploadTrackCoverMutation,
    useDeleteTrackCoverMutation,
    useUpdateTrackMutation,
    usePublishTrackMutation,
    useDeleteTrackMutation,
    useUploadTrackMutation,
} = tracksApi;
