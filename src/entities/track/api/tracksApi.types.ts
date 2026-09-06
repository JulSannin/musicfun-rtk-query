import type {
    CurrentUserReaction,
    Images,
    SortDirection,
    User,
} from '@/shared/api';

// типы API треков, написаны руками
// сверять их нужно с api-generated/types.gen.ts — это выгрузка из свагера
// перегенерировать справочник: npm run gen:api

// ==================== GET /playlists/tracks ====================

// поле сортировки списка треков
// у треков это publishedAt, а у плейлистов addedAt — общего union нет,
// и PlaylistSortBy сюда не подходит, хотя выглядит похоже
export type TrackSortBy = 'publishedAt' | 'likesCount';

// аргументы списка треков
// курсора здесь нет намеренно: страницами заведует infiniteQuery
// и подставляет его сам через pageParam
export type FetchTracksArgs = {
    search?: string;
    sortBy?: TrackSortBy;
    sortDirection?: SortDirection;
    tagsIds?: string[];
    // фильтра по артистам в UI пока нет: он требует поиска артистов,
    // а тот, в отличие от поиска тегов, работает только с bearer-токеном
    artistsIds?: string[];
    userId?: string;
    // черновики приезжают, только если userId — это сам текущий пользователь;
    // флаг в одиночку не делает ничего
    includeDrafts?: boolean;
    onlyLikedByMe?: boolean;
};

// ответ со списком треков
// included лежит рядом с data, а не внутри трека: имена артистов сервер отдает
// отдельным массивом, а в самом треке хранит только их id
export type GetTrackListOutput = {
    data: TrackListItemResource[];
    included: IncludedArtistOutput[];
    meta: JsonApiMetaWithPagingAndCursor;
};

// один трек из списка
export type TrackListItemResource = {
    id: string;
    // здесь именно string, а не литерал 'tracks': в выгрузке тип не сужен
    type: string;
    attributes: TrackListItemAttributes;
    relationships: TrackRelationships;
};

// данные одного трека
// не экспортируем: компонентам нужны отдельные поля, а не весь объект
type TrackListItemAttributes = {
    title: string;
    addedAt: string;
    likesCount: number;
    // файлы трека; массив пустой, если mp3 еще не залили
    attachments: TrackAttachment[];
    images: Images;
    user: User;
    currentUserReaction: CurrentUserReaction;
    isPublished: boolean;
    // у черновика даты публикации нет, поэтому поле и опциональное, и nullable
    publishedAt?: string | null;
    // длительность в секундах
    duration: number;
};

// загруженный файл трека
type TrackAttachment = {
    id: string;
    addedAt: string;
    updatedAt: string;
    version: number;
    url: string;
    contentType: string;
    originalName: string;
    fileSize: number;
};

// связи трека: артистов может быть несколько, поэтому data это массив
type TrackRelationships = {
    artists: {
        data: { id: string; type: string }[];
    };
};

// артист из included; имя лежит в attributes, связь с треком идет по id
type IncludedArtistOutput = {
    id: string;
    type: string;
    attributes: { name: string };
};

// мета курсорной пагинации
// при paginationType=cursor сервер не считает общее количество, поэтому
// totalCount и pagesCount приходят null — ориентируемся только на nextCursor
type JsonApiMetaWithPagingAndCursor = {
    page: number;
    pageSize: number;
    totalCount: number | null;
    pagesCount: number | null;
    // курсор следующей страницы; null означает, что список кончился
    nextCursor: string | null;
};
