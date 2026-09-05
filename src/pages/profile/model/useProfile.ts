import { useGetMeQuery } from '@/entities/profile';
import { useFetchPlaylistsQuery } from '@/entities/playlist';

// владеет данными профиля и списком собственных плейлистов
export const useProfile = () => {
    const { data: me, isLoading: isMeLoading } = useGetMeQuery();

    const {
        data: playlistsResponse,
        isLoading: isPlaylistsLoading,
        isError,
    } = useFetchPlaylistsQuery(
        // ни pageNumber, ни pageSize не передаём намеренно: сервер ограничивает
        // пользователя 10 плейлистами, а его дефолтный pageSize 20 —
        // свои плейлисты всегда влезают в одну страницу
        { userId: me?.userId },
        // без skip ушло бы два запроса: первый с userId: undefined (все плейлисты),
        // второй — уже отфильтрованный, когда доедет auth/me
        { skip: !me?.userId }
    );

    return {
        login: me?.login,
        // отличаем "ещё грузим" от "точно не залогинены": по второму делаем редирект
        isUnauthorized: !isMeLoading && !me,
        playlists: playlistsResponse?.data,
        // пока не приехал me, skip активен и собственный isLoading запроса false —
        // без isMeLoading страница на это время показала бы пустой список
        isLoading: isMeLoading || isPlaylistsLoading,
        isError,
    };
};
