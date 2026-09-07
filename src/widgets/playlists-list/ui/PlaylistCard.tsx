import type { PlaylistListItemResource } from '@/entities/playlist';
import { PlaylistCover, PlaylistInfo } from '@/entities/playlist';
import { PlaylistCoverActions } from '@/features/playlist-cover';
import { DeletePlaylistButton } from '@/features/playlist-delete';
import { PlaylistReactions } from '@/features/playlist-reaction';
import { playlistPath } from '@/shared/config';
import s from './PlaylistCard.module.css';

type Props = {
    // тип берем от списка, а не от карточки: данные приходят из fetchPlaylists
    // в списке нет description, и это ограничение источника, а не недосмотр
    playlist: PlaylistListItemResource;
    // владелец ли текущий пользователь; считается один раз в списке,
    // чтобы не дёргать getMe в каждой карточке
    // на /playlists это фильтр, на /profile всегда true
    isOwner: boolean;
    // залогинен ли пользователь; считается там же, где isOwner
    // реагировать можно и на чужой плейлист, поэтому флаг отдельный
    canReact: boolean;
    // onEdit ничего не обновляет, он переключает режим показа карточки
    // это состояние списка, поэтому живет наверху, а сюда приходит колбэком
    onEdit: (id: string) => void;
};

// карточка одного плейлиста в списке
// внутренняя часть виджета playlists-list, через его index.ts наружу не уходит
// лежит в widgets, а не в entities: собирает вместе презентацию из entities
// и действия из features, а энтити импортировать фичи не имеет права
export const PlaylistCard = ({
    playlist,
    isOwner,
    canReact,
    onEdit,
}: Props) => {
    return (
        <div className={s.card}>
            {/* обложку и название видят все, действия над плейлистом — только владелец */}
            {/* прячем не ради безопасности: на чужой плейлист бэкенд всё равно ответит 403 */}
            <PlaylistCover images={playlist.attributes.images} />
            {isOwner && (
                <div className={s.actions}>
                    <PlaylistCoverActions
                        playlistId={playlist.id}
                        images={playlist.attributes.images}
                    />
                </div>
            )}

            <PlaylistInfo
                // название ведёт на страницу плейлиста, а CSS растягивает эту
                // ссылку на всю карточку — кликом открывается вся карточка.
                // Адрес собирает карточка, сама энтити про роутер не знает
                to={playlistPath(playlist.id)}
                title={playlist.attributes.title}
                authorName={playlist.attributes.user.name}
                tracksCount={playlist.attributes.tracksCount}
                duration={playlist.attributes.duration}
                tagNames={playlist.attributes.tags.map((tag) => tag.name)}
            />

            <div className={s.actions}>
                {/* счётчики видит любой, кнопки активны только у залогиненного */}
                <PlaylistReactions
                    playlistId={playlist.id}
                    likesCount={playlist.attributes.likesCount}
                    dislikesCount={playlist.attributes.dislikesCount}
                    currentUserReaction={
                        playlist.attributes.currentUserReaction
                    }
                    canReact={canReact}
                />

                {isOwner && (
                    <>
                        {/* id подставляем здесь: наверху знают только "какой-то плейлист", */}
                        {/* а карточка знает, какой именно */}
                        <button onClick={() => onEdit(playlist.id)}>
                            update
                        </button>
                        <DeletePlaylistButton playlistId={playlist.id} />
                    </>
                )}
            </div>
        </div>
    );
};
