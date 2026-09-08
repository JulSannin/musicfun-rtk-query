import { Navigate } from 'react-router';
import { CreatePlaylistForm } from '@/features/playlist-create';
import { MyTracks } from '@/widgets/my-tracks';
import { PlaylistsList } from '@/widgets/playlists-list';
import { paths } from '@/shared/config';
import { useProfile } from '../model/useProfile';
import s from './ProfilePage.module.css';

// страница профиля: свои плейлисты и свои треки
// именно здесь живёт управление собственными треками — публикация,
// правка и удаление: на общем списке /tracks им не место, там треки
// в основном чужие
export const ProfilePage = () => {
    const { login, isUnauthorized, playlists, isLoading, isError } =
        useProfile();

    // разлогиненного тут держать нечего: auth/me отвечает 401,
    // и вместо своих плейлистов человек увидел бы пустую страницу
    // replace обязателен: иначе /profile останется в истории и кнопка "назад"
    // вернёт на него же, снова редиректнет — получится залипание
    if (isUnauthorized) return <Navigate to={paths.Playlists} replace />;

    return (
        <>
            <h1>{login} page</h1>
            <div className={s.container}>
                {/* создавать плейлисты можно только у себя, поэтому форма здесь, а не на /playlists */}
                <CreatePlaylistForm />
                <PlaylistsList
                    playlists={playlists}
                    isLoading={isLoading}
                    isError={isError}
                    emptyText="You don't have any playlists yet"
                />
                {/* свои треки виджет грузит сам: страница отдаёт ему
                    только место в разметке */}
                <MyTracks />
            </div>
        </>
    );
};
