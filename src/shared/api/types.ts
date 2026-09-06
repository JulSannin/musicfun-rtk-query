// общие типы API
// встречаются сразу в нескольких сущностях: в плейлистах, треках, тегах

// автор плейлиста или трека
export type User = {
    id: string;
    name: string;
};

// картинки сущности
// main опциональный: у плейлиста без обложки этого поля в ответе не будет
export type Images = {
    main?: Cover[];
};

// тег в том виде, в каком его отдает сервер
// на запись сервер ждет только массив id, без name
export type TagRef = {
    id: string;
    name: string;
};

// один размер обложки
// на одну картинку сервер отдает несколько таких вариантов
export type Cover = {
    type: 'original' | 'medium' | 'thumbnail';
    width: number;
    height: number;
    fileSize: number;
    url: string;
};

// реакция текущего пользователя на плейлист или трек
// сервер отдает числа, здесь даем им понятные имена
// as const нужен, чтобы типы были 1 | -1 | 0, а не просто number
export const CurrentUserReaction = {
    Like: 1,
    Dislike: -1,
    None: 0,
} as const;

// ответ эндпоинтов реакции: сервер сам пересчитывает счётчики и отдаёт итог
// поля названы не как в атрибутах сущности (likes против likesCount) —
// перекладывать значения придётся руками
export type ReactionOutput = {
    objectId: string;
    value: CurrentUserReaction;
    likes: number;
    dislikes: number;
};

// объект и тип названы одинаково намеренно:
// объект дает значения в рантайме, тип дает типизацию
export type CurrentUserReaction =
    (typeof CurrentUserReaction)[keyof typeof CurrentUserReaction];
