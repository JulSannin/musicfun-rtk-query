import { useDeletePlaylistMutation } from '@/entities/playlist';

type Props = {
    // мутации нужен только id, весь плейлист сюда не передаем
    playlistId: string;
    // зовётся только после успеха; нужен странице плейлиста, чтобы уйти
    // со страницы удалённого. В списке не передаётся — там уходить некуда
    onDeleted?: () => void;
};

// кнопка удаления плейлиста вместе со своей мутацией
// вынесена из карточки: карточка теперь только компонует, а не мутирует
export const DeletePlaylistButton = ({ playlistId, onDeleted }: Props) => {
    const [deletePlaylist] = useDeletePlaylistMutation();

    // обработчик удаления плейлиста
    // удаляет плейлист после подтверждения пользователя
    // confirm нативный намеренно: это вопрос, а не уведомление
    // API разрешает удалять только свои плейлисты, отсюда catch
    const deletePlaylistHandler = () => {
        if (confirm('Are you sure you want to delete the playlist?')) {
            deletePlaylist(playlistId)
                .unwrap()
                // только после успеха: на 403 уходить со страницы нечестно,
                // плейлист остался на месте
                .then(() => onDeleted?.())
                // catch пустой намеренно: тост уже показал handleErrors
                // в baseQueryWithReauth, здесь только глушим промис
                .catch(() => {});
        }
    };

    // хендлер без аргументов, поэтому передаем ссылку, а не стрелку
    return <button onClick={deletePlaylistHandler}>delete</button>;
};
