import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    playerActions,
    selectCurrentTrack,
    selectHasNext,
    selectHasPrev,
    selectIsPlaying,
} from '@/entities/player';
import { errorToast, formatDuration } from '@/shared/lib';
import { usePrimePlayer } from '../model/usePrimePlayer';
import s from './MiniPlayer.module.css';

// до этой секунды кнопка «назад» ещё считается переходом на прошлый трек,
// дальше — перемоткой текущего в начало; так устроены все плееры
const RESTART_THRESHOLD = 3;

type Props = {
    // «показать этот трек»; плеер не знает, где в приложении живут
    // подробности, и отдаёт наверх только id
    onOpenTrack: (trackId: string) => void;
};

// единственный <audio> в приложении
// рендерится в App рядом с Header, вне Routing: внутри страницы элемент
// размонтировался бы на переходе и музыка обрывалась бы на каждой ссылке
export const MiniPlayer = ({ onOpenTrack }: Props) => {
    // плеер сам добывает себе первую очередь, не дожидаясь страницы треков
    usePrimePlayer();

    const dispatch = useDispatch();

    const track = useSelector(selectCurrentTrack);
    const isPlaying = useSelector(selectIsPlaying);
    const hasNext = useSelector(selectHasNext);
    const hasPrev = useSelector(selectHasPrev);

    const audioRef = useRef<HTMLAudioElement>(null);

    // прогресс держим здесь, а не в сторе: timeupdate стреляет несколько раз
    // в секунду, и каждый dispatch перерисовывал бы всех подписчиков плеера.
    // Рядом с числами лежит id трека, которому они принадлежат: сбрасывать их
    // по событию нельзя — при preload="none" loadstart не приходит до первого
    // play, и на паузе после переключения показалась бы позиция прошлого трека
    const [progress, setProgress] = useState<{
        trackId: string;
        time: number;
        // длительность из метаданных файла; пока их нет, берём число сервера
        loadedDuration: number;
    } | null>(null);

    const [volume, setVolume] = useState(1);

    const trackId = track?.id;

    // числа чужого трека не показываем, а обнуляем прямо на рендере —
    // тот же приём, что с тегами в форме редактирования плейлиста
    const ownProgress = progress?.trackId === trackId ? progress : null;
    const currentTime = ownProgress?.time ?? 0;
    const loadedDuration = ownProgress?.loadedDuration ?? 0;

    // патчим одно поле, второе сохраняем — но только если оно от этого же трека
    const updateProgress = (
        patch: Partial<{ time: number; loadedDuration: number }>
    ) => {
        if (!trackId) return;

        setProgress((prev) => {
            const own = prev?.trackId === trackId ? prev : null;

            return {
                trackId,
                time: own?.time ?? 0,
                loadedDuration: own?.loadedDuration ?? 0,
                ...patch,
            };
        });
    };

    // синхронизация звука с состоянием: play/pause приходят и отсюда,
    // и из кнопки в списке, поэтому источник правды — стор, а не элемент
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            // play() реджектится AbortError, если src сменился до старта —
            // это обычное дело при быстрых кликах по разным трекам
            audio.play().catch(() => {});
        } else {
            audio.pause();
        }
        // trackId в зависимостях обязателен: при смене трека src уже новый,
        // и играть его нужно заново, хотя isPlaying не менялся
    }, [isPlaying, trackId]);

    // кнопки на гарнитуре и в шторке ОС
    useEffect(() => {
        if (!track || !('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artistNames.join(', '),
            artwork: track.coverUrl ? [{ src: track.coverUrl }] : [],
        });

        navigator.mediaSession.setActionHandler('play', () =>
            dispatch(playerActions.play())
        );
        navigator.mediaSession.setActionHandler('pause', () =>
            dispatch(playerActions.pause())
        );
        navigator.mediaSession.setActionHandler('nexttrack', () =>
            dispatch(playerActions.next())
        );
        navigator.mediaSession.setActionHandler('previoustrack', () =>
            dispatch(playerActions.prev())
        );

        return () => {
            // обработчики снимаем: иначе они останутся от прошлого трека
            navigator.mediaSession.setActionHandler('play', null);
            navigator.mediaSession.setActionHandler('pause', null);
            navigator.mediaSession.setActionHandler('nexttrack', null);
            navigator.mediaSession.setActionHandler('previoustrack', null);
        };
    }, [track, dispatch]);

    // полоса внизу видна всегда, даже когда ничего не выбрано: это часть
    // каркаса приложения, как шапка, а не всплывающее уведомление.
    // Заодно <audio> монтируется один раз на всю жизнь страницы, и громкость,
    // выставленная прямо на элементе, гарантированно переживает смену трека
    const total = loadedDuration || track?.duration || 0;

    const seekHandler = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        // при preload="none" до первого play метаданных ещё нет, и браузер
        // запоминает позицию как стартовую. Обработчик на этом падать
        // не должен, поэтому присваивание в try
        try {
            audio.currentTime = seconds;
        } catch {
            return;
        }

        // ставим сразу, не дожидаясь timeupdate: иначе ползунок отскакивает назад
        updateProgress({ time: seconds });
    };

    const prevHandler = () => {
        if (currentTime > RESTART_THRESHOLD || !hasPrev) {
            seekHandler(0);
            return;
        }

        dispatch(playerActions.prev());
    };

    return (
        <div className={s.player}>
            <audio
                ref={audioRef}
                // именно undefined, а не пустая строка: src="" браузер
                // разрешает в адрес самой страницы и сразу бросает error
                src={track?.url}
                // без этого браузер сам полез бы за метаданными mp3 сразу
                // после подстановки трека — то есть при каждом запуске
                // приложения качал бы кусок файла, который никто не просил.
                // Длительность и так известна из ответа сервера, а ошибку
                // битой ссылки честнее показывать по нажатию play
                preload="none"
                onTimeUpdate={(e) =>
                    updateProgress({ time: e.currentTarget.currentTime })
                }
                onLoadedMetadata={(e) => {
                    const { duration } = e.currentTarget;

                    // у mp3 без длительности в заголовках браузер отдаёт
                    // Infinity: ползунок с max=Infinity перестаёт двигаться,
                    // а formatDuration печатает "Infinity:NaN:NaN".
                    // В этом случае остаёмся на числе сервера
                    updateProgress({
                        loadedDuration: Number.isFinite(duration)
                            ? duration
                            : 0,
                    });
                }}
                // отдельного сброса прогресса на смене трека нет: числа
                // хранятся вместе с id трека и обнуляются сами на рендере
                // автопереход к следующему: разрешён без нового клика, потому
                // что активация пользователя уже была на первом play
                onEnded={() => dispatch(playerActions.next())}
                onError={() => {
                    // сюда попадаем на битой или протухшей ссылке на файл;
                    // handleErrors такое не видит — это не запрос RTK Query
                    errorToast('Failed to play the track');
                    dispatch(playerActions.pause());
                }}
            />

            {track?.coverUrl && (
                <img className={s.cover} src={track.coverUrl} alt="" />
            )}

            <div className={s.info}>
                {track ? (
                    <>
                        {/* название — кнопка: раскрывает подробности трека.
                            Куда именно вести, решает app, плеер отдаёт id */}
                        <button
                            type="button"
                            className={s.title}
                            onClick={() => onOpenTrack(track.id)}
                        >
                            {track.title}
                        </button>
                        {/* у трека может не быть ни одного артиста */}
                        {track.artistNames.length > 0 && (
                            <div className={s.artists}>
                                {track.artistNames.join(', ')}
                            </div>
                        )}
                    </>
                ) : (
                    // подпись обязательна: полоса с одними погашенными кнопками
                    // читается как сломанный интерфейс, а не как «ещё не выбрали»
                    <div className={s.idle}>Nothing is playing</div>
                )}
            </div>

            <div className={s.controls}>
                {/* пока трек не выбран, управлять нечем: кнопки гасим,
                    но полосу оставляем на месте */}
                <button
                    type="button"
                    onClick={prevHandler}
                    disabled={!track}
                    aria-label="Previous track"
                >
                    prev
                </button>
                <button
                    type="button"
                    onClick={() =>
                        dispatch(
                            isPlaying
                                ? playerActions.pause()
                                : playerActions.play()
                        )
                    }
                    disabled={!track}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? 'pause' : 'play'}
                </button>
                <button
                    type="button"
                    onClick={() => dispatch(playerActions.next())}
                    disabled={!hasNext}
                    aria-label="Next track"
                >
                    next
                </button>
            </div>

            <div className={s.progress}>
                <span className={s.time}>{formatDuration(currentTime)}</span>
                <input
                    type="range"
                    min={0}
                    max={total}
                    step={1}
                    value={currentTime}
                    // пока длительность неизвестна, перематывать некуда
                    disabled={!total}
                    onChange={(e) => seekHandler(Number(e.currentTarget.value))}
                    aria-label="Seek"
                />
                <span className={s.time}>{formatDuration(total)}</span>
            </div>

            {/* громкость ставим прямо на элементе: React не умеет отдавать */}
            {/* volume как проп, это свойство DOM, а не атрибут */}
            <input
                className={s.volume}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => {
                    const next = Number(e.currentTarget.value);
                    setVolume(next);
                    if (audioRef.current) audioRef.current.volume = next;
                }}
                aria-label="Volume"
            />
        </div>
    );
};
