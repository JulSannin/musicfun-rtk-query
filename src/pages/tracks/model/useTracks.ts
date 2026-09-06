import { useState } from 'react';
import {
    useFetchTracksInfiniteQuery,
    type TrackSortBy,
} from '@/entities/track';
import { useGetMeQuery } from '@/entities/profile';
import type { SortDirection, TagRef } from '@/shared/api';
import { useDebounce, useInfiniteScroll } from '@/shared/lib';

// владеет параметрами списка треков, бесконечным запросом
// и наблюдателем за концом списка
export const useTracks = () => {
    // сырое значение инпута, нужно только для отрисовки поля
    const [search, setSearch] = useState<string>('');

    // значение для запроса: обновляется, когда человек перестал печатать
    const debouncedSearch = useDebounce(search);

    const [sortBy, setSortBy] = useState<TrackSortBy>('publishedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [tags, setTags] = useState<TagRef[]>([]);
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
        onOnlyLikedByMeChange: setOnlyLikedByMe,
        onOnlyMineChange: setOnlyMine,
    };
};
