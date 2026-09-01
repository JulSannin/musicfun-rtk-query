import type { PlaylistListItemResource } from '@/features/playlists/api/playlistsApi.types'
import { useDeletePlaylistMutation } from '@/features/playlists/api/playlistsApi'
import { PlaylistCover } from './PlaylistCover/PlaylistCover'
import { PlaylistInfo } from './PlaylistInfo/PlaylistInfo'
import { toast } from 'react-toastify'

type Props = {
    // тип берем от списка, а не от карточки: данные приходят из fetchPlaylists
    // в списке нет description, и это ограничение источника, а не недосмотр
    playlist: PlaylistListItemResource
    // onEdit ничего не обновляет, он переключает режим показа карточки
    // это состояние списка, поэтому живет наверху, а сюда приходит колбэком
    onEdit: (id: string) => void
}
// карточка одного плейлиста в списке
// удаление живет здесь же, рядом со своей кнопкой:
// пробрасывать мутацию сверху незачем, карточка знает свой плейлист
export const PlaylistItem = ({ playlist, onEdit }: Props) => {
    const [deletePlaylist] = useDeletePlaylistMutation()

    // обработчик удаления плейлиста
    // удаляет плейлист после подтверждения пользователя
    // confirm нативный намеренно: это вопрос, а не уведомление
    // API разрешает удалять только свои плейлисты, отсюда catch
    const deletePlaylistHandler = () => {
        if (confirm('Are you sure you want to delete the playlist?')) {
            deletePlaylist(playlist.id)
                .unwrap()
                // ошибку показываем тостом, как и везде в проекте
                .catch(() => toast.error('Failed to delete the playlist'))
        }
    }

    return (
        <>
            {/* детям отдаем только те поля, которые они рисуют, а не весь плейлист: */}
            {/* по пропсам сразу видно, что каждому из них нужно */}
            <PlaylistCover
                playlistId={playlist.id}
                images={playlist.attributes.images}
            />
            <PlaylistInfo
                title={playlist.attributes.title}
                authorName={playlist.attributes.user.name}
            />
            {/* id подставляем здесь: наверху знают только "какой-то плейлист", */}
            {/* а карточка знает, какой именно */}
            <button onClick={() => onEdit(playlist.id)}>update</button>
            {/* хендлер без аргументов, поэтому передаем ссылку, а не стрелку */}
            <button onClick={deletePlaylistHandler}>delete</button>
        </>
    )
}
