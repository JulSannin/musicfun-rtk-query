import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {
    FetchPlaylistsArgs,
    GetPlaylistsOutput,
} from "./playlistsApi.types";

export const playlistsApi = createApi({
    reducerPath: "playlistsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_BASE_URL,
        headers: {
            "API-KEY": import.meta.env.VITE_API_KEY,
        },
    }),
    endpoints: (build) => {
        return {
            fetchPlaylists: build.query<GetPlaylistsOutput, FetchPlaylistsArgs>(
                {
                    query: (params) => ({url: "playlists/", params}),
                },
            ),
        };
    },
});

export const {useFetchPlaylistsQuery} = playlistsApi;
