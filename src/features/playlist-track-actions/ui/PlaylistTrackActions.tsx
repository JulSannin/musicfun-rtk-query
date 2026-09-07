import {
    useRemoveTrackFromPlaylistMutation,
    useReorderPlaylistTrackMutation,
} from '@/entities/track';

type Props = {
    playlistId: string;
    trackId: string;
    // весь порядок целиком: сервер принимает не позицию, а id соседа,
    // после которого встать, и посчитать его можно только зная список
    orderedIds: string[];
};

// действия владельца над треком внутри плейлиста: убрать и переставить
// две мутации в одной фиче по образцу PlaylistCoverActions
export const PlaylistTrackActions = ({
    playlistId,
    trackId,
    orderedIds,
}: Props) => {
    const [removeTrack, { isLoading: isRemoving }] =
        useRemoveTrackFromPlaylistMutation();
    const [reorderTrack, { isLoading: isReordering }] =
        useReorderPlaylistTrackMutation();

    const isBusy = isRemoving || isReordering;

    const index = orderedIds.indexOf(trackId);
    const canMoveUp = index > 0;
    const canMoveDown = index !== -1 && index < orderedIds.length - 1;

    const moveHandler = (direction: -1 | 1) => {
        // вверх — встаём после того, кто через одного выше (в начале списка
        // это null); вниз — после ближайшего снизу. Собственный id так
        // не подставится, а на него сервер отвечает 400
        const putAfterItemId =
            direction === -1
                ? (orderedIds[index - 2] ?? null)
                : orderedIds[index + 1];

        reorderTrack({ playlistId, trackId, putAfterItemId })
            .unwrap()
            // catch пустой намеренно: тост показал handleErrors,
            // а откат порядка сделал onQueryStarted
            .catch(() => {});
    };

    // подтверждения нет намеренно, в отличие от удаления плейлиста:
    // сам трек остаётся жив, действие обратимо повторным добавлением
    const removeHandler = () => {
        removeTrack({ playlistId, trackId })
            .unwrap()
            .catch(() => {});
    };

    return (
        <>
            <button
                type="button"
                onClick={() => moveHandler(-1)}
                disabled={!canMoveUp || isBusy}
                aria-label="Move up"
            >
                ↑
            </button>
            <button
                type="button"
                onClick={() => moveHandler(1)}
                disabled={!canMoveDown || isBusy}
                aria-label="Move down"
            >
                ↓
            </button>
            <button type="button" onClick={removeHandler} disabled={isBusy}>
                remove
            </button>
        </>
    );
};
