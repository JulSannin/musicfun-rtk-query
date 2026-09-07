import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PlaylistCover, PlaylistInfo } from '@/entities/playlist';
import { PlaylistCoverActions } from '@/features/playlist-cover';
import { DeletePlaylistButton } from '@/features/playlist-delete';
import { PlayPlaylistButton } from '@/features/playlist-play';
import { PlaylistReactions } from '@/features/playlist-reaction';
import { UpdatePlaylistForm } from '@/features/playlist-update';
import { PlaylistTracks } from '@/widgets/playlist-tracks';
import { paths } from '@/shared/config';
import { usePlaylist } from '../model/usePlaylist';
import s from './PlaylistPage.module.css';

// страница одного плейлиста: обложка, описание и состав
// здесь, в отличие от карточки в списке, у плейлиста есть description —
// в ответе списка этого поля нет вовсе
export const PlaylistPage = () => {
    const { playlistId, attributes, isOwner, canReact, isLoading, isError } =
        usePlaylist();

    // форма редактирования вместо шапки; состояние страницы, как режим
    // редактирования в PlaylistsList
    const [isEditing, setIsEditing] = useState(false);

    const navigate = useNavigate();

    if (isLoading) return <div>Loading...</div>;

    // сюда попадаем и на 404, и на сетевой сбой; тост показал handleErrors
    if (isError || !playlistId || !attributes)
        return <div>Playlist not found</div>;

    return (
        <div>
            <Link to={paths.Playlists}>← All playlists</Link>

            {/* форма встаёт на место шапки, а не всей страницы: состав ниже
                остаётся на виду, как карточка в списке меняется на форму,
                а не прячет весь список. isOwner в условии не лишний — если
                разлогиниться с открытой формой, она схлопнется сама */}
            {isEditing && isOwner ? (
                <UpdatePlaylistForm
                    playlistId={playlistId}
                    onClose={() => setIsEditing(false)}
                />
            ) : (
                <div className={s.header}>
                    <div>
                        <PlaylistCover images={attributes.images} />
                        {isOwner && (
                            <PlaylistCoverActions
                                playlistId={playlistId}
                                images={attributes.images}
                            />
                        )}
                    </div>

                    <div>
                        <PlaylistInfo
                            title={attributes.title}
                            authorName={attributes.user.name}
                            tracksCount={attributes.tracksCount}
                            duration={attributes.duration}
                            tagNames={attributes.tags.map((tag) => tag.name)}
                            description={attributes.description}
                        />

                        <div className={s.actions}>
                            {/* кнопка сама решает, показываться ли: пустой
                                плейлист играть нечем */}
                            <PlayPlaylistButton playlistId={playlistId} />

                            {/* счётчики видит любой, кнопки активны у залогиненного */}
                            <PlaylistReactions
                                playlistId={playlistId}
                                likesCount={attributes.likesCount}
                                dislikesCount={attributes.dislikesCount}
                                currentUserReaction={
                                    attributes.currentUserReaction
                                }
                                canReact={canReact}
                            />

                            {isOwner && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        update
                                    </button>
                                    {/* после удаления оставаться на странице
                                    несуществующего плейлиста нельзя, а replace
                                    нужен, чтобы «назад» на неё не возвращал */}
                                    <DeletePlaylistButton
                                        playlistId={playlistId}
                                        onDeleted={() =>
                                            void navigate(paths.Playlists, {
                                                replace: true,
                                            })
                                        }
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* состав со своим запросом: страница отдаёт только id
                и уже посчитанное владение */}
            <PlaylistTracks
                playlistId={playlistId}
                isOwner={isOwner}
                canReact={canReact}
            />
        </div>
    );
};
