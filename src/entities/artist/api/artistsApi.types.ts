// типы API артистов, написаны руками
// сверять с api-generated/types.gen.ts, перегенерация: npm run gen:api

// ==================== GET /artists/search ====================

// search обязателен: эндпоинта «отдай всех артистов» в API нет, только
// поиск по подстроке — как и у тегов
export type FetchArtistsArgs = {
    search: string;
};

// ответа-обёртки тут нет вовсе: сервер отдаёт готовый массив { id, name },
// поэтому transformResponse не нужен (в отличие от searchTags, где приходит
// конверт JSON API). Тип ответа — прямо ArtistRef[] из shared/api

// ==================== POST /artists ====================

// то, что реально принимает мутация
export type CreateArtistAttributes = {
    // сервер требует от 2 до 30 символов
    name: string;
};

// тело запроса с конвертом; наружу из слайса не уходит.
// Асимметрия, на которой легко ошибиться: запрос в конверте, а ответ —
// голый ArtistRef, без data/attributes
export type CreateArtistRequestPayload = {
    data: {
        type: 'artists';
        attributes: CreateArtistAttributes;
    };
};
