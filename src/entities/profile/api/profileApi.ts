import { baseApi } from '@/shared/api';
import type { GetMeOutput } from './profileApi.types';

export const profileApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getMe: build.query<GetMeOutput, void>({
            query: () => ({
                method: 'GET',
                url: 'auth/me',
            }),
        }),
    }),
});

export const { useGetMeQuery } = profileApi;
