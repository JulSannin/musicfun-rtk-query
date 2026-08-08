import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from '../api/baseApi'

// redux store всего приложения
// RTK Query подключается двумя частями:
// reducer хранит кеш запросов,
// middleware следит за подписками, инвалидацией тегов и очисткой кеша
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
})

// подписывается на события браузера: возврат фокуса на вкладку и появление сети
// сам по себе refetch не включает — для этого нужны опции
// refetchOnFocus / refetchOnReconnect, сейчас они не заданы
setupListeners(store.dispatch)
