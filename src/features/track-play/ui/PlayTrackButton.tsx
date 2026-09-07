import { useDispatch, useSelector } from 'react-redux';
import {
    playerActions,
    selectCurrentTrackId,
    selectIsPlaying,
    type PlayerTrack,
} from '@/entities/player';

type Props = {
    trackId: string;
    // вся очередь, а не один трек: плеер должен знать, что играть дальше,
    // а видимый список знает только страница
    queue: PlayerTrack[];
    // у трека без mp3 attachments пуст, играть нечего
    canPlay: boolean;
};

// кнопка запуска трека из списка
// сама ничего не проигрывает: звук живёт в одном <audio> внутри MiniPlayer
export const PlayTrackButton = ({ trackId, queue, canPlay }: Props) => {
    const dispatch = useDispatch();

    // сравниваем id, а не берём трек целиком: селектор отдаёт примитив,
    // и строка перерисуется только когда она сама стала или перестала быть текущей
    const isCurrent = useSelector(selectCurrentTrackId) === trackId;
    const isPlaying = useSelector(selectIsPlaying);
    const isSounding = isCurrent && isPlaying;

    const clickHandler = () => {
        if (isSounding) {
            dispatch(playerActions.pause());
            return;
        }

        // повторный запуск того же трека продолжит его с той же секунды:
        // src в <audio> не поменяется, и play() именно резюмирует
        dispatch(playerActions.playTrack({ queue, trackId }));
    };

    return (
        <button
            type="button"
            onClick={clickHandler}
            disabled={!canPlay}
            // подсказка вместо пропавшей кнопки: у черновика без файла
            // строка иначе выглядит сломанной
            title={canPlay ? undefined : 'No file uploaded for this track'}
            aria-pressed={isSounding}
        >
            {isSounding ? 'pause' : 'play'}
        </button>
    );
};
