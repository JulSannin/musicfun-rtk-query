import { baseApi } from '@/shared/api';
import type { TagRef } from '@/shared/api';
import type { FetchTagsArgs, GetTagsOutput } from './tagsApi.types';

export const tagsApi = baseApi
    .enhanceEndpoints({ addTagTypes: ['Tags'] })
    .injectEndpoints({
        endpoints: (build) => ({
            // GET запрос
            // ищет теги по подстроке; списка всех тегов эндпоинтом не получить,
            // поэтому вызывающий код обязан гасить запрос с пустой строкой через skip —
            // иначе сервер ответит 400 на обязательный search
            searchTags: build.query<TagRef[], FetchTagsArgs>({
                query: (params) => ({
                    method: 'GET',
                    url: 'tags/search',
                    params,
                }),

                // конверт разворачиваем здесь: наружу нужен ровно TagRef —
                // тот же тип уже лежит в атрибутах плейлиста, и выбранные теги
                // с найденными оказываются одной формы
                transformResponse: (response: GetTagsOutput): TagRef[] =>
                    response.data.map((tag) => ({
                        id: tag.id,
                        name: tag.attributes.name,
                    })),

                // каждая подстрока кешируется своей записью, тег у них общий
                providesTags: [{ type: 'Tags', id: 'LIST' }],
            }),
        }),
    });

export const { useSearchTagsQuery } = tagsApi;
