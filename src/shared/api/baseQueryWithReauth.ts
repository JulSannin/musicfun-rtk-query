import { Mutex } from 'async-mutex';
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import { handleErrors } from './handleErrors';
import {
    setTokens,
    clearTokens,
    getRefreshToken,
    isTokens,
} from './authTokens';

const mutex = new Mutex();

export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    await mutex.waitForUnlock();
    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        const refreshToken = getRefreshToken();

        // токена нет вообще (не залогинены) — на /auth/refresh даже не ходим,
        // просто отдаём исходную 401 дальше без побочных эффектов на кеш
        if (refreshToken && !mutex.isLocked()) {
            const release = await mutex.acquire();
            try {
                const refreshResult = await baseQuery(
                    {
                        url: 'auth/refresh',
                        method: 'POST',
                        body: { refreshToken },
                    },
                    api,
                    extraOptions
                );

                if (refreshResult.data && isTokens(refreshResult.data)) {
                    setTokens(
                        refreshResult.data.accessToken,
                        refreshResult.data.refreshToken
                    );
                    result = await baseQuery(args, api, extraOptions);
                } else {
                    // refreshToken невалиден/просрочен — тихо чистим токены локально.
                    // dispatch(resetApiState()) сюда специально не ставим: в Header
                    // useGetMeQuery подписан всегда, resetApiState немедленно
                    // перезапускает все активные запросы, тот же getMe снова ловит 401,
                    // снова пробует refresh — и это уходит в бесконечный цикл запросов
                    clearTokens();
                }
            } finally {
                release();
            }
        } else if (refreshToken) {
            await mutex.waitForUnlock();
            result = await baseQuery(args, api, extraOptions);
        }
    }

    if (result.error && result.error.status !== 401) {
        handleErrors(result.error);
    }

    return result;
};
