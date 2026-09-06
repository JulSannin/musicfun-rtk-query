import type { ChangeEvent } from 'react';
import type { Images } from '@/shared/api';
import {
    useDeletePlaylistCoverMutation,
    useUploadPlaylistCoverMutation,
} from '@/entities/playlist';
import {
    ALLOWED_IMAGE_TYPES,
    errorToast,
    PLAYLIST_COVER_RULES,
    validateImage,
} from '@/shared/lib';

type Props = {
    playlistId: string;
    // картинку не рисуем, но по ней понимаем, есть ли что удалять
    images: Images;
};

// загрузка и удаление обложки; показывается только владельцу плейлиста
// саму картинку рисует PlaylistCover из entities
export const PlaylistCoverActions = ({ playlistId, images }: Props) => {
    // проверка та же, что была рядом с img: пустой main означает "обложки нет"
    const hasCover = images.main?.some((img) => img.type === 'original');

    // имена разводим: два isLoading в одной области видимости не уживутся
    const [uploadCover, { isLoading: isUploading }] =
        useUploadPlaylistCoverMutation();
    const [deleteCover, { isLoading: isDeleting }] =
        useDeletePlaylistCoverMutation();

    // пока идёт любая операция с обложкой, вторую не начинаем
    const isBusy = isUploading || isDeleting;

    const uploadCoverHandler = async (event: ChangeEvent<HTMLInputElement>) => {
        // files пуст, если пользователь закрыл диалог без выбора
        const file = event.target.files?.length && event.target.files[0];

        // значение инпута сбрасываем сразу: иначе повторный выбор того же файла
        // после ошибки не вызовет onChange и кнопка будет выглядеть сломанной
        event.target.value = '';

        if (!file) return;

        // правила лежат в shared/lib: они принадлежат API, а не этой кнопке
        const error = await validateImage(file, PLAYLIST_COVER_RULES);

        if (error) {
            // клиентская проверка, до сервера дело не доходит — handleErrors тут ни при чем
            errorToast(error);
            return;
        }

        uploadCover({ playlistId, file })
            .unwrap()
            .catch(() => {});
    };

    // confirm нативный намеренно: нужен ответ пользователя до запроса, тостом его не заменить
    const deleteCoverHandler = () => {
        if (confirm('Are you sure you want to delete the cover?')) {
            deleteCover({ playlistId })
                .unwrap()
                .catch(() => {});
        }
    };

    return (
        <>
            {/* accept только подсказывает браузеру фильтр, тип файла он не гарантирует */}
            <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={uploadCoverHandler}
                disabled={isBusy}
            />
            {/* у загрузки нет своей кнопки, поэтому статус показываем отдельно */}
            {isUploading && <div>uploading...</div>}
            {/* удалять нечего, пока обложки нет */}
            {hasCover && (
                <button onClick={deleteCoverHandler} disabled={isBusy}>
                    {isDeleting ? 'deleting...' : 'delete cover'}
                </button>
            )}
        </>
    );
};
