import type { SortDirection } from '@/shared/api';
import type { TrackSortBy } from '../api/tracksApi.types';

// умолчания списка треков
// лежат здесь, а не в состоянии страницы, потому что тем же набором аргументов
// плеер просит выдачу для себя: RTK Query кеширует ответ по аргументу, и стоит
// значениям разойтись — уйдёт второй запрос за тем же самым списком
export const DEFAULT_TRACK_SORT_BY: TrackSortBy = 'publishedAt';
export const DEFAULT_TRACK_SORT_DIRECTION: SortDirection = 'desc';
