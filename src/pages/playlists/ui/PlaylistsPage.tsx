import { PlaylistsList } from '@/widgets/playlists-list';
import { Pagination, SearchInput } from '@/shared/ui';
import { usePlaylists } from '../model/usePlaylists';
import s from './PlaylistsPage.module.css';

// страница публичных плейлистов: параметры и запрос в usePlaylists,
// здесь только разметка вокруг списка
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

    return (
        <div className={s.container}>
            <h1>Playlists page</h1>

            {/* инпут выше списка и вне веток загрузки: внутри условия он размонтировался бы и потерял фокус */}
            <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="search by title"
            />

            <PlaylistsList
                playlists={playlists}
                isLoading={isLoading}
                isError={isError}
                isFetching={isFetching}
            />

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
