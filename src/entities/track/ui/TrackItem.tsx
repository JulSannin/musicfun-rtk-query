import { formatDuration } from '@/shared/lib';
import type { TrackListItemResource } from '../api/tracksApi.types';
import { TrackCover } from './TrackCover';
import s from './TrackItem.module.css';

type Props = {
    track: TrackListItemResource;
    // имена артистов приходят готовыми: связь id -> имя разбирается там,
    // где виден весь ответ вместе с included
    artistNames: string[];
    // раскрыть подробности; какой трек сейчас открыт — состояние страницы,
    // сюда приходит колбэком. id подставляем здесь: наверху знают только
    // «какой-то трек», а строка знает, какой именно
    onSelect: (trackId: string) => void;
};

// один трек в списке: обложка, название, автор
// это entities: чистая презентация, действий над треком тут нет,
// а про адреса и роутинг компонент не знает — наверх уходит только выбор
export const TrackItem = ({ track, artistNames, onSelect }: Props) => {
    const { title, user, duration, isPublished, images } = track.attributes;

    return (
        <div className={s.item}>
            <TrackCover images={images} />

            <div>
                {/* кнопка, а не ссылка: подробности раскрываются панелью
                    на этой же странице, адрес страницы не меняется */}
                <p>
                    Title:{' '}
                    <button
                        type="button"
                        className={s.titleButton}
                        onClick={() => onSelect(track.id)}
                    >
                        {title}
                    </button>
                </p>
                <p>Name: {user.name}</p>

                {/* у трека может не быть ни одного артиста */}
                {artistNames.length > 0 && (
                    <p>Artists: {artistNames.join(', ')}</p>
                )}

                <p>Duration: {formatDuration(duration)}</p>

                {/* черновик виден только своему автору, но пометка нужна ему явно */}
                {!isPublished && <p>draft</p>}
            </div>

            {/* своего <audio> здесь нет: элемент в приложении один,
                внутри MiniPlayer. Два плеера означали бы два источника правды —
                нативный в строке и глобальный — и они перебивали бы друг друга.
                Запуск делает PlayTrackButton из features/track-play */}
        </div>
    );
};
