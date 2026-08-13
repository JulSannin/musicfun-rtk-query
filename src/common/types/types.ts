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
  type: "original" | "medium" | "thumbnail";
  width: number;
  height: number;
  fileSize: number;
  url: string;
};
