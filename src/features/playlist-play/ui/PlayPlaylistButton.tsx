import { useDispatch, useSelector } from 'react-redux';
import {
    playerActions,
    selectCurrentTrackId,
    selectIsPlaying,
    toPlayerTracks,
} from '@/entities/player';
import { useFetchPlaylistTracksQuery } from '@/entities/track';

type Props = {
    playlistId: string;
};

// запускает плейлист с первого трека
// состав спрашивает сам: аргумент тот же, что у виджета состава, поэтому
// подписка попадает в ту же запись кеша и второго запроса не будет
export const PlayPlaylistButton = ({ playlistId }: Props) => {
    const dispatch = useDispatch();

    // currentData, а не data: при переходе между плейлистами компонент
    // не размонтируется, и data подсунула бы состав прошлого
    const { currentData } = useFetchPlaylistTracksQuery({ playlistId });

    const currentTrackId = useSelector(selectCurrentTrackId);
    const isPlaying = useSelector(selectIsPlaying);

    const queue = currentData ? toPlayerTracks([currentData]) : [];

    // играть нечего — кнопки нет вовсе: ни пустой плейлист, ни плейлист
    // из одних черновиков без mp3 не должны показывать мёртвую кнопку
    if (queue.length === 0) return null;

    // играет ли сейчас трек из этого плейлиста
    const isCurrentPlaylist = queue.some(
        (track) => track.id === currentTrackId
    );
    const isSounding = isCurrentPlaylist && isPlaying;

    const clickHandler = () => {
        if (isSounding) {
            dispatch(playerActions.pause());
            return;
        }

        // плейлист уже в плеере — продолжаем с того места, где встали,
        // а не перескакиваем на первый трек
        if (isCurrentPlaylist && currentTrackId) {
            dispatch(
                playerActions.playTrack({ queue, trackId: currentTrackId })
            );
            return;
        }

        dispatch(playerActions.playTrack({ queue, trackId: queue[0].id }));
    };

    return (
        <button type="button" onClick={clickHandler} aria-pressed={isSounding}>
            {isSounding ? 'pause playlist' : 'play playlist'}
        </button>
    );
};
