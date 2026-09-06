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
