// реакция текущего пользователя на плейлист или трек
// сервер отдает числа, здесь даем им понятные имена
// as const нужен, чтобы типы были 1 | -1 | 0, а не просто number
export const CurrentUserReaction = {
  Like: 1,
  Dislike: -1,
  None: 0,
} as const;

// объект и тип названы одинаково намеренно:
// объект дает значения в рантайме, тип дает типизацию
export type CurrentUserReaction =
  (typeof CurrentUserReaction)[keyof typeof CurrentUserReaction];
