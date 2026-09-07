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
import s from './MiniPlayer.module.css';

// до этой секунды кнопка «назад» ещё считается переходом на прошлый трек,
// дальше — перемоткой текущего в начало; так устроены все плееры
const RESTART_THRESHOLD = 3;

// единственный <audio> в приложении
// рендерится в App рядом с Header, вне Routing: внутри страницы элемент
// размонтировался бы на переходе и музыка обрывалась бы на каждой ссылке
export const MiniPlayer = () => {
    const dispatch = useDispatch();

    const track = useSelector(selectCurrentTrack);
    const isPlaying = useSelector(selectIsPlaying);
    const hasNext = useSelector(selectHasNext);
    const hasPrev = useSelector(selectHasPrev);

    const audioRef = useRef<HTMLAudioElement>(null);

    // прогресс держим здесь, а не в сторе: timeupdate стреляет несколько раз
    // в секунду, и каждый dispatch перерисовывал бы всех подписчиков плеера
    const [currentTime, setCurrentTime] = useState(0);
    // длительность из метаданных файла; пока их нет, показываем число сервера
    const [loadedDuration, setLoadedDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    const trackId = track?.id;

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

        audio.currentTime = seconds;
        // ставим сразу, не дожидаясь timeupdate: иначе ползунок отскакивает назад
        setCurrentTime(seconds);
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
                onTimeUpdate={(e) =>
                    setCurrentTime(e.currentTarget.currentTime)
                }
                onLoadedMetadata={(e) => {
                    const { duration } = e.currentTarget;

                    // у mp3 без длительности в заголовках браузер отдаёт
                    // Infinity: ползунок с max=Infinity перестаёт двигаться,
                    // а formatDuration печатает "Infinity:NaN:NaN".
                    // В этом случае остаёмся на числе сервера
                    setLoadedDuration(Number.isFinite(duration) ? duration : 0);
                }}
                // сброс на старте загрузки нового src, а не в эффекте:
                // правило set-state-in-effect запрещает сеттер в useEffect
                onLoadStart={() => {
                    setCurrentTime(0);
                    setLoadedDuration(0);
                }}
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
                        <div className={s.title}>{track.title}</div>
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
