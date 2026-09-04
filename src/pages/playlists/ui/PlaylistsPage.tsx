import { useState } from 'react';
import { CreatePlaylistForm } from '@/features/playlist-create';
import { UpdatePlaylistForm } from '@/features/playlist-update';
import { PlaylistCard } from '@/widgets/playlist-card';
import { LinearProgress, Pagination, SearchInput } from '@/shared/ui';
import { usePlaylists } from '../model/usePlaylists';
import s from './PlaylistsPage.module.css';

// страница со списком плейлистов: параметры и запрос в usePlaylists, здесь разметка и выбор редактируемого
export const PlaylistsPage = () => {
    const {
        playlists,
        pagesCount,
        isError,
        isLoading,
        isFetching,
        page,
        pageSize,
        search,
        onPageChange,
        onSearchChange,
        onPageSizeChange,
    } = usePlaylists();

    // какой плейлист сейчас редактируем; форма открыта только одна
    const [playlistId, setPlaylistId] = useState<string | null>(null);

    return (
        <div className={s.container}>
            <h1>Playlists page</h1>

            <CreatePlaylistForm />
            {/* инпут выше любых веток загрузки: внутри условия он размонтировался бы и потерял фокус */}
            <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="search by title"
            />

            {isError && <div>Failed to load playlists</div>}
            {isLoading && <div>Loading...</div>}

            {/* с поиском можно ничего не найти, без подсказки страница выглядит сломанной */}
            {playlists?.length === 0 && <div>Nothing found</div>}

            {/* isFetching только гасит список: старые карточки остаются на экране */}
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
                                    // форме важно только закрыться, про null знает страница
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
            <Pagination
                page={page}
                pagesCount={pagesCount}
                onPageChange={onPageChange}
                pageSize={pageSize}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
};
