import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { playerActions, selectCurrentTrackId } from '@/entities/player';
import {
    DEFAULT_TRACK_SORT_BY,
    DEFAULT_TRACK_SORT_DIRECTION,
    useFetchTracksInfiniteQuery,
} from '@/entities/track';
import { toPlayerTracks } from './toPlayerTracks';

// подставляет в пустой плеер свежие треки, чтобы полоса внизу не встречала
// человека погашенными кнопками. Список плеер спрашивает сам: раньше это
// делала страница треков, и до захода на неё плеер оставался пустым
export const usePrimePlayer = () => {
    const dispatch = useDispatch();
    const currentTrackId = useSelector(selectCurrentTrackId);

    // аргументы ровно те же, что у страницы треков: ключ кеша совпадает,
    // и второго запроса за той же выдачей не будет
    const { data } = useFetchTracksInfiniteQuery(
        {
            sortBy: DEFAULT_TRACK_SORT_BY,
            sortDirection: DEFAULT_TRACK_SORT_DIRECTION,
        },
        {
            // как только в плеере что-то есть, список ему больше не нужен:
            // подписка снимается, и запрос уходит ровно один раз за сессию
            skip: Boolean(currentTrackId),
            // фоновые перезапросы плееру не нужны тем более: у infiniteQuery
            // они перезапрашивают все загруженные страницы разом
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }
    );

    useEffect(() => {
        if (currentTrackId || !data) return;

        // повторную подстановку отсечёт сам редьюсер: если трек уже выбран,
        // primeQueue ничего не делает
        dispatch(
            playerActions.primeQueue({ queue: toPlayerTracks(data.pages) })
        );
    }, [currentTrackId, data, dispatch]);
};
