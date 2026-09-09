import { useState } from 'react';
import { useFetchPlaylistsQuery } from '@/entities/playlist';

type Props = {
    enabled: boolean;
};

// владеет списком понравившихся плейлистов и его пагинацией
// лайкнуть можно сколько угодно чужих плейлистов, поэтому в одну страницу
// они, в отличие от своих на профиле, не влезают
export const useLikedPlaylists = ({ enabled }: Props) => {
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(8);

    const { data, isLoading, isFetching, isError } = useFetchPlaylistsQuery(
        {
            onlyLikedByMe: true,
            pageNumber: page,
            pageSize,
        },
        {
            // за скрытой вкладкой не ходим, гостю сервер ответит 401.
            // Хук при этом зовут всегда: он живёт на уровне страницы,
            // и номер страницы переживает переключение вкладок
            skip: !enabled,
        }
    );

    // размер страницы меняет и их количество: остаться на пятой нельзя
    const pageSizeHandler = (size: number) => {
        setPageSize(size);
        setPage(1);
    };

    // снятый лайк уменьшает список, и текущий номер может оказаться за концом —
    // съезжаем на последнюю. Правим на рендере, а не эффектом: React выбросит
    // этот проход до коммита, лишнего запроса за несуществующую страницу не будет
    if (data && data.meta.pagesCount > 0 && page > data.meta.pagesCount) {
        setPage(data.meta.pagesCount);
    }

    return {
        playlists: data?.data,
        // до первого ответа страниц не знаем, а если ничего не лайкнуто,
        // их ноль — номера тогда не отрисуются
        pagesCount: data?.meta.pagesCount ?? 1,
        page,
        pageSize,
        isLoading,
        isFetching,
        isError,
        onPageChange: setPage,
        onPageSizeChange: pageSizeHandler,
    };
};
