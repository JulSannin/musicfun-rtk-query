import { useGetMeQuery } from '@/entities/profile';
import { useFetchPlaylistsQuery } from '@/entities/playlist';
import { useUrlTab } from '@/shared/lib';

export type ProfileTab = 'tracks' | 'playlists';

// список вкладок лежит вне хука: он не зависит от пропсов и не должен
// пересоздаваться на каждый рендер. as const, чтобы из массива вывелся
// союз строк, а не string[]
export const PROFILE_TABS = [
    { value: 'tracks', label: 'My tracks' },
    { value: 'playlists', label: 'My playlists' },
] as const satisfies readonly { value: ProfileTab; label: string }[];

const TAB_VALUES = PROFILE_TABS.map((tab) => tab.value);

// вкладка, которую показываем, если в адресе ничего внятного нет
// сама она из адреса не исчезает: у обеих секций должна быть своя ссылка,
// поэтому /profile нормализуется в /profile?tab=tracks
const DEFAULT_TAB: ProfileTab = 'tracks';

// владеет данными профиля, выбранной секцией и списком своих плейлистов
export const useProfile = () => {
    const { data: me, isLoading: isMeLoading } = useGetMeQuery();

    // отличаем «ещё грузим» от «точно не залогинены»: по второму делаем редирект
    const isUnauthorized = !isMeLoading && !me;

    // секция живёт в адресе, а не в useState: с профиля уходят на страницу
    // плейлиста, и «назад» иначе возвращал бы не на ту вкладку.
    // Пока не решено, залогинен ли человек, адрес не трогаем: страница
    // с гостем всё равно сейчас уедет редиректом
    const { tab, setTab } = useUrlTab(TAB_VALUES, DEFAULT_TAB, !isUnauthorized);

    const {
        data: playlistsResponse,
        isLoading: isPlaylistsLoading,
        isError,
    } = useFetchPlaylistsQuery(
        // ни pageNumber, ни pageSize не передаём намеренно: сервер ограничивает
        // пользователя 10 плейлистами, а его дефолтный pageSize 20 —
        // свои плейлисты всегда влезают в одну страницу
        { userId: me?.userId },
        {
            // без skip ушло бы два запроса: первый с userId: undefined (все
            // плейлисты), второй — уже отфильтрованный, когда доедет auth/me.
            // Второе условие про вкладку: за невидимой секцией не ходим вовсе,
            // а при возврате на неё запроса не будет, пока запись жива в кеше
            skip: !me?.userId || tab !== 'playlists',
        }
    );

    // сортируем по order здесь, а не в transformResponse: тот общий для всех
    // выдач списка, и сортировка в нём сломала бы порядок по addedAt
    // на /playlists. Копию, а не sort на месте: данные приходят из кеша
    // RTK Query, и его массив трогать нельзя
    const playlists = playlistsResponse?.data
        ? [...playlistsResponse.data].sort(
              (a, b) => a.attributes.order - b.attributes.order
          )
        : undefined;

    return {
        login: me?.login,
        tab,
        onTabChange: setTab,
        isUnauthorized,
        playlists,
        // пока не приехал me, skip активен и собственный isLoading запроса false —
        // без isMeLoading страница на это время показала бы пустой список
        isLoading: isMeLoading || isPlaylistsLoading,
        isError,
    };
};
