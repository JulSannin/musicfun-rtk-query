import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { playlistsApi } from '@/features/playlists/api/playlistsApi'

// redux store всего приложения
// RTK Query подключается двумя частями:
// reducer хранит кеш запросов,
// middleware следит за подписками, инвалидацией тегов и очисткой кеша
export const store = configureStore({
  reducer: {
    [playlistsApi.reducerPath]: playlistsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(playlistsApi.middleware),
})

// подписывается на события браузера: возврат фокуса на вкладку и появление сети
// сам по себе refetch не включает — для этого нужны опции
// refetchOnFocus / refetchOnReconnect, сейчас они не заданы
setupListeners(store.dispatch)
