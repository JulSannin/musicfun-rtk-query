import { TrackCover, useFetchPlaylistTracksQuery } from '@/entities/track';
import { AddTrackToPlaylist } from '@/features/playlist-track-add';
import { PlaylistTrackActions } from '@/features/playlist-track-actions';
import { PlayTrackButton } from '@/features/track-play';
import { TrackReactions } from '@/features/track-reaction';
import { toPlayerTracks } from '@/entities/player';
import { CurrentUserReaction } from '@/shared/api';
import { formatDuration, useTrackPanel } from '@/shared/lib';
import s from './PlaylistTracks.module.css';

type Props = {
    playlistId: string;
    // владельца считает страница: у неё уже есть и плейлист, и getMe
    isOwner: boolean;
    // залогинен ли пользователь; считается там же, где isOwner.
    // Реагировать можно и на чужой плейлист, поэтому флаг отдельный
    canReact: boolean;
};

// состав плейлиста
// виджет, потому что склеивает презентацию из entities с тремя фичами
// и сам ходит за данными; состав виден и гостю — ручка живёт на API-KEY
export const PlaylistTracks = ({ playlistId, isOwner, canReact }: Props) => {
    // currentData, а не data: адрес /playlists/:playlistId один на все
    // плейлисты, и при переходе с одного на другой виджет не размонтируется —
    // data держит состав по прошлому id и показала бы чужие треки
    const { currentData: data, isError } = useFetchPlaylistTracksQuery({
        playlistId,
    });

    // «нечего показать, и это не ошибка» — значит грузим. Без этого пустой
    // плейлист и ещё не приехавший выглядели бы одинаково, и на каждой
    // загрузке мигало бы «This playlist is empty»
    const isLoading = !data && !isError;

    // подробности трека открываются той же панелью, что и со списка треков
    const { openTrack } = useTrackPanel();

    // порядок берём как есть: он уже нормализован в transformResponse,
    // а дальше им распоряжается оптимистичный патч перестановки.
    // Сортировать здесь по attributes.order нельзя — новых номеров после
    // reorder сервер не присылает, и сортировка отменяла бы перестановку
    const tracks = data?.data ?? [];

    // имена артистов лежат в included, в самом треке только их id
    const artistNameById = new Map<string, string>(
        (data?.included ?? []).map(
            (artist) => [artist.id, artist.attributes.name] as const
        )
    );

    // очередь плеера: с плейлиста музыка идёт по плейлисту, а не по общему
    // списку треков. Форма атрибутов тут своя, но мапперу её хватает
    const queue = data ? toPlayerTracks([data]) : [];

    // фичам нужен весь порядок: сервер принимает id соседа, а не позицию
    const orderedIds = tracks.map((track) => track.id);

    return (
        <div>
            <h2>Tracks</h2>

            {isOwner && (
                <AddTrackToPlaylist
                    playlistId={playlistId}
                    addedIds={orderedIds}
                />
            )}

            {isLoading && <div>Loading...</div>}
            {isError && <div>Failed to load tracks</div>}

            {/* пустой плейлист это норма, а не поломка */}
            {!isLoading && !isError && tracks.length === 0 && (
                <div>This playlist is empty</div>
            )}

            <ol className={s.list}>
                {tracks.map((track) => {
                    const artistNames = track.relationships.artists.data
                        .map(({ id }) => artistNameById.get(id))
                        // предикат явный: get у Map возвращает string | undefined
                        .filter((name): name is string => Boolean(name));

                    return (
                        <li className={s.row} key={track.id}>
                            <PlayTrackButton
                                trackId={track.id}
                                queue={queue}
                                canPlay={
                                    track.attributes.attachments.length > 0
                                }
                            />

                            <TrackCover images={track.attributes.images} />

                            <div className={s.info}>
                                {/* кнопка, а не ссылка: подробности
                                    раскрываются панелью на этом же адресе */}
                                <button
                                    type="button"
                                    className={s.titleButton}
                                    onClick={() => openTrack(track.id)}
                                >
                                    {track.attributes.title}
                                </button>

                                {/* у трека может не быть ни одного артиста */}
                                {artistNames.length > 0 && (
                                    <div className={s.artists}>
                                        {artistNames.join(', ')}
                                    </div>
                                )}
                            </div>

                            <span className={s.duration}>
                                {formatDuration(track.attributes.duration)}
                            </span>

                            {/* кнопки без чисел: в составе плейлиста сервер
                                не отдаёт ни likesCount, ни dislikesCount —
                                только саму реакцию, и та может прийти null.
                                Само действие при этом полноценное: реакция
                                у трека одна на всё приложение */}
                            <TrackReactions
                                trackId={track.id}
                                currentUserReaction={
                                    track.attributes.currentUserReaction ??
                                    CurrentUserReaction.None
                                }
                                canReact={canReact}
                            />

                            {isOwner && (
                                <PlaylistTrackActions
                                    playlistId={playlistId}
                                    trackId={track.id}
                                    orderedIds={orderedIds}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
