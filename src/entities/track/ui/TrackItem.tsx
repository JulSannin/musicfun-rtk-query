import type { TrackListItemResource } from '../api/tracksApi.types';
import s from './TrackItem.module.css';

type Props = {
    track: TrackListItemResource;
};

// один трек в списке: название, автор и плеер
// это entities: чистая презентация, действий над треком тут нет
export const TrackItem = ({ track }: Props) => {
    const { title, user, attachments } = track.attributes;

    // mp3 может быть еще не загружен, тогда attachments пустой
    const audio = attachments.at(0);

    return (
        <div className={s.item}>
            <div>
                <p>Title: {title}</p>
                <p>Name: {user.name}</p>
            </div>
            {/* controls обязателен: без него плеер не рисуется вообще */}
            {audio ? <audio controls src={audio.url} /> : <span>no file</span>}
        </div>
    );
};
