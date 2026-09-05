import { baseApi } from '@/shared/api';
import { setTokens, clearTokens, getRefreshToken } from '@/shared/api';
import type {
    GetMeOutput,
    LoginOutput,
    LoginAttributes,
} from './profileApi.types';

export const profileApi = baseApi
    .enhanceEndpoints({ addTagTypes: ['Auth'] })
    .injectEndpoints({
        endpoints: (build) => ({
            getMe: build.query<GetMeOutput, void>({
                query: () => ({ method: 'GET', url: 'auth/me' }),
                providesTags: ['Auth'],
            }),

            login: build.mutation<LoginOutput, LoginAttributes>({
                query: (payload) => ({
                    method: 'POST',
                    url: 'auth/login',
                    // accessTokenTTL не может превышать время жизни refreshToken,
                    // поэтому "1d" работает только в паре с rememberMe: true
                    // (30 дней); при rememberMe: false refresh живёт 30 минут
                    // и бэкенд отвечает 400
                    body: { ...payload, accessTokenTTL: '1d' },
                }),
                async onQueryStarted(_args, { queryFulfilled }) {
                    // без try/catch неудачный логин (например, код уже использован
                    // или истёк) улетал бы необработанным промисом
                    try {
                        const { data } = await queryFulfilled;
                        setTokens(data.accessToken, data.refreshToken);
                    } catch {
                        // тост уже покажет handleErrors в baseQueryWithReauth
                    }
                },
                invalidatesTags: ['Auth'],
            }),

            logout: build.mutation<void, void>({
                query: () => ({
                    method: 'POST',
                    url: 'auth/logout',
                    body: { refreshToken: getRefreshToken() },
                }),
                async onQueryStarted(_args, { queryFulfilled, dispatch }) {
                    try {
                        await queryFulfilled;
                        dispatch(baseApi.util.resetApiState());
                    } finally {
                        // токены чистим в любом случае: даже если сетевой /auth/logout
                        // не прошёл (например, refreshToken уже невалиден), локально
                        // разлогиниваемся — иначе кнопка logout не будет работать
                        clearTokens();
                    }
                },
            }),
        }),
    });

export const { useGetMeQuery, useLoginMutation, useLogoutMutation } =
    profileApi;
