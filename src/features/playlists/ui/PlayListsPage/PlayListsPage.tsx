import {useState} from "react";
import {CreatePlaylistForm} from "./CreatePlaylistForm/CreatePlaylistForm";
import {UpdatePlaylistForm} from "./UpdatePlaylistForm/UpdatePlaylistForm";
import {PlaylistItem} from "./PlaylistItem/PlaylistItem";
import {PlaylistPagination} from "./PlaylistPagination/PlaylistPagination";
import {
    useDeletePlaylistMutation,
    useFetchPlaylistsQuery,
} from "../../api/playlistsApi";
import s from "./PlayListsPage.module.css";

// страница со списком плейлистов
// хранит состояние списка, сами карточки и формы вынесены в дочерние компоненты
export const PlayListsPage = () => {
    // state, хранит id плейлиста, который сейчас редактируем
    // если id выбран, вместо карточки покажем форму редактирования
    const [playlistId, setPlaylistId] = useState<string | null>(null);

    // state, хранит номер текущей страницы списка
    const [page, setPage] = useState<number>(1);

    // RTK Query хук, получает список плейлистов для рендеринга
    // каждая страница кешируется отдельно, поэтому возврат назад мгновенный
    const {data, isLoading, isFetching, isError} = useFetchPlaylistsQuery({
        pageNumber: page,
    });

    const [deletePlaylist] = useDeletePlaylistMutation();

    // обработчик удаления плейлиста
    // удаляет плейлист после подтверждения пользователя
    // API разрешает удалять только свои плейлисты, отсюда catch
    const deletePlaylistHandler = (id: string) => {
        if (confirm("Are you sure you want to delete the playlist?")) {
            deletePlaylist(id)
                .unwrap()
                .catch(() => alert("Не удалось удалить плейлист"));
        }
    };

    // кнопки переключения страниц
    // вынесены в переменную, потому что нужны и в обычной разметке, и на экране ошибки
    const pagination = data?.meta ? (
        <PlaylistPagination page={page} setPage={setPage} meta={data.meta} />
    ) : null;

    // isLoading true только при самой первой загрузке
    // при переключении страниц список остается на экране
    if (isLoading) {
        return <div>Loading...</div>;
    }

    // без этой ветки упавший запрос выглядел бы как "плейлистов нет"
    // пагинацию оставляем, чтобы можно было вернуться на рабочую страницу
    if (isError) {
        return (
            <>
                <div>Не удалось загрузить плейлисты</div>
                {pagination}
            </>
        );
    }

    return (
        <div className={s.container}>
            <h1>Playlists page</h1>

            <CreatePlaylistForm />

            {isFetching ? (
                <div>Loading...</div>
            ) : (
                <div className={s.items}>
                    {data?.data.map((playlist) => {
                        // проверяем, редактируется ли текущий плейлист
                        const isEditing = playlistId === playlist.id;
                        return (
                            <div className={s.item} key={playlist.id}>
                                {/* редактируем этот плейлист — показываем форму, */}
                                {/* иначе обычную карточку */}
                                {isEditing ? (
                                    <UpdatePlaylistForm
                                        selectedPlaylistId={playlistId}
                                        onPlaylistSelect={setPlaylistId}
                                    />
                                ) : (
                                    <PlaylistItem
                                        playlist={playlist}
                                        onUpdate={setPlaylistId}
                                        onDelete={deletePlaylistHandler}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            {pagination}
        </div>
    );
};
