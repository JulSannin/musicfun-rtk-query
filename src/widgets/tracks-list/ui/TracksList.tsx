import type { RefObject } from 'react';
import { TrackItem, type TrackListItem } from '@/entities/track';
import type { PlayerTrack } from '@/entities/player';
import { PlayTrackButton } from '@/features/track-play';
import { TrackReactions } from '@/features/track-reaction';
import { LinearProgress, LoadingTrigger } from '@/shared/ui';
import s from './TracksList.module.css';

type Props = {
    items: TrackListItem[];
    // очередь у всех строк одна и та же: с какого трека ни начали, дальше
    // плеер идёт по видимому списку. Собирает её вызывающий хук —
    // это снимки, а не ссылки на кеш
    queue: PlayerTrack[];
    // раскрыть подробности; какой трек открыт — состояние адреса,
    // сюда приходит колбэком
    onTrackSelect: (trackId: string) => void;
    // считается один раз на весь список, а не хуком в каждой строке
    canReact: boolean;
    isLoading: boolean;
    isError: boolean;
    // список меняется целиком (сменили фильтры, переключили вкладку):
    // гасим его, но не убираем — вёрстка не прыгает
    isReloading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    observerRef: RefObject<HTMLDivElement | null>;
    // пусто на /tracks значит «поиск ничего не нашёл», в библиотеке —
    // «ничего ещё не лайкнул»: текст задаёт вызывающая страница
    emptyText?: string;
    errorText?: string;
};

// список треков с бесконечной прокруткой
// виджет, потому что склеивает презентацию из entities (TrackItem)
// с двумя фичами (запуск и реакции), а показывают его две страницы —
// общий список треков и библиотека
//
// данных не добывает: запрос и фильтры остаются в хуке страницы,
// сюда приезжает уже готовая выдача
export const TracksList = ({
    items,
    queue,
    onTrackSelect,
    canReact,
    isLoading,
    isError,
    isReloading,
    isFetchingNextPage,
    hasNextPage,
    observerRef,
    emptyText = 'Nothing found',
    errorText = 'Failed to load tracks',
}: Props) => {
    return (
        <div>
            {isError && <div>{errorText}</div>}
            {isLoading && <div>Loading...</div>}

            {/* пустой список это норма, а не поломка */}
            {!isLoading && !isError && items.length === 0 && (
                <div>{emptyText}</div>
            )}

            {/* isReloading гасит список и рисует полосу поверх: старые треки */}
            {/* остаются на экране, пока едет новая выдача */}
            <div className={`${s.list} ${isReloading ? s.fetching : ''}`}>
                {isReloading && <LinearProgress />}

                {items.map(({ track, artistNames }) => (
                    // key от трека, а не индекс: список растёт, индексы поехали бы
                    <div className={s.row} key={track.id}>
                        <PlayTrackButton
                            trackId={track.id}
                            queue={queue}
                            // у трека без mp3 attachments пуст, играть нечего
                            canPlay={track.attributes.attachments.length > 0}
                        />
                        <div className={s.track}>
                            <TrackItem
                                track={track}
                                artistNames={artistNames}
                                onSelect={onTrackSelect}
                            />
                        </div>
                        <TrackReactions
                            trackId={track.id}
                            // в выдаче списка есть только likesCount,
                            // счётчик дизлайков живёт лишь в подробностях
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
