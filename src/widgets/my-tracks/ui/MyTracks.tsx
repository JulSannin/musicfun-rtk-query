import { useState } from 'react';
import { TrackItem } from '@/entities/track';
import { TrackCoverActions } from '@/features/track-cover';
import { DeleteTrackButton } from '@/features/track-delete';
import { PublishTrackButton } from '@/features/track-publish';
import { UpdateTrackForm } from '@/features/track-update';
import { LinearProgress, LoadingTrigger } from '@/shared/ui';
import { useMyTracks } from '../model/useMyTracks';
import s from './MyTracks.module.css';

// свои треки вместе со всеми действиями над ними
// виджет, потому что склеивает строку из entities сразу с четырьмя фичами
// и держит своё состояние — какой трек сейчас редактируется.
// Владение здесь не проверяется: список и так запрошен по своему userId
export const MyTracks = () => {
    const {
        items,
        onTrackSelect,
        isLoading,
        isError,
        isReloading,
        isFetchingNextPage,
        hasNextPage,
        observerRef,
    } = useMyTracks();

    // какой трек сейчас редактируем; форма открыта только одна.
    // Это состояние списка, поэтому живёт здесь — как в PlaylistsList
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
        <div>
            <h2>My tracks</h2>

            {isError && <div>Failed to load tracks</div>}
            {isLoading && <div>Loading...</div>}

            {/* пустой список это норма, а не поломка */}
            {!isLoading && !isError && items.length === 0 && (
                <div>You don&apos;t have any tracks yet</div>
            )}

            {/* fetchTracks исключён из глобального индикатора, поэтому свой
                обязателен: иначе перезагрузка выглядит зависанием */}
            <div className={`${s.list} ${isReloading ? s.fetching : ''}`}>
                {isReloading && <LinearProgress />}

                {items.map(({ track, artistNames }) => {
                    const isEditing = editingId === track.id;

                    // key от трека, а не индекс: при удалении из середины
                    // индексы съезжают и React переиспользует чужую строку
                    return isEditing ? (
                        <div className={s.editing} key={track.id}>
                            {/* обложка и текстовые поля — разные ручки сервера,
                                поэтому и разные фичи. Склеиваются здесь:
                                фича не имеет права импортировать фичу */}
                            <TrackCoverActions
                                trackId={track.id}
                                images={track.attributes.images}
                            />
                            <UpdateTrackForm
                                trackId={track.id}
                                // форме важно только закрыться, про null знает список
                                onClose={() => setEditingId(null)}
                            />
                        </div>
                    ) : (
                        <div className={s.row} key={track.id}>
                            <div className={s.track}>
                                <TrackItem
                                    track={track}
                                    artistNames={artistNames}
                                    onSelect={onTrackSelect}
                                />
                            </div>

                            {/* обратного действия в API нет, поэтому кнопка
                                только у черновика: у опубликованного трека
                                она была бы мёртвой */}
                            {!track.attributes.isPublished && (
                                <PublishTrackButton trackId={track.id} />
                            )}

                            <button
                                type="button"
                                onClick={() => setEditingId(track.id)}
                            >
                                update
                            </button>

                            <DeleteTrackButton trackId={track.id} />
                        </div>
                    );
                })}
            </div>

            {/* маячок рисуем, только пока есть что грузить */}
            {hasNextPage && (
                <LoadingTrigger
                    observerRef={observerRef}
                    isFetchingNextPage={isFetchingNextPage}
                />
            )}
        </div>
    );
};
