import type { CurrentUserReaction } from '@/shared/api';
import type { Images, TagRef, User } from '@/shared/api';

// типы API плейлистов, написаны руками
// сверять их нужно с api-generated/types.gen.ts — это выгрузка из свагера
// перегенерировать справочник: npm run gen:api

// ==================== GET /playlists ====================

// тип аргументов GET запроса на получение списка плейлистов
// все поля опциональные, уходят в query строку
export type FetchPlaylistsArgs = {
    pageNumber?: number;
    // свагер объявляет maximum: 20, но это устаревшее ограничение:
    // по факту бэкенд принимает и 40 (см. PAGE_SIZE_OPTIONS в shared/ui/Pagination)
    pageSize?: number;
    search?: string;
    sortBy?: 'addedAt' | 'likesCount';
    sortDirection?: 'asc' | 'desc';
    // именно массив строк, а не объектов: сервер ждет id тегов
    tagsIds?: string[];
    userId?: string;
    trackId?: string;
    onlyLikedByMe?: boolean;
};

// тип ответа GET запроса со списком плейлистов
// сервер отдает не все плейлисты сразу, а одну страницу
export type GetPlaylistsOutput = {
    data: PlaylistListItemResource[];
    meta: JsonApiMetaWithPaging;
};

// тип одного плейлиста из списка
export type PlaylistListItemResource = {
    id: string;
    type: 'playlists';
    attributes: PlaylistListItemAttributes;
};

// информация о пагинации
// по ней рисуем кнопки назад/вперед и счетчик страниц
export type JsonApiMetaWithPaging = {
    totalCount: number;
    page: number;
    pageSize: number;
    pagesCount: number;
};

// данные одного плейлиста в списке
// обратите внимание: description здесь нет, он есть только в карточке
// не экспортируем: компонентам нужны отдельные поля, а не весь объект
type PlaylistListItemAttributes = {
    title: string;
    addedAt: string;
    updatedAt: string;
    order: number;
    user: User;
    images: Images;
    tags: TagRef[];
    likesCount: number;
    dislikesCount: number;
    currentUserReaction: CurrentUserReaction;
    tracksCount: number;
    duration: number;
};

// ==================== GET /playlists/{playlistId} ====================
// Arguments: playlistId: string

// тип ответа GET запроса одного плейлиста
export type GetPlaylistOutput = {
    data: PlaylistResource;
};

// тип одного плейлиста
export type PlaylistResource = {
    id: string;
    type: 'playlists';
    attributes: PlaylistAttributes;
};

// полная информация о плейлисте
// в отличие от списка, здесь есть description
type PlaylistAttributes = {
    title: string;
    description: string | null;
    addedAt: string;
    updatedAt: string;
    order: number;
    user: User;
    images: Images;
    tags: TagRef[];
    likesCount: number;
    dislikesCount: number;
    currentUserReaction: CurrentUserReaction;
    tracksCount: number;
    duration: number;
};

// ==================== POST /playlists ====================
// Ответ: GetPlaylistOutput (см. секцию GET /playlists/{playlistId})

// тип тела POST запроса на создание плейлиста
// собирается внутри playlistsApi.ts, компоненты его не видят
export type CreatePlaylistRequestPayload = {
    data: CreatePlaylistData;
};

// корневой объект JSON API
type CreatePlaylistData = {
    type: 'playlists';
    attributes: CreatePlaylistAttributes;
};

// данные, необходимые для создания плейлиста
// именно это принимает мутация createPlaylist
export type CreatePlaylistAttributes = {
    title: string;
    // null означает "описания нет", пустая строка "" сервером считается описанием
    description: string | null;
};

// ==================== PUT /playlists/{playlistId} ====================

// тип тела PUT запроса на обновление плейлиста
export type UpdatePlaylistRequestPayload = {
    data: UpdatePlaylistData;
};

// корневой объект JSON API
type UpdatePlaylistData = {
    type: 'playlists';
    attributes: UpdatePlaylistAttributes;
};

// данные, которые можно изменить
// именно это принимает мутация updatePlaylist
export type UpdatePlaylistAttributes = {
    title: string;
    description: string | null;
    // поле обязательное, и пустой массив означает "удалить все теги"
    // поэтому при правке названия теги нужно передавать заново
    tagIds: string[];
};

// ============ POST / DELETE /playlists/{playlistId}/images/main ============
// своих типов тут нет: на вход File, на выход Images из @/shared/api
