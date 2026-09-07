import { useParams } from 'react-router';
import { useFetchPlaylistQuery } from '@/entities/playlist';
import { useGetMeQuery } from '@/entities/profile';

// владеет запросом одного плейлиста
export const usePlaylist = () => {
    const { playlistId } = useParams<{ playlistId: string }>();

    // currentData, а не data: адрес /playlists/:playlistId один на все
    // плейлисты, и при переходе с одного на другой компонент не
    // размонтируется — data держит ответ по прошлому id и показала бы чужой
    const { currentData, isError } = useFetchPlaylistQuery(
        { playlistId: playlistId ?? '' },
        // без id запрос ушёл бы на playlists/ и вернул список вместо одного
        { skip: !playlistId }
    );

    // тот же кеш, что у Header: нового запроса не будет
    const { data: me } = useGetMeQuery();

    const attributes = currentData?.data.attributes;

    return {
        playlistId,
        attributes,
        // действия прячем ради интерфейса, а не безопасности:
        // на чужой плейлист бэкенд всё равно ответит 403
        isOwner: Boolean(me) && attributes?.user.id === me?.userId,
        // реагировать можно и на чужой плейлист, поэтому флаг отдельный
        canReact: Boolean(me),
        // «нечего показать, и это не ошибка» — значит грузим.
        // Ни isLoading, ни isFetching тут не годятся: до старта запроса
        // RTK Query отдаёт isFetching === undefined и isLoading === false,
        // и страница мигнула бы ошибкой на первом же рендере
        isLoading: Boolean(playlistId) && !currentData && !isError,
        isError,
    };
};
