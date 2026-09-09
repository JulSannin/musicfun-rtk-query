import { TagPicker } from '@/entities/tag';
import { ArtistPicker } from '@/entities/artist';
import { TracksList } from '@/widgets/tracks-list';
import { SearchInput, Select } from '@/shared/ui';
import { useTracks } from '../model/useTracks';
import s from './TracksPage.module.css';

// страница треков с бесконечной прокруткой
// запрос, фильтры и наблюдатель живут в useTracks, здесь только разметка
export const TracksPage = () => {
    const {
        items,
        queue,
        onTrackSelect,
        isLoading,
        isError,
        isReloading,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
        search,
        sortBy,
        sortDirection,
        tags,
        artists,
        onlyLikedByMe,
        onlyMine,
        canFilterByUser,
        canReact,
        onSearchChange,
        onSortByChange,
        onSortDirectionChange,
        onTagsChange,
        onArtistsChange,
        onOnlyLikedByMeChange,
        onOnlyMineChange,
    } = useTracks();

    return (
        <div>
            <h1>Tracks page</h1>

            {/* инпут выше списка и вне веток загрузки: внутри условия он размонтировался бы и потерял фокус */}
            <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder="search tracks"
            />

            <div className={s.filters}>
                {/* поля сортировки у треков свои: publishedAt вместо addedAt */}
                <Select
                    label="Sort by"
                    value={sortBy}
                    options={[
                        { value: 'publishedAt', label: 'date published' },
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

                {/* без max: лимит в 5 принадлежит плейлисту, а не фильтру */}
                <TagPicker value={tags} onChange={onTagsChange} />

                {/* гостю не показываем ни чекбоксы, ни пикер артистов:
                    первым нужен пользователь, второму — токен (artists/search
                    отвечает 401 с одним API-KEY, в отличие от tags/search) */}
                {canFilterByUser && (
                    <>
                        {/* без max: лимит в 5 принадлежит треку, а не фильтру.
                            И без onCreate: заводить артиста из фильтра незачем */}
                        <ArtistPicker
                            value={artists}
                            onChange={onArtistsChange}
                        />

                        <label>
                            <input
                                type="checkbox"
                                checked={onlyLikedByMe}
                                onChange={(e) =>
                                    onOnlyLikedByMeChange(
                                        e.currentTarget.checked
                                    )
                                }
                            />
                            only liked by me
                        </label>

                        {/* один переключатель на два параметра: черновики сервер
                            отдаёт только вместе с собственным userId */}
                        <label>
                            <input
                                type="checkbox"
                                checked={onlyMine}
                                onChange={(e) =>
                                    onOnlyMineChange(e.currentTarget.checked)
                                }
                            />
                            only mine (with drafts)
                        </label>
                    </>
                )}
            </div>

            {/* сам список — виджет: ту же строку (запуск + трек + реакции)
                показывает библиотека, и копии этой разметки быть не должно.
                Запрос и фильтры остаются здесь, в хуке страницы */}
            <TracksList
                items={items}
                queue={queue}
                onTrackSelect={onTrackSelect}
                canReact={canReact}
                isLoading={isLoading}
                isError={isError}
                isReloading={isReloading}
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                observerRef={observerRef}
            />
        </div>
    );
};
