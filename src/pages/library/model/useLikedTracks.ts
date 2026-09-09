import { toPlayerTracks } from '@/entities/player';
import {
    DEFAULT_TRACK_SORT_BY,
    DEFAULT_TRACK_SORT_DIRECTION,
    toTrackListItems,
    useFetchTracksInfiniteQuery,
} from '@/entities/track';
import { useInfiniteScroll, useTrackPanel } from '@/shared/lib';

type Props = {
    // секция скрыта или человек ещё не опознан — запрос не нужен
    enabled: boolean;
};

// владеет списком понравившихся треков
// отдельный хук, а не ветка в useLibrary: у треков курсорная подгрузка
// со своим наблюдателем, у плейлистов — номера страниц, и мешать их в одном
// файле незачем
export const useLikedTracks = ({ enabled }: Props) => {
    // подробности раскрываются той же панелью, что и со страницы треков
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
            onlyLikedByMe: true,
            // умолчания берём из тех же констант, что страница треков:
            // ключ кеша RTK Query это аргумент, и при совпадении библиотека
            // читает ту же запись, что /tracks с включённым чекбоксом —
            // переход между ними проходит вообще без запроса
            sortBy: DEFAULT_TRACK_SORT_BY,
            sortDirection: DEFAULT_TRACK_SORT_DIRECTION,
        },
        {
            // за скрытой вкладкой не ходим; гостю тут ловить нечего —
            // onlyLikedByMe без токена это 401
            skip: !enabled,
            // как и на странице треков: по возврату фокуса RTK Query
            // перезапросил бы все загруженные страницы разом
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }
    );

    const items = data ? toTrackListItems(data.pages) : [];

    // очередь плеера — снимки, а не ссылки на кеш: запись живёт под своим
    // набором аргументов, а начатый трек обязан доиграть
    const queue = data ? toPlayerTracks(data.pages) : [];

    const { observerRef } = useInfiniteScroll({
        hasNextPage,
        isFetching,
        fetchNextPage,
    });

    return {
        items,
        queue,
        onTrackSelect: openTrack,
        isLoading,
        isError,
        // подгрузка следующей страницы список не заменяет, а дополняет:
        // гасить его в этот момент неправильно
        isReloading: isFetching && !isFetchingNextPage,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
    };
};
