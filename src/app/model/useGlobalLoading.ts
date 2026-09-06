import { useSelector } from 'react-redux';
import { QueryStatus } from '@reduxjs/toolkit/query';
import type { RootState } from './store';

// список эндпоинтов, у которых уже есть свой локальный индикатор загрузки
// (PlaylistsList гасит список и рисует полосу сам — его показывают и PlaylistsPage,
// и ProfilePage; TracksPage делает то же при смене фильтров, а при подгрузке
// следующей страницы показывает LoadingTrigger)
// строки, а не playlistsApi.endpoints.fetchPlaylists.name: entities намеренно не отдают
// наружу сам объект api, только хуки — см. CLAUDE.md
const excludedEndpoints = ['fetchPlaylists', 'fetchTracks'];

export const useGlobalLoading = () => {
    return useSelector((state: RootState) => {
        const queries = Object.values(state.baseApi.queries);
        const mutations = Object.values(state.baseApi.mutations);

        const hasActiveQueries = queries.some((query) => {
            if (query?.status !== QueryStatus.pending) return false;

            // для исключённых эндпоинтов бар нужен только на самый первый запрос —
            // пока локального индикатора ещё нет и показать загрузку больше нечем
            if (excludedEndpoints.includes(query.endpointName)) {
                const wasFulfilledBefore = queries.some(
                    (q) =>
                        q?.endpointName === query.endpointName &&
                        q?.status === QueryStatus.fulfilled
                );
                return !wasFulfilledBefore;
            }

            return true;
        });

        const hasActiveMutations = mutations.some(
            (mutation) => mutation?.status === QueryStatus.pending
        );

        return hasActiveQueries || hasActiveMutations;
    });
};
