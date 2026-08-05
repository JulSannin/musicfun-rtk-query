import { Routes, Route } from "react-router"
import { MainPage } from "../ui/MainPage/MainPage"
import { PlayListsPage, TracksPage, ProfilePage } from "@/features"
import { Path, PageNotFound } from "@/common"

export const Routing = () => (
  <Routes>
    <Route path={Path.Main} element={<MainPage />} />
    <Route path={Path.Playlists} element={<PlayListsPage />} />
    <Route path={Path.Tracks} element={<TracksPage />} />
    <Route path={Path.Profile} element={<ProfilePage />} />
    <Route path={Path.NotFound} element={<PageNotFound />} />
  </Routes>
)