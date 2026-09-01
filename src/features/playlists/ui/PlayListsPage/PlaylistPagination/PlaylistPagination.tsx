import type { JsonApiMetaWithPaging } from '@/features/playlists/api/playlistsApi.types'

type Props = {
    // page это наше состояние, meta.page это то, что реально отдал сервер
    // расходятся они ровно в момент запроса, пока новая страница не пришла
    page: number
    setPage: (page: number) => void
    // берем только meta, а не весь ответ:
    // компоненту не нужно знать, как устроен список
    meta: JsonApiMetaWithPaging
}

// переключение страниц списка
// количество страниц берем из meta, которую отдает сервер
// сам компонент ничего не запрашивает: он только двигает состояние наверху
export const PlaylistPagination = ({ page, setPage, meta }: Props) => {
    return (
        <>
            {/* на краях списка кнопки блокируем */}
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                prev
            </button>
            {/* показываем именно meta.page: это страница, данные которой на экране */}
            <span>
                {meta.page} of {meta.pagesCount}
            </span>
            <button
                disabled={page === meta.pagesCount}
                onClick={() => setPage(page + 1)}
            >
                next
            </button>
        </>
    )
}
