import { TrackItem } from '@/entities/track';
import { LoadingTrigger } from '@/shared/ui';
import { useTracks } from '../model/useTracks';
import s from './TracksPage.module.css';

// страница треков с бесконечной прокруткой
// запрос и наблюдатель живут в useTracks, здесь только разметка
export const TracksPage = () => {
    const {
        items,
        isLoading,
        isError,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
    } = useTracks();

    return (
        <div>
            <h1>Tracks page</h1>

            {isError && <div>Failed to load tracks</div>}
            {isLoading && <div>Loading...</div>}

            <div className={s.list}>
                {items.map(({ track, artistNames }) => (
                    // key от трека, а не индекс: список растет, индексы поехали бы
                    <TrackItem
                        key={track.id}
                        track={track}
                        artistNames={artistNames}
                    />
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
