import { useGetMeQuery } from '@/entities/profile';
import {
    DEFAULT_TRACK_SORT_BY,
    DEFAULT_TRACK_SORT_DIRECTION,
    toTrackListItems,
    useFetchTracksInfiniteQuery,
} from '@/entities/track';
import { useInfiniteScroll, useTrackPanel } from '@/shared/lib';

// владеет списком собственных треков пользователя
// живёт в виджете, а не в pages/profile: список вместе с режимом
// редактирования — это одна склейка, и страница про неё знать не должна
export const useMyTracks = () => {
    const { data: me, isLoading: isMeLoading } = useGetMeQuery();

    // подробности трека раскрываются той же панелью, что и со страницы треков
    const { openTrack } = useTrackPanel();

    const {
        data,
        isLoading,
        isError,
        isFetching,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useFetchTracksInfiniteQuery(
        {
            userId: me?.userId,
            // черновики сервер отдаёт, только если userId совпадает с текущим
            // пользователем, — здесь это всегда так, и без флага своих
            // неопубликованных треков человек не увидел бы вовсе
            includeDrafts: true,
            // умолчания те же, что у страницы треков и у плеера
            sortBy: DEFAULT_TRACK_SORT_BY,
            sortDirection: DEFAULT_TRACK_SORT_DIRECTION,
        },
        {
            // без skip первый запрос ушёл бы с userId: undefined и притащил
            // чужие треки — тот же приём, что в useProfile
            skip: !me?.userId,
            // как и на странице треков: по возврату фокуса RTK Query
            // перезапросил бы все загруженные страницы разом
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }
    );

    // страницы схлопывает и имена артистов из included подставляет
    // общий разбор из entities/track
    const items = data ? toTrackListItems(data.pages) : [];

    const { observerRef } = useInfiniteScroll({
        hasNextPage,
        isFetching,
        fetchNextPage,
    });

    return {
        items,
        onTrackSelect: openTrack,
        // пока не приехал me, skip активен и собственный isLoading запроса false —
        // без isMeLoading список успел бы моргнуть пустым
        isLoading: isMeLoading || isLoading,
        isError,
        // подгрузка следующей страницы список не заменяет, а дополняет:
        // гасить его в этот момент неправильно
        isReloading: isFetching && !isFetchingNextPage,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
    };
};
