import { TrackItem } from '@/entities/track';
import { TagPicker } from '@/entities/tag';
import { TrackReactions } from '@/features/track-reaction';
import {
    LinearProgress,
    LoadingTrigger,
    SearchInput,
    Select,
} from '@/shared/ui';
import { useTracks } from '../model/useTracks';
import s from './TracksPage.module.css';

// страница треков с бесконечной прокруткой
// запрос, фильтры и наблюдатель живут в useTracks, здесь только разметка
export const TracksPage = () => {
    const {
        items,
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
        onlyLikedByMe,
        onlyMine,
        canFilterByUser,
        canReact,
        onSearchChange,
        onSortByChange,
        onSortDirectionChange,
        onTagsChange,
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

                {/* гостю чекбоксы не показываем: оба фильтра требуют пользователя */}
                {canFilterByUser && (
                    <>
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

            {isError && <div>Failed to load tracks</div>}
            {isLoading && <div>Loading...</div>}

            {/* пусто бывает и от фильтров, а не только от пустой базы */}
            {!isLoading && !isError && items.length === 0 && (
                <div>Nothing found</div>
            )}

            {/* isReloading гасит список и рисует полосу поверх: старые треки */}
            {/* остаются на экране, пока едет выдача под новыми фильтрами */}
            <div className={`${s.list} ${isReloading ? s.fetching : ''}`}>
                {isReloading && <LinearProgress />}
                {items.map(({ track, artistNames }) => (
                    // key от трека, а не индекс: список растет, индексы поехали бы
                    // презентация из entities и действие из features склеиваются
                    // здесь: сам TrackItem импортировать фичу не имеет права
                    <div className={s.row} key={track.id}>
                        <TrackItem track={track} artistNames={artistNames} />
                        <TrackReactions
                            trackId={track.id}
                            likesCount={track.attributes.likesCount}
                            currentUserReaction={
                                track.attributes.currentUserReaction
                            }
                            canReact={canReact}
                        />
                    </div>
                ))}
            </div>

            {/* маячок рисуем, только пока есть что грузить */}
            {hasNextPage && (
                <LoadingTrigger
                    observerRef={observerRef}
                    isFetchingNextPage={isFetchingNextPage}
                />
            )}

            {/* сообщение только когда что-то уже загружено: на пустом списке оно сбивает с толку */}
            {!hasNextPage && items.length > 0 && <p>Nothing more to load</p>}
        </div>
    );
};
