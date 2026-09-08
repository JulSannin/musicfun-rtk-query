// лимиты сервера; используются и правилом валидации, и текстом ошибки
export const TRACK_TITLE_MAX_LENGTH = 100;
export const TRACK_LYRICS_MAX_LENGTH = 5000;
// сервер принимает 0–5 тегов; пустой массив означает «снять все»
export const TRACK_TAGS_MAX = 5;

// поля формы трека: это НЕ тип запроса, input всегда отдает строку.
// releaseDate здесь в формате input[type=date] (yyyy-MM-dd), а сервер
// ждёт ISO 8601 — перекладывает это onSubmit
export type TrackFormValues = {
    title: string;
    lyrics: string;
    releaseDate: string;
};
