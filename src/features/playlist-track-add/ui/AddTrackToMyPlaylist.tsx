import { useState } from 'react';
import {
    PLAYLIST_TRACKS_MAX,
    useFetchPlaylistsQuery,
} from '@/entities/playlist';
import { useGetMeQuery } from '@/entities/profile';
import { useAddTrackToPlaylistMutation } from '@/entities/track';

type Props = {
    trackId: string;
};

// добавление трека в один из своих плейлистов — обратное направление
// к AddTrackToPlaylist: там ищут трек, стоя в плейлисте, здесь выбирают
// плейлист, стоя на треке. Ручка добавления одна и та же, поэтому обе
// половины живут в одной фиче
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
    const { data: mine } = useFetchPlaylistsQuery(
        { userId: me?.userId },
        // без userId запрос притащил бы чужие плейлисты, поэтому skip
        // не только по закрытому списку
        { skip: !isOpen || !me?.userId }
    );

    // те из них, где трек уже лежит: параметр trackId у списка плейлистов
    // как раз и значит «только содержащие этот трек». Отдельный запрос —
    // единственный способ это узнать: в выдаче списка состава нет
    const { data: withTrack } = useFetchPlaylistsQuery(
        { userId: me?.userId, trackId },
        { skip: !isOpen || !me?.userId }
    );

    // ждём ОБА ответа, а не только список плейлистов. Первый может прийти
    // из кеша мгновенно (тот же аргумент просит профиль), и тогда строки
    // отрисовались бы без пометок «added» — по ним успели бы кликнуть
    // и получить 403 на трек, который в плейлисте уже лежит
    const isReady = Boolean(mine && withTrack);

    const [addTrack, { isLoading: isAdding }] = useAddTrackToPlaylistMutation();

    // добавленные прямо сейчас. Ждать перезапроса нельзя: он придёт
    // по инвалидации Playlists/LIST, а до его прихода строка выглядела бы
    // так, будто клик не сработал
    const [justAdded, setJustAdded] = useState<string[]>([]);

    const addedIds = new Set([
        ...(withTrack?.data.map((playlist) => playlist.id) ?? []),
        ...justAdded,
    ]);

    const addHandler = (playlistId: string) => {
        addTrack({ playlistId, trackId })
            .unwrap()
            .then(() => setJustAdded((prev) => [...prev, playlistId]))
            // 403 здесь значит «уже 10 треков» или «чужой плейлист»,
            // текст приходит от сервера и его показал handleErrors
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
                    {!isReady && <div>Loading...</div>}

                    {/* плейлистов может не быть вовсе — это норма, а не сбой */}
                    {isReady && mine?.data.length === 0 && (
                        <div>You don&apos;t have any playlists yet</div>
                    )}

                    {isReady &&
                        mine?.data.map((playlist) => {
                            const isAdded = addedIds.has(playlist.id);
                            // счётчик берём как есть, поправка на только что
                            // добавленный трек не нужна: такая строка и так
                            // помечена added и уже недоступна
                            const isFull =
                                playlist.attributes.tracksCount >=
                                PLAYLIST_TRACKS_MAX;

                            return (
                                <button
                                    type="button"
                                    key={playlist.id}
                                    onClick={() => addHandler(playlist.id)}
                                    // пока идёт добавление, гасим все строки:
                                    // второй клик по соседней ушёл бы
                                    // параллельным запросом
                                    disabled={isAdded || isFull || isAdding}
                                >
                                    {playlist.attributes.title}
                                    {isAdded && ' — added'}
                                    {!isAdded && isFull && ' — full'}
                                </button>
                            );
                        })}
                </div>
            )}
        </div>
    );
};
