import { useState } from 'react';
import {
    useAddTrackToPlaylistMutation,
    useFetchTracksInfiniteQuery,
} from '@/entities/track';
import { PLAYLIST_TRACKS_MAX } from '@/entities/playlist';
import { useDebounce } from '@/shared/lib';

type Props = {
    playlistId: string;
    // id уже добавленных: по ним прячем подсказки и считаем лимит
    addedIds: string[];
};

// поиск трека и добавление его в плейлист
// отдельной ручки «найди то, чего нет в плейлисте» в API нет, поэтому
// фильтруем выдачу общего поиска на клиенте
export const AddTrackToPlaylist = ({ playlistId, addedIds }: Props) => {
    const [search, setSearch] = useState('');

    // запрос уходит после паузы, как и в TagPicker
    const debouncedSearch = useDebounce(search);
    const query = debouncedSearch.trim();

    const { data, isFetching } = useFetchTracksInfiniteQuery(
        { search: query },
        // с пустой строкой ушла бы вся выдача целиком, а искать нечего
        { skip: !query }
    );

    const [addTrack, { isLoading: isAdding }] = useAddTrackToPlaylistMutation();

    const isFull = addedIds.length >= PLAYLIST_TRACKS_MAX;

    // берём только первую страницу: пикер это не список, докручивать нечего
    // опциональная цепочка и на pages[0]: у infiniteQuery это массив,
    // и обращаться к нулевому элементу без проверки — рантайм-ошибка ждущая случая
    const suggestions = (data?.pages[0]?.data ?? []).filter(
        (track) => !addedIds.includes(track.id)
    );

    const addHandler = (trackId: string) => {
        // лимит держим и здесь, а не только на disabled у инпута:
        // подсказки остаются в разметке и кликабельны
        if (isFull) return;

        addTrack({ playlistId, trackId })
            .unwrap()
            .then(() => setSearch(''))
            // catch пустой намеренно: 403 про лимит или чужой плейлист
            // уже показал handleErrors
            .catch(() => {});
    };

    return (
        <div>
            <input
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder={
                    isFull
                        ? `Maximum ${PLAYLIST_TRACKS_MAX} tracks`
                        : 'search tracks to add'
                }
                disabled={isFull}
            />

            {/* «не найдено» только когда искали и дождались: иначе моргает
                на каждой букве */}
            {query && !isFetching && suggestions.length === 0 && (
                <span>Nothing found</span>
            )}

            {suggestions.map((track) => (
                <button
                    type="button"
                    key={track.id}
                    onClick={() => addHandler(track.id)}
                    disabled={isAdding}
                >
                    + {track.attributes.title}
                </button>
            ))}
        </div>
    );
};
