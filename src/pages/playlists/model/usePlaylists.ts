import { useState } from 'react';
import {
    useFetchPlaylistsQuery,
    type PlaylistSortBy,
} from '@/entities/playlist';
import { useGetMeQuery } from '@/entities/profile';
import type { SortDirection, TagRef } from '@/shared/api';
import { useDebounce } from '@/shared/lib';

// владеет параметрами списка плейлистов и самим запросом
export const usePlaylists = () => {
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(8);

    // сырое значение инпута, нужно только для отрисовки поля
    const [search, setSearch] = useState<string>('');

    const [tags, setTags] = useState<TagRef[]>([]);

    // значение для запроса: обновляется, когда человек перестал печатать
    const debouncedSearch = useDebounce(search);

    const [sortBy, setSortBy] = useState<PlaylistSortBy>('addedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [onlyLikedByMe, setOnlyLikedByMe] = useState<boolean>(false);

    // новый запрос не уходит: Header подписан на getMe всегда, читается тот же кеш
    const { data: me } = useGetMeQuery();

    // фильтр по лайкам работает только у залогиненного: гостю сервер ответит 401
    // флаг не только прячет чекбокс, но и гасит уже включённый фильтр,
    // если разлогинились с ним — иначе следующий запрос ушёл бы в 401
    const canFilterByLikes = Boolean(me);
    const likedFilter = canFilterByLikes && onlyLikedByMe;

    // каждый набор аргументов кешируется отдельно, поэтому возврат на страницу мгновенный
    const { data, isError, isLoading, isFetching } = useFetchPlaylistsQuery({
        pageNumber: page,
        // trim и undefined, чтобы " abc", "abc" и "" не плодили лишние ключи кеша
        search: debouncedSearch.trim() || undefined,
        pageSize,
        sortBy,
        sortDirection,
        // false тоже ушёл бы в урл и завёл лишнюю запись кеша
        onlyLikedByMe: likedFilter || undefined,
        tagsIds: tags.length ? tags.map((tag) => tag.id) : undefined,
    });

    // страницу сбрасываем сразу: иначе останемся на пятой странице результатов, которых одна
    const searchHandler = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    // сброс по той же причине, что и при поиске
    const pageSizeHandler = (size: number) => {
        setPageSize(size);
        setPage(1);
    };

    // порядок и фильтр меняют и состав списка, и количество страниц — тоже с первой
    const sortByHandler = (value: PlaylistSortBy) => {
        setSortBy(value);
        setPage(1);
    };

    const sortDirectionHandler = (value: SortDirection) => {
        setSortDirection(value);
        setPage(1);
    };

    const onlyLikedByMeHandler = (value: boolean) => {
        setOnlyLikedByMe(value);
        setPage(1);
    };

    const tagsHandler = (next: TagRef[]) => {
        setTags(next);
        setPage(1);
    };

    // после удаления страниц может стать меньше текущего номера — съезжаем на последнюю
    // правим на рендере, а не эффектом: React выбросит этот проход до коммита, без лишнего запроса
    if (data && data.meta.pagesCount > 0 && page > data.meta.pagesCount) {
        setPage(data.meta.pagesCount);
    }

    return {
        playlists: data?.data,
        // до первого ответа страниц не знаем, а если поиск ничего не нашел, их ноль — номера не отрисуются
        pagesCount: data?.meta.pagesCount ?? 1,
        isError,
        isLoading,
        isFetching,
        page,
        pageSize,
        search,
        sortBy,
        sortDirection,
        onlyLikedByMe: likedFilter,
        canFilterByLikes,
        // сами теги отдаём наружу: пикер контролируемый, ему нужно value
        tags,
        onPageChange: setPage,
        onSearchChange: searchHandler,
        onPageSizeChange: pageSizeHandler,
        onSortByChange: sortByHandler,
        onSortDirectionChange: sortDirectionHandler,
        onOnlyLikedByMeChange: onlyLikedByMeHandler,
        onTagsChange: tagsHandler,
    };
};
