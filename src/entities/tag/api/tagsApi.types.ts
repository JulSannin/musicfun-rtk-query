// типы API тегов, написаны руками
// сверять с api-generated/types.gen.ts, перегенерация: npm run gen:api

// ==================== GET /tags/search ====================

// search обязателен: эндпоинта «отдай все теги» в API нет, только поиск по подстроке
export type FetchTagsArgs = {
    search: string;
};

export type GetTagsOutput = {
    data: TagResource[];
};

export type TagResource = {
    id: string;
    type: 'tags';
    attributes: TagAttributes;
};

// не экспортируем: наружу слайс отдаёт готовый TagRef из shared/api
type TagAttributes = {
    name: string;
};

// ==================== POST /tags ====================

// то, что реально принимает мутация
export type CreateTagAttributes = {
    // сервер требует от 2 до 30 символов
    name: string;
};

// тело запроса с конвертом; наружу из слайса не уходит
export type CreateTagRequestPayload = {
    data: {
        type: 'tags';
        attributes: CreateTagAttributes;
    };
};

// ответ создания — конверт с одним тегом
// вот здесь копипаст с артистов не сработает: POST /artists отдаёт голый
// ArtistRef, а этот эндпоинт — те же data/attributes, что и поиск тегов,
// поэтому ответ приходится разворачивать transformResponse'ом
export type GetTagOutput = {
    data: TagResource;
};
