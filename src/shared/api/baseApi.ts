// baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchArgs } from '@reduxjs/toolkit/query';
import { handleErrors } from './handleErrors';

export const baseApi = createApi({
    reducerPath: 'baseApi',
    refetchOnFocus: true,
    refetchOnReconnect: true,

    baseQuery: async (args, api, extraOptions) => {
        const result = await fetchBaseQuery({
            baseUrl: import.meta.env.VITE_BASE_URL,
            headers: {
                'API-KEY': import.meta.env.VITE_API_KEY,
            },
            prepareHeaders: (headers) => {
                headers.set(
                    'Authorization',
                    `Bearer ${import.meta.env.VITE_ACCESS_TOKEN}`
                );
                return headers;
            },
        })(args as string | FetchArgs, api, extraOptions);

        if (result.error) {
            handleErrors(result.error);
        }

        return result;
    },

    endpoints: () => ({}),
});
