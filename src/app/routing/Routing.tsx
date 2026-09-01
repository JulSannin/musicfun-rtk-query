import { Routes, Route } from 'react-router'
import { MainPage } from '../ui/MainPage/MainPage'
import { PlayListsPage, TracksPage, ProfilePage } from '@/features'
import { Paths, PageNotFound } from '@/common'

// все роуты приложения
// пути берем из объекта Path, чтобы не писать строки руками в разных местах
// PageNotFound это "*", он ловит любой несуществующий адрес
// порядок роутов не важен: react-router сам выбирает наиболее подходящий,
// и "*" срабатывает, только если не подошло ничего конкретного
export const Routing = () => (
    <Routes>
        <Route path={Paths.Main} element={<MainPage />} />
        <Route path={Paths.Playlists} element={<PlayListsPage />} />
        <Route path={Paths.Tracks} element={<TracksPage />} />
        <Route path={Paths.Profile} element={<ProfilePage />} />
        <Route path={Paths.NotFound} element={<PageNotFound />} />
    </Routes>
)
