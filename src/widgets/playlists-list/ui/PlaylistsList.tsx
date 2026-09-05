import { useState } from 'react';
import type { PlaylistListItemResource } from '@/entities/playlist';
import { UpdatePlaylistForm } from '@/features/playlist-update';
import { LinearProgress } from '@/shared/ui';
import { PlaylistCard } from './PlaylistCard';
import s from './PlaylistsList.module.css';

type Props = {
    // весь плейлист приходит только сюда: это граница списка,
    // ниже в карточку уходят уже отдельные поля
    playlists: PlaylistListItemResource[] | undefined;
    isLoading: boolean;
    isError: boolean;
    // на профиле пагинации и поиска нет, гасить список не от чего,
    // поэтому необязательный
    isFetching?: boolean;
    // текст пустого списка задаёт страница: на /playlists пусто значит
    // "поиск ничего не нашёл", на профиле — "своих плейлистов ещё нет"
    emptyText?: string;
};

// список плейлистов вместе с режимом редактирования
// виджет, потому что склеивает карточку с формой из features,
// и одну и ту же разметку показывают две разные страницы
export const PlaylistsList = ({
    playlists,
    isLoading,
    isError,
    isFetching = false,
    emptyText = 'Nothing found',
}: Props) => {
    // какой плейлист сейчас редактируем; форма открыта только одна
    // это состояние списка, поэтому живёт здесь, а не в странице
    const [playlistId, setPlaylistId] = useState<string | null>(null);

    return (
        <>
            {isError && <div>Failed to load playlists</div>}
            {isLoading && <div>Loading...</div>}

            {/* без подсказки пустой список выглядит как сломанная страница */}
            {playlists?.length === 0 && <div>{emptyText}</div>}

            {/* isFetching не убирает список, а гасит его и рисует полосу поверх: */}
            {/* старые карточки остаются на экране, пока едет новая страница */}
            <div
                className={`${s.items} ${isFetching || isLoading ? s.fetching : ''}`}
            >
                {(isFetching || isLoading) && <LinearProgress />}
                {playlists?.map((playlist) => {
                    const isEditing = playlistId === playlist.id;
                    return (
                        // key от плейлиста, а не индекс: при удалении из середины индексы съезжают
                        <div className={s.item} key={playlist.id}>
                            {isEditing ? (
                                <UpdatePlaylistForm
                                    playlistId={playlist.id}
                                    // форме важно только закрыться, про null знает список
                                    onClose={() => setPlaylistId(null)}
                                />
                            ) : (
                                <PlaylistCard
                                    playlist={playlist}
                                    onEdit={setPlaylistId}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};
