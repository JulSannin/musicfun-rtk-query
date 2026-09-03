import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from '@/shared/api'

// redux store: reducer хранит кеш запросов, middleware — подписки и инвалидацию тегов
export const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
})

// поставляет события фокуса и сети; реагировать на них разрешают опции в baseApi
setupListeners(store.dispatch)
