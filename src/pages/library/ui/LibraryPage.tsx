import { Navigate } from 'react-router';
import { PlaylistsList } from '@/widgets/playlists-list';
import { TracksList } from '@/widgets/tracks-list';
import { paths } from '@/shared/config';
import { Pagination, Tabs } from '@/shared/ui';
import { LIBRARY_TABS, useLibrary } from '../model/useLibrary';
import s from './LibraryPage.module.css';

// библиотека: понравившиеся треки и понравившиеся плейлисты
// фильтров и поиска здесь нет намеренно — это быстрый вход в своё, а искать
// внутри лайкнутого можно тем же чекбоксом на /tracks и /playlists
export const LibraryPage = () => {
    const { tab, onTabChange, isUnauthorized, tracks, playlists } =
        useLibrary();

    // обе выдачи просят токен, гостю показывать нечего.
    // replace обязателен: иначе /library останется в истории, и «назад»
    // вернёт на него же, снова редиректнет — получится залипание
    if (isUnauthorized) return <Navigate to={paths.Playlists} replace />;

    return (
        <>
            <h1>Library</h1>

            <Tabs tabs={LIBRARY_TABS} value={tab} onChange={onTabChange} />

            {/* в окне живёт только выбранная секция: невыбранная размонтирована,
                её подписка снята и запрос за ней не уходит. Данные при этом
                не пропадают сразу — запись кеша живёт ещё минуту
                (keepUnusedDataFor), поэтому быстрый возврат мгновенный
                и без запроса */}
            <div className={s.container}>
                {tab === 'tracks' ? (
                    <TracksList
                        items={tracks.items}
                        queue={tracks.queue}
                        onTrackSelect={tracks.onTrackSelect}
                        // сюда попадают только залогиненные, реакции доступны всегда
                        canReact
                        isLoading={tracks.isLoading}
                        isError={tracks.isError}
                        isReloading={tracks.isReloading}
                        isFetchingNextPage={tracks.isFetchingNextPage}
                        hasNextPage={tracks.hasNextPage}
                        observerRef={tracks.observerRef}
                        emptyText="You haven't liked any tracks yet"
                    />
                ) : (
                    <>
                        {/* снятый лайк убирает карточку не патчем, а сбросом
                            тега Playlists/LIKED: состав этой выдачи меняет сама
                            реакция, и патч тут бессилен — добавить строку,
                            которой в ответе не было, ему неоткуда */}
                        <PlaylistsList
                            playlists={playlists.playlists}
                            isLoading={playlists.isLoading}
                            isError={playlists.isError}
                            isFetching={playlists.isFetching}
                            emptyText="You haven't liked any playlists yet"
                        />
                        <Pagination
                            page={playlists.page}
                            pagesCount={playlists.pagesCount}
                            onPageChange={playlists.onPageChange}
                            pageSize={playlists.pageSize}
                            onPageSizeChange={playlists.onPageSizeChange}
                        />
                    </>
                )}
            </div>
        </>
    );
};
