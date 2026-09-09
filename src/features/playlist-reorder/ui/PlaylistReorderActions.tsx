import { useReorderPlaylistMutation } from '@/entities/playlist';

type Props = {
    playlistId: string;
    // весь порядок целиком: сервер принимает не позицию, а id соседа,
    // после которого встать, и посчитать его можно только зная список
    orderedIds: string[];
};

// перестановка своих плейлистов
// устроена как PlaylistTrackActions, вплоть до той же арифметики соседей:
// ручки разные, а правило одно — сервер хочет id, а не индекс
export const PlaylistReorderActions = ({ playlistId, orderedIds }: Props) => {
    // fixedCacheKey делает состояние мутации общим для всех карточек списка:
    // пока едет одна перестановка, стрелки погашены везде. Иначе клик
    // по соседней карточке уходит параллельным запросом, сервер волен
    // применить их в другом порядке, и клиент останется при своём —
    // инвалидации, которая бы это исправила, у reorder намеренно нет
    const [reorderPlaylist, { isLoading }] = useReorderPlaylistMutation({
        fixedCacheKey: 'playlist-reorder',
    });

    const index = orderedIds.indexOf(playlistId);
    const canMoveUp = index > 0;
    const canMoveDown = index !== -1 && index < orderedIds.length - 1;

    const moveHandler = (direction: -1 | 1) => {
        // вверх — встаём после того, кто через одного выше (в начале списка
        // это null); вниз — после ближайшего снизу. Собственный id так
        // не подставится, а его сервер бы не понял
        const putAfterItemId =
            direction === -1
                ? (orderedIds[index - 2] ?? null)
                : orderedIds[index + 1];

        reorderPlaylist({ playlistId, putAfterItemId })
            .unwrap()
            // catch пустой намеренно: тост показал handleErrors,
            // а откат порядка сделал onQueryStarted
            .catch(() => {});
    };

    return (
        <>
            <button
                type="button"
                onClick={() => moveHandler(-1)}
                disabled={!canMoveUp || isLoading}
                aria-label="Move up"
            >
                ↑
            </button>
            <button
                type="button"
                onClick={() => moveHandler(1)}
                disabled={!canMoveDown || isLoading}
                aria-label="Move down"
            >
                ↓
            </button>
        </>
    );
};
