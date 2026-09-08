import { useDeleteTrackMutation } from '@/entities/track';

type Props = {
    trackId: string;
};

// удаляет трек насовсем, а не убирает из плейлиста
// это разные ручки: removeTrackFromPlaylist оставляет сам трек жив
export const DeleteTrackButton = ({ trackId }: Props) => {
    const [deleteTrack, { isLoading }] = useDeleteTrackMutation();

    // confirm нативный намеренно: ответ нужен ДО запроса, тостом его
    // не заменить — восстановления удалённого трека в API нет
    const clickHandler = () => {
        if (!confirm('Delete this track permanently?')) return;

        deleteTrack({ trackId })
            .unwrap()
            .catch(() => {});
    };

    return (
        <button type="button" onClick={clickHandler} disabled={isLoading}>
            {isLoading ? 'deleting...' : 'delete track'}
        </button>
    );
};
