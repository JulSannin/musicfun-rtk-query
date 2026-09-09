import { useState } from 'react';
import {
    PLAYLIST_TRACKS_MAX,
    useFetchPlaylistsQuery,
} from '@/entities/playlist';
import { useGetMeQuery } from '@/entities/profile';
import {
    useAddTrackToPlaylistMutation,
    useRemoveTrackFromPlaylistMutation,
} from '@/entities/track';

type Props = {
    trackId: string;
};

// состав своих плейлистов относительно одного трека: добавить и убрать
// обратное направление к AddTrackToPlaylist — там ищут трек, стоя
// в плейлисте, здесь выбирают плейлист, стоя на треке. Ручки те же самые,
// поэтому обе половины живут в одной фиче
//
// про залогиненность спрашивает сам компонент, а не панель: наверху про
// это знать незачем, а useGetMeQuery читает тот же кеш, что и Header —
// нового запроса не будет
export const AddTrackToMyPlaylist = ({ trackId }: Props) => {
    const { data: me } = useGetMeQuery();

    // список раскрывается по кнопке: держать его открытым незачем,
    // а пока он закрыт, за плейлистами вообще не ходим
    const [isOpen, setIsOpen] = useState(false);

    // свои плейлисты. Ни pageNumber, ни pageSize не передаём: сервер
    // ограничивает пользователя десятью плейлистами, они всегда влезают
    // в одну страницу — тот же приём, что на профиле
    const { data: mine, isError: isMineError } = useFetchPlaylistsQuery(
        { userId: me?.userId },
        // без userId запрос притащил бы чужие плейлисты, поэтому skip
        // не только по закрытому списку
        { skip: !isOpen || !me?.userId }
    );

    // те из них, где трек уже лежит: параметр trackId у списка плейлистов
    // как раз и значит «только содержащие этот трек». Отдельный запрос —
    // единственный способ это узнать: в выдаче списка состава нет
    const { data: withTrack, isError: isWithTrackError } =
        useFetchPlaylistsQuery(
            { userId: me?.userId, trackId },
            { skip: !isOpen || !me?.userId }
        );

    // ошибка любого из двух запросов гасит весь список, а не только свою
    // половину: без ответа про «где уже лежит» строки отрисовались бы
    // без пометок added, и клик по такой ушёл бы в 403
    const isError = isMineError || isWithTrackError;

    // ждём ОБА ответа, а не только список плейлистов. Первый может прийти
    // из кеша мгновенно (тот же аргумент просит профиль), и тогда строки
    // отрисовались бы без пометок «added» — по ним успели бы кликнуть
    // и получить 403 на трек, который в плейлисте уже лежит
    const isReady = !isError && Boolean(mine && withTrack);

    const [addTrack, { isLoading: isAdding }] = useAddTrackToPlaylistMutation();
    const [removeTrack, { isLoading: isRemoving }] =
        useRemoveTrackFromPlaylistMutation();

    // пока идёт любая операция, гасим все строки: второй клик по соседней
    // ушёл бы параллельным запросом, и лимит проверился бы по старым числам
    const isBusy = isAdding || isRemoving;

    // что поменяли прямо сейчас: id плейлиста -> лежит ли в нём трек.
    // Нет ключа — «спроси сервер». Один словарь на оба направления, потому
    // что отдельные списки «только что добавили» и «только что убрали»
    // разъезжаются при повторных кликах.
    // Ждать перезапроса нельзя: он придёт по инвалидации Playlists/LIST,
    // а до его прихода строка выглядела бы так, будто клик не сработал
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    const serverHasTrack = new Set(
        withTrack?.data.map((playlist) => playlist.id) ?? []
    );

    // пометки, которые сервер уже подтвердил, выбрасываем. Без этого они
    // живут до закрытия панели и однажды начинают врать: состав плейлиста
    // можно поменять и снаружи — например, со страницы плейлиста прямо
    // под открытой панелью, — и тогда строка покажет «add» у трека,
    // который там уже лежит.
    // Правим на рендере, а не эффектом: React выбросит этот проход до
    // коммита — тот же приём, что с номером страницы в usePlaylists.
    // Цикла не будет: после чистки совпавших ключей не остаётся
    const settled = Object.keys(overrides).filter(
        (playlistId) => overrides[playlistId] === serverHasTrack.has(playlistId)
    );

    if (isReady && settled.length > 0) {
        setOverrides((prev) => {
            const next = { ...prev };
            settled.forEach((playlistId) => delete next[playlistId]);

            return next;
        });
    }

    const addHandler = (playlistId: string) => {
        addTrack({ playlistId, trackId })
            .unwrap()
            .then(() =>
                setOverrides((prev) => ({ ...prev, [playlistId]: true }))
            )
            // 403 здесь значит «уже 10 треков» или «чужой плейлист»,
            // текст приходит от сервера и его показал handleErrors
            .catch(() => {});
    };

    // подтверждения нет намеренно, в отличие от удаления самого трека:
    // из плейлиста он уходит, но остаётся жив, и действие обратимо
    // повторным добавлением — то же правило, что в PlaylistTrackActions
    const removeHandler = (playlistId: string) => {
        removeTrack({ playlistId, trackId })
            .unwrap()
            .then(() =>
                setOverrides((prev) => ({ ...prev, [playlistId]: false }))
            )
            .catch(() => {});
    };

    // гостю показывать нечего: своих плейлистов у него нет, а сервер
    // на добавление ответит 401
    if (!me) return null;

    return (
        <div>
            <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
                {isOpen ? 'close' : 'add to my playlist'}
            </button>

            {isOpen && (
                <div>
                    {/* без этой ветки неудачный запрос оставлял бы
                        вечный «Loading...»: isReady так и не станет true */}
                    {isError && <div>Failed to load playlists</div>}

                    {!isError && !isReady && <div>Loading...</div>}

                    {/* плейлистов может не быть вовсе — это норма, а не сбой */}
                    {isReady && mine?.data.length === 0 && (
                        <div>You don&apos;t have any playlists yet</div>
                    )}

                    {isReady &&
                        mine?.data.map((playlist) => {
                            const onServer = serverHasTrack.has(playlist.id);
                            const isAdded = overrides[playlist.id] ?? onServer;

                            // счётчик приходит с сервера и про наш последний
                            // клик ещё не знает. Для добавления это неважно
                            // (строка и так помечена added и погашена), а вот
                            // после удаления isFull уже читается: плейлист,
                            // из которого только что убрали десятый трек,
                            // выглядел бы полным до перезапроса
                            const tracksCount =
                                playlist.attributes.tracksCount +
                                Number(isAdded) -
                                Number(onServer);
                            const isFull = tracksCount >= PLAYLIST_TRACKS_MAX;

                            return (
                                // обёртка, а не одна кнопка: вложить кнопку
                                // удаления внутрь кнопки добавления нельзя —
                                // это невалидная разметка
                                <span key={playlist.id}>
                                    <button
                                        type="button"
                                        onClick={() => addHandler(playlist.id)}
                                        disabled={isAdded || isFull || isBusy}
                                    >
                                        {playlist.attributes.title}
                                        {isAdded && ' — added'}
                                        {!isAdded && isFull && ' — full'}
                                    </button>

                                    {/* убрать можно только оттуда, где трек
                                        лежит; на остальных строках кнопки
                                        нет вовсе, а не погашена */}
                                    {isAdded && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeHandler(playlist.id)
                                            }
                                            disabled={isBusy}
                                            aria-label={`Remove track from ${playlist.attributes.title}`}
                                        >
                                            remove
                                        </button>
                                    )}
                                </span>
                            );
                        })}
                </div>
            )}
        </div>
    );
};
