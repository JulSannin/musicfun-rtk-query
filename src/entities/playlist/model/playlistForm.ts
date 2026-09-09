// лимиты сервера; используются и правилом валидации, и текстом ошибки
export const PLAYLIST_TITLE_MAX_LENGTH = 100;
export const PLAYLIST_DESCRIPTION_MAX_LENGTH = 1000;
// сервер принимает 0–5 тегов; пустой массив означает «снять все»
export const PLAYLIST_TAGS_MAX = 5;
// одиннадцатый трек сервер не возьмёт: ответит 403 с текстом про лимит.
// Лимит принадлежит плейлисту, а не кнопке, поэтому лежит здесь — его
// читают обе стороны добавления: и поиск трека на странице плейлиста,
// и выбор плейлиста из панели трека
export const PLAYLIST_TRACKS_MAX = 10;

// поля формы плейлиста: это НЕ тип запроса, input всегда отдает строку
export type PlaylistFormValues = {
    title: string;
    description: string;
};
