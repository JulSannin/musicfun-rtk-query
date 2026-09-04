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

    // хук отдает { pages, pageParams }; для списка страницы схлопываем в один массив
    const tracks = data?.pages.flatMap((page) => page.data) ?? [];

    const { observerRef } = useInfiniteScroll({
        hasNextPage,
        isFetching,
        fetchNextPage,
    });

    return {
        tracks,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
    };
};
