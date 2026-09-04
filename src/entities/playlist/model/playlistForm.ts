// лимиты сервера; используются и правилом валидации, и текстом ошибки
export const PLAYLIST_TITLE_MAX_LENGTH = 100;
export const PLAYLIST_DESCRIPTION_MAX_LENGTH = 1000;

// поля формы плейлиста: это НЕ тип запроса, input всегда отдает строку
export type PlaylistFormValues = {
    title: string;
    description: string;
};
