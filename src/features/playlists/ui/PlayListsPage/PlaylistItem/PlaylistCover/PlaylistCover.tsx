import defaultCover from "@/assets/images/default-playlist-cover.png";
import {
  useDeletePlaylistCoverMutation,
  useUploadPlaylistCoverMutation,
} from "@/features/playlists/api/playlistsApi";
import type { ChangeEvent } from "react";
import type { Images } from "@/common/types/types";
import { toast } from "react-toastify";
import s from "./PlaylistCover.module.css";

type Props = {
  // id нужен обеим мутациям, поэтому принимаем его отдельно
  playlistId: string;
  // весь плейлист компоненту не нужен, только его картинки
  images: Images;
};

// обложка плейлиста вместе со всеми действиями над ней
// показывает картинку, загружает новую, удаляет текущую
export const PlaylistCover = ({ playlistId, images }: Props) => {
  // сервер отдает несколько размеров одной картинки, берем оригинал
  const originalCover = images.main?.find((img) => img.type === "original");

  // обложки может не быть вовсе, тогда показываем заглушку из assets
  const src = originalCover ? originalCover.url : defaultCover;

  // мутации живут здесь, а не на странице: кнопки тоже здесь
  // из хуков забираем статус запроса, чтобы блокировать управление
  // имена сразу разводим: два isLoading в одной области видимости не уживутся
  const [uploadCover, { isLoading: isUploading }] =
    useUploadPlaylistCoverMutation();
  const [deleteCover, { isLoading: isDeleting }] =
    useDeletePlaylistCoverMutation();

  // пока идет любая операция с обложкой, вторую не начинаем
  // заодно защищает от повторных кликов: запрос идет секунды, а кнопка живая
  const isBusy = isUploading || isDeleting;

  // обработчик загрузки обложки
  // тип и размер проверяем до отправки: сервер откажет, но незачем ходить зря
  const uploadCoverHandler = (event: ChangeEvent<HTMLInputElement>) => {
    // ограничения повторяют серверные, они описаны в свагере у этого эндпоинта
    // сервер требует еще квадратную картинку от 500px, это здесь не проверяется
    const maxSize = 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

    // files может быть пустым, если пользователь закрыл диалог без выбора
    const file = event.target.files?.length && event.target.files[0];

    if (!file) return;

    // об ошибках везде сообщаем тостом, alert в проекте больше не используем
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG or GIF images are allowed");
      return;
    }

    if (file.size > maxSize) {
      toast.error(
        `The file is too large. Max size is ${Math.round(maxSize / 1024)} KB`,
      );
      return;
    }

    uploadCover({ playlistId, file })
      .unwrap()
      .catch(() => toast.error("Failed to change the image"));
  };

  // обработчик удаления обложки
  // id не принимаем: компонент знает, чью обложку показывает
  // confirm оставлен нативным намеренно: это вопрос, а не уведомление,
  // тостом его не заменить — нужен ответ пользователя до запроса
  const deleteCoverHandler = () => {
    if (confirm("Are you sure you want to delete the cover?")) {
      deleteCover({ playlistId })
        .unwrap()
        .catch(() => toast.error("Failed to delete the image"));
    }
  };

  return (
    <>
      <img src={src} alt="cover" width={"240px"} className={s.cover} />
      {/* accept только подсказывает браузеру фильтр в диалоге */}
      {/* тип файла он не гарантирует, поэтому проверка в обработчике нужна */}
      {/* disabled на время запроса: иначе можно выбрать второй файл поверх */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={uploadCoverHandler}
        disabled={isBusy}
      />
      {/* у загрузки нет своей кнопки, поэтому статус показываем отдельно */}
      {isUploading && <div>uploading...</div>}
      {/* удалять нечего, пока обложки нет */}
      {originalCover && (
        <button onClick={deleteCoverHandler} disabled={isDeleting}>
          {/* текст на кнопке заодно работает индикатором запроса */}
          {isDeleting ? "deleting..." : "delete cover"}
        </button>
      )}
    </>
  );
};
