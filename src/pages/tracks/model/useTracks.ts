import { useState } from 'react';
import {
    DEFAULT_TRACK_SORT_BY,
    DEFAULT_TRACK_SORT_DIRECTION,
    toTrackListItems,
    useFetchTracksInfiniteQuery,
    type TrackSortBy,
} from '@/entities/track';
import { useGetMeQuery } from '@/entities/profile';
import { toPlayerTracks } from '@/entities/player';
import type { ArtistRef, SortDirection, TagRef } from '@/shared/api';
import { useDebounce, useInfiniteScroll, useTrackPanel } from '@/shared/lib';

// владеет параметрами списка треков, бесконечным запросом
// и наблюдателем за концом списка
export const useTracks = () => {
    // страница только открывает панель; рисует её app рядом с плеером,
    // потому что подробности трека не привязаны к этой странице
    const { openTrack } = useTrackPanel();

    // сырое значение инпута, нужно только для отрисовки поля
    const [search, setSearch] = useState<string>('');

    // значение для запроса: обновляется, когда человек перестал печатать
    const debouncedSearch = useDebounce(search);

    // умолчания те же, что просит плеер: так обе подписки попадают
    // в одну запись кеша и запрос уходит один
    const [sortBy, setSortBy] = useState<TrackSortBy>(DEFAULT_TRACK_SORT_BY);
    const [sortDirection, setSortDirection] = useState<SortDirection>(
        DEFAULT_TRACK_SORT_DIRECTION
    );
    const [tags, setTags] = useState<TagRef[]>([]);
    const [artists, setArtists] = useState<ArtistRef[]>([]);
    const [onlyLikedByMe, setOnlyLikedByMe] = useState<boolean>(false);
    const [onlyMine, setOnlyMine] = useState<boolean>(false);

    // новый запрос не уходит: Header подписан на getMe всегда, читается тот же кеш
    const { data: me } = useGetMeQuery();

    // оба фильтра завязаны на пользователя: гостю показывать их нечем
    // флаг не только прячет чекбоксы, но и гасит уже включённый фильтр,
    // если разлогинились с ним
    const canFilterByUser = Boolean(me);
    const likedFilter = canFilterByUser && onlyLikedByMe;
    const mineFilter = canFilterByUser && onlyMine;

    // сам запрос списка фильтр по артистам разрешает и гостю, но искать
    // артистов гость не может: artists/search отвечает 401 (проверено).
    // Поэтому пикер прячем, а выбранных заодно гасим — иначе после разлогина
    // остался бы включённый фильтр, который нечем снять
    const artistsFilter = canFilterByUser ? artists : [];

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
            // trim и undefined, чтобы " abc", "abc" и "" не плодили лишние ключи кеша
            search: debouncedSearch.trim() || undefined,
            sortBy,
            sortDirection,
            tagsIds: tags.length ? tags.map((tag) => tag.id) : undefined,
            artistsIds: artistsFilter.length
                ? artistsFilter.map((artist) => artist.id)
                : undefined,
            // false тоже ушёл бы в урл и завёл лишнюю запись кеша
            onlyLikedByMe: likedFilter || undefined,
            // includeDrafts работает только в паре с собственным userId,
            // поэтому оба параметра ставит один переключатель:
            // по смыслу это «только мои треки, вместе с черновиками»
            userId: mineFilter ? me?.userId : undefined,
            includeDrafts: mineFilter || undefined,
        },
        {
            // в baseApi фоновые перезапросы включены, но здесь они вредны:
            // при возврате фокуса RTK Query перезапрашивает ВСЕ загруженные страницы
            // подряд, то есть после десяти подгрузок это десять запросов на каждое
            // переключение вкладки
            refetchOnFocus: false,
            refetchOnReconnect: false,
        }
    );

    // хук отдаёт { pages, pageParams }; схлопывание страниц и подстановку
    // имён артистов из included делает общий разбор в entities/track —
    // тот же, которым пользуются свои треки и библиотека
    const items = data ? toTrackListItems(data.pages) : [];

    // очередь для плеера: снимки, а не ссылки на кеш — запись fetchTracks живёт
    // под своим набором аргументов и пропадёт после смены фильтров, а начатый
    // трек обязан доиграть. Сборку держит виджет плеера: он же подставляет
    // себе очередь при старте приложения, и копии этой логики быть не должно
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
        // список меняется целиком только при смене фильтров; подгрузка страницы
        // его дополняет, и гасить его в этот момент нечестно
        isReloading: isFetching && !isFetchingNextPage,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
        search,
        sortBy,
        sortDirection,
        tags,
        artists: artistsFilter,
        onlyLikedByMe: likedFilter,
        onlyMine: mineFilter,
        canFilterByUser,
        // тот же Boolean(me), но отвечает на другой вопрос: не «показывать ли
        // фильтры», а «активны ли кнопки реакций». Считается один раз на весь
        // список, а не хуком в каждом треке — как isOwner в PlaylistsList
        canReact: canFilterByUser,
        // сеттеры уходят наружу напрямую, без обёрток: у infiniteQuery смена
        // аргументов сама заводит новую запись кеша со своей первой страницей,
        // сбрасывать номер страницы, как в usePlaylists, здесь нечего
        onSearchChange: setSearch,
        onSortByChange: setSortBy,
        onSortDirectionChange: setSortDirection,
        onTagsChange: setTags,
        onArtistsChange: setArtists,
        onOnlyLikedByMeChange: setOnlyLikedByMe,
        onOnlyMineChange: setOnlyMine,
    };
};
