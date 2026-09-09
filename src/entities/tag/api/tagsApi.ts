import { baseApi } from '@/shared/api';
import type { TagRef } from '@/shared/api';
import type {
    CreateTagAttributes,
    CreateTagRequestPayload,
    FetchTagsArgs,
    GetTagOutput,
    GetTagsOutput,
} from './tagsApi.types';

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

                // каждая подстрока кешируется своей записью, тег у них общий:
                // создание сбрасывает их разом, и новый тег появляется
                // в подсказках, не дожидаясь новой буквы
                providesTags: [{ type: 'Tags', id: 'LIST' }],
            }),

            // POST запрос
            // заводит новый тег; нужен, когда в поиске ничего не нашлось —
            // ручки «отдай все теги» нет, и без создания набор тегов был бы
            // ограничен тем, что кто-то завёл раньше
            createTag: build.mutation<TagRef, CreateTagAttributes>({
                query: (attributes) => ({
                    method: 'POST',
                    url: 'tags',
                    // body в RTK Query имеет тип any, без satisfies ошибку
                    // в конверте никто не поймает
                    body: {
                        data: { type: 'tags', attributes },
                    } satisfies CreateTagRequestPayload,
                }),

                // разворачиваем так же, как в поиске: наружу нужен ровно TagRef,
                // чтобы созданный тег лёг к выбранным без переклада полей.
                // У артистов этого шага нет — там сервер отдаёт готовый объект
                transformResponse: (response: GetTagOutput): TagRef => ({
                    id: response.data.id,
                    name: response.data.attributes.name,
                }),

                // 403 здесь значит «уперся в лимит 100 тегов на пользователя»,
                // 409 — «тег с таким именем уже есть»; оба показывает handleErrors
                invalidatesTags: [{ type: 'Tags', id: 'LIST' }],
            }),
        }),
    });

export const { useSearchTagsQuery, useCreateTagMutation } = tagsApi;
