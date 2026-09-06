import { formatDuration } from '@/shared/lib';
import type { TrackListItemResource } from '../api/tracksApi.types';
import s from './TrackItem.module.css';

type Props = {
    track: TrackListItemResource;
    // имена артистов приходят готовыми: связь id -> имя разбирается там,
    // где виден весь ответ вместе с included
    artistNames: string[];
};

// один трек в списке: название, автор и плеер
// это entities: чистая презентация, действий над треком тут нет
export const TrackItem = ({ track, artistNames }: Props) => {
    const { title, user, attachments, duration, isPublished } =
        track.attributes;

    // mp3 может быть еще не загружен, тогда attachments пустой
    const audio = attachments.at(0);

    return (
        <div className={s.item}>
            <div>
                <p>Title: {title}</p>
                <p>Name: {user.name}</p>

                {/* у трека может не быть ни одного артиста */}
                {artistNames.length > 0 && (
                    <p>Artists: {artistNames.join(', ')}</p>
                )}

                <p>Duration: {formatDuration(duration)}</p>

                {/* черновик виден только своему автору, но пометка нужна ему явно */}
                {!isPublished && <p>draft</p>}
            </div>
            {/* controls обязателен: без него плеер не рисуется вообще */}
            {audio ? <audio controls src={audio.url} /> : <span>no file</span>}
        </div>
    );
};
