import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useGetMeQuery } from '@/entities/profile';
import { useFetchPlaylistsQuery } from '@/entities/playlist';

// какая секция профиля открыта
// имя параметра локальное, а не в paths.ts: читает и пишет его только
// эта страница — как SEARCH_PARAM у списка плейлистов
const TAB_PARAM = 'tab';

export type ProfileTab = 'tracks' | 'playlists';

// вкладка, которую показываем, если в адресе ничего внятного нет
// сама она из адреса не исчезает: у обеих секций должна быть своя ссылка,
// поэтому /profile нормализуется в /profile?tab=tracks
const DEFAULT_TAB: ProfileTab = 'tracks';

// значение из адреса чужое, туда можно написать что угодно: сверяем
// со списком, а не приводим типом
const isProfileTab = (value: string | null): value is ProfileTab =>
    value === 'tracks' || value === 'playlists';

// владеет данными профиля, выбранной секцией и списком своих плейлистов
export const useProfile = () => {
    const { data: me, isLoading: isMeLoading } = useGetMeQuery();

    // секция живёт в адресе, а не в useState: с профиля уходят на страницу
    // плейлиста, и «назад» иначе возвращал бы не на ту вкладку
    const [searchParams, setSearchParams] = useSearchParams();

    const rawTab = searchParams.get(TAB_PARAM);
    const tab: ProfileTab = isProfileTab(rawTab) ? rawTab : DEFAULT_TAB;

    // useCallback, чтобы функцию можно было честно указать в зависимостях
    // эффекта ниже, а не глушить правило комментарием
    const writeTab = useCallback(
        (next: ProfileTab) => {
            setSearchParams(
                (prev) => {
                    // строим из prev, а не с нуля: рядом может лежать ?track=
                    // от открытой панели подробностей
                    const params = new URLSearchParams(prev);
                    params.set(TAB_PARAM, next);

                    return params;
                },
                // replace, а не push: «назад» должен уводить со страницы,
                // а не перелистывать секции по одной
                { replace: true }
            );
        },
        [setSearchParams]
    );

    // отличаем «ещё грузим» от «точно не залогинены»: по второму делаем редирект
    const isUnauthorized = !isMeLoading && !me;

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

    // дефолтную вкладку дописываем в адрес, а не оставляем /profile пустым:
    // иначе ссылка есть только у плейлистов, а на треки её не скопировать.
    // Сюда же попадает мусор в параметре (?tab=zzz) — он схлопывается
    // в ту вкладку, которую мы и так показываем
    useEffect(() => {
        // сейчас уедем редиректом на /playlists — параметр туда тащить незачем
        if (isUnauthorized) return;
        if (rawTab === tab) return;

        writeTab(tab);
    }, [rawTab, tab, isUnauthorized, writeTab]);

    return {
        login: me?.login,
        tab,
        onTabChange: writeTab,
        isUnauthorized,
        playlists: playlistsResponse?.data,
        // пока не приехал me, skip активен и собственный isLoading запроса false —
        // без isMeLoading страница на это время показала бы пустой список
        isLoading: isMeLoading || isPlaylistsLoading,
        isError,
    };
};
