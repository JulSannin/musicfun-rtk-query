import { useState } from 'react';
import { useFetchPlaylistsQuery } from '@/entities/playlist';
import { useDebounce } from '@/shared/lib';

// владеет параметрами списка плейлистов и самим запросом
export const usePlaylists = () => {
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(4);

    // сырое значение инпута, нужно только для отрисовки поля
    const [search, setSearch] = useState<string>('');

    // значение для запроса: обновляется, когда человек перестал печатать
    const debouncedSearch = useDebounce(search);

    // каждый набор аргументов кешируется отдельно, поэтому возврат на страницу мгновенный
    const { data, isError, isLoading, isFetching } = useFetchPlaylistsQuery({
        pageNumber: page,
        // trim и undefined, чтобы " abc", "abc" и "" не плодили лишние ключи кеша
        search: debouncedSearch.trim() || undefined,
        pageSize,
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
        onPageChange: setPage,
        onSearchChange: searchHandler,
        onPageSizeChange: pageSizeHandler,
    };
};
