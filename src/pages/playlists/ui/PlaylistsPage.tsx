import { PlaylistsList } from '@/widgets/playlists-list';
import { Pagination, SearchInput, Select } from '@/shared/ui';
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
        sortBy,
        sortDirection,
        onlyLikedByMe,
        canFilterByLikes,
        onPageChange,
        onSearchChange,
        onPageSizeChange,
        onSortByChange,
        onSortDirectionChange,
        onOnlyLikedByMeChange,
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

            <div className={s.filters}>
                <Select
                    label="Sort by"
                    value={sortBy}
                    options={[
                        { value: 'addedAt', label: 'date added' },
                        { value: 'likesCount', label: 'likes' },
                    ]}
                    onChange={onSortByChange}
                />
                <Select
                    label="Direction"
                    value={sortDirection}
                    options={[
                        { value: 'desc', label: 'newest first' },
                        { value: 'asc', label: 'oldest first' },
                    ]}
                    onChange={onSortDirectionChange}
                />

                {/* гостю чекбокс не показываем: фильтр требует авторизации */}
                {canFilterByLikes && (
                    <label>
                        <input
                            type="checkbox"
                            checked={onlyLikedByMe}
                            onChange={(e) =>
                                onOnlyLikedByMeChange(e.currentTarget.checked)
                            }
                        />
                        only liked by me
                    </label>
                )}
            </div>

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
