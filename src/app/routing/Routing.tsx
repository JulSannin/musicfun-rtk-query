import { Routes, Route } from 'react-router';
import { MainPage } from '@/pages/main';
import { PlaylistsPage } from '@/pages/playlists';
import { TracksPage } from '@/pages/tracks';
import { ProfilePage } from '@/pages/profile';
import { OAuthCallbackPage } from '@/pages/oauth-callback';
import { PageNotFound } from '@/pages/not-found';
import { paths } from '@/shared/config';

// все роуты приложения
// пути берем из объекта paths, чтобы не писать строки руками в разных местах
// PageNotFound это "*", он ловит любой несуществующий адрес
// порядок роутов не важен: react-router сам выбирает наиболее подходящий,
// и "*" срабатывает, только если не подошло ничего конкретного
export const Routing = () => (
    <Routes>
        <Route path={paths.Main} element={<MainPage />} />
        <Route path={paths.Playlists} element={<PlaylistsPage />} />
        <Route path={paths.Tracks} element={<TracksPage />} />
        <Route path={paths.Profile} element={<ProfilePage />} />
        <Route path={paths.OAuthCallback} element={<OAuthCallbackPage />} />
        <Route path={paths.NotFound} element={<PageNotFound />} />
    </Routes>
);
