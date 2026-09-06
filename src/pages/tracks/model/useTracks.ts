import { useFetchTracksInfiniteQuery } from '@/entities/track';
import { useInfiniteScroll } from '@/shared/lib';

// владеет бесконечным запросом треков и наблюдателем за концом списка
export const useTracks = () => {
    const {
        data,
        isLoading,
        isError,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useFetchTracksInfiniteQuery(undefined, {
        // в baseApi фоновые перезапросы включены, но здесь они вредны:
        // при возврате фокуса RTK Query перезапрашивает ВСЕ загруженные страницы
        // подряд, то есть после десяти подгрузок это десять запросов на каждое
        // переключение вкладки
        refetchOnFocus: false,
        refetchOnReconnect: false,
    });

    // имена артистов лежат в included каждой страницы, в самом треке только их id
    // собираем один общий словарь по всем подгруженным страницам
    const artistNameById = new Map<string, string>(
        data?.pages
            .flatMap((page) => page.included)
            .map((artist) => [artist.id, artist.attributes.name] as const)
    );

    // хук отдает { pages, pageParams }; для списка страницы схлопываем в один массив
    const items =
        data?.pages
            .flatMap((page) => page.data)
            .map((track) => ({
                track,
                // артист мог не приехать в included — filter убирает такие дырки,
                // чтобы в разметке не появилось undefined
                artistNames: track.relationships.artists.data
                    .map(({ id }) => artistNameById.get(id))
                    // предикат явный: get у Map возвращает string | undefined,
                    // и без него отфильтрованный массив остался бы с undefined в типе
                    .filter((name): name is string => Boolean(name)),
            })) ?? [];

    const { observerRef } = useInfiniteScroll({
        hasNextPage,
        isFetching,
        fetchNextPage,
    });

    return {
        items,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
    };
};
