// лимиты сервера; используются и правилом валидации, и текстом ошибки
export const TRACK_TITLE_MAX_LENGTH = 100;
export const TRACK_LYRICS_MAX_LENGTH = 5000;
// сервер принимает 0–5 тегов; пустой массив означает «снять все»
export const TRACK_TAGS_MAX = 5;

// то общее, что есть у обеих форм трека
// у загрузки на этом поля и заканчиваются: ручка upload принимает
// ровно title и file, ни текста, ни даты релиза в ней нет
export type TrackTitleFormValues = {
    title: string;
};

// поля формы правки трека: это НЕ тип запроса, input всегда отдаёт строку.
// releaseDate здесь в формате input[type=date] (yyyy-MM-dd), а сервер
// ждёт ISO 8601 — перекладывает это onSubmit
export type TrackFormValues = TrackTitleFormValues & {
    lyrics: string;
    releaseDate: string;
};
