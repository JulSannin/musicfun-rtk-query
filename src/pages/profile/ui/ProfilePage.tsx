import { useState } from 'react';
import { Navigate } from 'react-router';
import { CreatePlaylistForm } from '@/features/playlist-create';
import { UploadTrackForm } from '@/features/track-upload';
import { MyTracks } from '@/widgets/my-tracks';
import { PlaylistsList } from '@/widgets/playlists-list';
import { paths } from '@/shared/config';
import { Tabs } from '@/shared/ui';
import { PROFILE_TABS, useProfile } from '../model/useProfile';
import s from './ProfilePage.module.css';

// страница профиля: свои плейлисты и свои треки
// именно здесь живёт управление собственными треками — публикация,
// правка и удаление: на общем списке /tracks им не место, там треки
// в основном чужие
export const ProfilePage = () => {
    const {
        login,
        isUnauthorized,
        tab,
        onTabChange,
        playlists,
        isLoading,
        isError,
    } = useProfile();

    // форма загрузки по умолчанию скрыта: на вкладке в первую очередь нужны
    // свои треки, а не создание нового. Состояние страницы, поэтому обычный
    // useState — как режим редактирования в списках
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // разлогиненного тут держать нечего: auth/me отвечает 401,
    // и вместо своих плейлистов человек увидел бы пустую страницу
    // replace обязателен: иначе /profile останется в истории и кнопка "назад"
    // вернёт на него же, снова редиректнет — получится залипание
    if (isUnauthorized) return <Navigate to={paths.Playlists} replace />;

    return (
        <>
            <h1>{login} page</h1>
            {/* сам переключатель лежит в shared/ui: такие же вкладки
                у библиотеки, и разметке незачем жить в двух местах */}
            <Tabs tabs={PROFILE_TABS} value={tab} onChange={onTabChange} />

            {/* в окне живёт только выбранная секция: невыбранная размонтирована,
                её подписка снята и запрос за ней не уходит. Данные при этом
                не пропадают сразу — запись кеша RTK Query живёт ещё минуту
                (keepUnusedDataFor), поэтому быстрый возврат мгновенный
                и без запроса */}
            <div className={s.container}>
                {tab === 'tracks' ? (
                    <>
                        {/* загрузка всегда создаёт НОВЫЙ трек: догрузить mp3
                            к существующему API не умеет вовсе. Поэтому форма
                            прячется за кнопкой, а не висит над списком */}
                        {isUploadOpen ? (
                            <div>
                                <UploadTrackForm
                                    onUploaded={() => setIsUploadOpen(false)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsUploadOpen(false)}
                                >
                                    cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsUploadOpen(true)}
                            >
                                + upload track
                            </button>
                        )}

                        {/* свои треки виджет грузит сам: страница отдаёт ему
                            только место в разметке */}
                        <MyTracks />
                    </>
                ) : (
                    <>
                        {/* создавать плейлисты можно только у себя, поэтому
                            форма здесь, а не на /playlists */}
                        <CreatePlaylistForm />
                        {/* единственное место, где порядок плейлистов
                            можно менять: он персональный, и виден только
                            в своём списке, отсортированном по order */}
                        <PlaylistsList
                            playlists={playlists}
                            isLoading={isLoading}
                            isError={isError}
                            emptyText="You don't have any playlists yet"
                            canReorder
                        />
                    </>
                )}
            </div>
        </>
    );
};
