import { baseApi } from '@/shared/api';
import type { ArtistRef } from '@/shared/api';
import type {
    CreateArtistAttributes,
    CreateArtistRequestPayload,
    FetchArtistsArgs,
} from './artistsApi.types';

export const artistsApi = baseApi
    .enhanceEndpoints({ addTagTypes: ['Artists'] })
    .injectEndpoints({
        endpoints: (build) => ({
            // GET запрос
            // ищет артистов по подстроке; списка всех артистов эндпоинтом
            // не получить, поэтому вызывающий код обязан гасить запрос
            // с пустой строкой через skip — search обязателен по спеке.
            // В отличие от тегов, эта ручка требует токен: гостю прилетит 401
            // (проверено запросом с одним API-KEY), поэтому пикер артистов
            // показывают только залогиненному
            searchArtists: build.query<ArtistRef[], FetchArtistsArgs>({
                query: (params) => ({
                    method: 'GET',
                    url: 'artists/search',
                    params,
                }),

                // transformResponse не нужен: сервер уже отдаёт массив
                // { id, name } — ровно ту форму, в которой артисты лежат
                // в атрибутах трека

                // каждая подстрока кешируется своей записью, тег у них общий:
                // создание артиста сбрасывает их разом, и он появляется
                // в подсказках, не дожидаясь новой буквы
                providesTags: [{ type: 'Artists', id: 'LIST' }],
            }),

            // POST запрос
            // заводит нового артиста; нужен, когда в поиске ничего не нашлось
            createArtist: build.mutation<ArtistRef, CreateArtistAttributes>({
                query: (attributes) => ({
                    method: 'POST',
                    url: 'artists',
                    // body в RTK Query имеет тип any, без satisfies ошибку
                    // в конверте никто не поймает
                    body: {
                        data: { type: 'artists', attributes },
                    } satisfies CreateArtistRequestPayload,
                }),

                // 403 здесь значит «уперся в лимит 100 артистов на пользователя»,
                // 409 — «артист с таким именем уже есть»; оба показывает handleErrors
                invalidatesTags: [{ type: 'Artists', id: 'LIST' }],
            }),
        }),
    });

export const { useSearchArtistsQuery, useCreateArtistMutation } = artistsApi;
