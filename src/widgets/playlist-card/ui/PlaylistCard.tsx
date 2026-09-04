import type { PlaylistListItemResource } from '@/entities/playlist';
import { PlaylistInfo } from '@/entities/playlist';
import { PlaylistCover } from '@/features/playlist-cover';
import { DeletePlaylistButton } from '@/features/playlist-delete';

type Props = {
    // тип берем от списка, а не от карточки: данные приходят из fetchPlaylists
    // в списке нет description, и это ограничение источника, а не недосмотр
    playlist: PlaylistListItemResource;
    // onEdit ничего не обновляет, он переключает режим показа карточки
    // это состояние списка, поэтому живет наверху, а сюда приходит колбэком
    onEdit: (id: string) => void;
};

// карточка одного плейлиста в списке
// это виджет, а не энтити: он собирает вместе презентацию из entities
// и действия из features, а энтити импортировать фичи не имеет права
export const PlaylistCard = ({ playlist, onEdit }: Props) => {
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
            <DeletePlaylistButton playlistId={playlist.id} />
        </>
    );
};
