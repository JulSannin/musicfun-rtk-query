import { useDeletePlaylistMutation } from '@/entities/playlist';
import { toast } from 'react-toastify';

type Props = {
    // мутации нужен только id, весь плейлист сюда не передаем
    playlistId: string;
};

// кнопка удаления плейлиста вместе со своей мутацией
// вынесена из карточки: карточка теперь только компонует, а не мутирует
export const DeletePlaylistButton = ({ playlistId }: Props) => {
    const [deletePlaylist] = useDeletePlaylistMutation();

    // обработчик удаления плейлиста
    // удаляет плейлист после подтверждения пользователя
    // confirm нативный намеренно: это вопрос, а не уведомление
    // API разрешает удалять только свои плейлисты, отсюда catch
    const deletePlaylistHandler = () => {
        if (confirm('Are you sure you want to delete the playlist?')) {
            deletePlaylist(playlistId)
                .unwrap()
                // ошибку показываем тостом, как и везде в проекте
                .catch(() => toast.error('Failed to delete the playlist'));
        }
    };

    // хендлер без аргументов, поэтому передаем ссылку, а не стрелку
    return <button onClick={deletePlaylistHandler}>delete</button>;
};
