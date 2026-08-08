import type {JsonApiMetaWithPaging} from "@/features/playlists/api/playlistsApi.types";

type Props = {
    page: number;
    setPage: (page: number) => void;
    // берем только meta, а не весь ответ:
    // компоненту не нужно знать, как устроен список
    meta: JsonApiMetaWithPaging;
};

// переключение страниц списка
// количество страниц берем из meta, которую отдает сервер
export const PlaylistPagination = ({page, setPage, meta}: Props) => {
    return (
        <>
            {/* на краях списка кнопки блокируем */}
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                назад
            </button>
            <span>
                {meta.page} из {meta.pagesCount}
            </span>
            <button
                disabled={page === meta.pagesCount}
                onClick={() => setPage(page + 1)}
            >
                вперёд
            </button>
        </>
    );
};
