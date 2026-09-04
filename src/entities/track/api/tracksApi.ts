import { baseApi } from '@/shared/api';
import type { GetTrackListOutput } from './tracksApi.types';

// треки листаются курсором, а не номерами страниц: список пополняется,
// и при offset-пагинации новый трек сдвинул бы все остальные вниз —
// на второй странице показался бы дубль с первой
export const tracksApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // infiniteQuery, а не query: RTK Query сам копит страницы в одной записи
        // кеша и отдает их как { pages, pageParams }
        // три параметра типа: ответ одной страницы, аргумент хука, тип курсора
        fetchTracks: build.infiniteQuery<
            GetTrackListOutput,
            void,
            string | undefined
        >({
            infiniteQueryOptions: {
                // первую страницу просим без курсора
                // именно undefined, а не null: fetchBaseQuery выбрасывает из params
                // только undefined, а null ушел бы в урл строкой "?cursor=null"
                initialPageParam: undefined,

                // курсор следующей страницы лежит в ответе предыдущей;
                // на последней сервер отдает null, RTK Query это видит
                // и переводит hasNextPage в false
                getNextPageParam: (lastPage) =>
                    lastPage.meta.nextCursor ?? undefined,
            },

            query: ({ pageParam }) => ({
                method: 'GET',
                url: 'playlists/tracks',
                params: {
                    // без этого флага сервер вернет обычные страницы,
                    // а nextCursor всегда будет null
                    paginationType: 'cursor',
                    // сервер принимает от 0 до 20
                    pageSize: 10,
                    cursor: pageParam,
                },
            }),
        }),
    }),
});

// у infiniteQuery имя хука собирается иначе: use + имя эндпоинта + InfiniteQuery
export const { useFetchTracksInfiniteQuery } = tracksApi;
