import { useSelector } from 'react-redux';
import { selectQueue } from '@/entities/player';
import { TrackCover } from '@/entities/track';
import { TrackCoverActions } from '@/features/track-cover';
import { PlayTrackButton } from '@/features/track-play';
import { TrackReactions } from '@/features/track-reaction';
import { formatDuration } from '@/shared/lib';
import { useTrackDetails } from '../model/useTrackDetails';
import s from './TrackDetails.module.css';

type Props = {
    trackId: string;
    // панель знает только «закрой меня»: чей это параметр адреса и кто его
    // читает, ей знать нечего
    onClose: () => void;
};

// даты сервер отдаёт строкой ISO; показываем в локали пользователя,
// иначе рядом с названием висит "2024-05-01T12:00:00.000Z"
const formatDate = (value: string) => new Date(value).toLocaleDateString();

// раскрытые подробности трека: всё, чего нет в списке — текст песни,
// дата релиза, теги, артисты и счётчик дизлайков.
// виджет, потому что склеивает презентацию из entities с двумя фичами
// и сам ходит за данными; они доступны и гостю — на этой ручке
// из защиты только API-KEY
export const TrackDetails = ({ trackId, onClose }: Props) => {
    const {
        attributes,
        playerTrack,
        canPlay,
        canReact,
        isOwner,
        isLoading,
        isError,
    } = useTrackDetails(trackId);

    // панель живёт над всеми страницами и очереди списка не видит, поэтому
    // запуск отсюда идёт «в контексте того, что уже играет»: если трек лежит
    // в очереди плеера, после него продолжится она же. Если нет — играем его
    // одного; отдать playTrack очередь без этого id нельзя, он не найдёт
    // индекс и молча ничего не сделает
    const playerQueue = useSelector(selectQueue);

    const playQueue = playerQueue.some((item) => item.id === trackId)
        ? playerQueue
        : playerTrack
          ? [playerTrack]
          : [];

    return (
        <aside className={s.panel}>
            <button type="button" className={s.close} onClick={onClose}>
                close
            </button>

            {isLoading && <div>Loading...</div>}

            {/* сюда попадаем и на 404, и на сетевой сбой;
                тост уже показал handleErrors */}
            {isError && <div>Failed to load the track</div>}

            {attributes && (
                <>
                    <TrackCover images={attributes.images} size="large" />

                    {/* саму обложку видят все, включая гостя, а менять её
                        может только владелец — как у плейлиста */}
                    {isOwner && (
                        <TrackCoverActions
                            trackId={trackId}
                            images={attributes.images}
                        />
                    )}

                    <h2>{attributes.title}</h2>
                    <p>Name: {attributes.user.name}</p>

                    {/* артисты лежат прямо в атрибутах: на этой ручке
                        included нет вообще */}
                    {attributes.artists.length > 0 && (
                        <p>
                            Artists:{' '}
                            {attributes.artists
                                .map(({ name }) => name)
                                .join(', ')}
                        </p>
                    )}

                    {attributes.tags.length > 0 && (
                        <p>
                            Tags:{' '}
                            {attributes.tags.map(({ name }) => name).join(', ')}
                        </p>
                    )}

                    <div className={s.actions}>
                        <PlayTrackButton
                            trackId={trackId}
                            queue={playQueue}
                            canPlay={canPlay}
                        />
                        {/* здесь, в отличие от списка, сервер отдаёт
                            и счётчик дизлайков */}
                        <TrackReactions
                            trackId={trackId}
                            likesCount={attributes.likesCount}
                            dislikesCount={attributes.dislikesCount}
                            currentUserReaction={attributes.currentUserReaction}
                            canReact={canReact}
                        />
                    </div>

                    <div className={s.meta}>
                        <span>{formatDuration(attributes.duration)}</span>
                        <span>added {formatDate(attributes.addedAt)}</span>

                        {/* releaseDate и publishedAt необязательные:
                            у черновика даты публикации нет вовсе */}
                        {attributes.releaseDate && (
                            <span>
                                released {formatDate(attributes.releaseDate)}
                            </span>
                        )}
                        {attributes.publishedAt && (
                            <span>
                                published {formatDate(attributes.publishedAt)}
                            </span>
                        )}
                        {!attributes.isPublished && <span>draft</span>}
                    </div>

                    {attributes.lyrics && (
                        <>
                            <h3>Lyrics</h3>
                            <p className={s.lyrics}>{attributes.lyrics}</p>
                        </>
                    )}
                </>
            )}
        </aside>
    );
};
