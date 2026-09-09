import { useGetMeQuery } from '@/entities/profile';
import { useUrlTab } from '@/shared/lib';
import { useLikedPlaylists } from './useLikedPlaylists';
import { useLikedTracks } from './useLikedTracks';

export type LibraryTab = 'tracks' | 'playlists';

// список вкладок лежит вне хука: он не зависит от пропсов и не должен
// пересоздаваться на каждый рендер
export const LIBRARY_TABS = [
    { value: 'tracks', label: 'Liked tracks' },
    { value: 'playlists', label: 'Liked playlists' },
] as const satisfies readonly { value: LibraryTab; label: string }[];

const TAB_VALUES = LIBRARY_TABS.map((tab) => tab.value);

const DEFAULT_TAB: LibraryTab = 'tracks';

// владеет выбранной секцией библиотеки и обоими списками
//
// оба хука зовутся всегда, а не по ветке if: хуки нельзя звать условно,
// да и не нужно — запрос за скрытой секцией гасит skip, зато состояние
// (номер страницы у плейлистов) переживает переключение вкладок,
// хотя сама разметка секции размонтируется
export const useLibrary = () => {
    const { data: me, isLoading: isMeLoading } = useGetMeQuery();

    // отличаем «ещё грузим» от «точно не залогинены»: по второму делаем редирект
    const isUnauthorized = !isMeLoading && !me;

    // пока не решено, залогинен ли человек, адрес не трогаем: страница
    // с гостем всё равно сейчас уедет редиректом
    const { tab, setTab } = useUrlTab(TAB_VALUES, DEFAULT_TAB, !isUnauthorized);

    // обе выдачи требуют токена: onlyLikedByMe без него это 401
    const isReady = Boolean(me);

    const tracks = useLikedTracks({ enabled: isReady && tab === 'tracks' });
    const playlists = useLikedPlaylists({
        enabled: isReady && tab === 'playlists',
    });

    return {
        tab,
        onTabChange: setTab,
        isUnauthorized,
        tracks: {
            ...tracks,
            // пока не приехал me, skip активен и собственный isLoading
            // запроса false — без isMeLoading список успел бы моргнуть пустым
            isLoading: isMeLoading || tracks.isLoading,
        },
        playlists: {
            ...playlists,
            isLoading: isMeLoading || playlists.isLoading,
        },
    };
};
