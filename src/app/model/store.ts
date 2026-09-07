import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/shared/api';
import { PLAYER_SLICE, playerReducer } from '@/entities/player';

// redux store: reducer хранит кеш запросов, middleware — подписки и инвалидацию тегов
export const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        // единственный слайс не про запросы: что играет, знают сразу
        // и плеер внизу экрана, и кнопки в списке треков, а живёт это
        // состояние дольше любой страницы — локальным useState не обойтись
        [PLAYER_SLICE]: playerReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

// поставляет события фокуса и сети; реагировать на них разрешают опции в baseApi
setupListeners(store.dispatch);

// нужен для useGlobalLoading: без явного типа state в useSelector был бы unknown
export type RootState = ReturnType<typeof store.getState>;
