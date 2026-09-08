import type { ChangeEvent } from 'react';
import type { Images } from '@/shared/api';
import {
    useDeleteTrackCoverMutation,
    useUploadTrackCoverMutation,
} from '@/entities/track';
import {
    ALLOWED_IMAGE_TYPES,
    errorToast,
    TRACK_COVER_RULES,
    validateImage,
} from '@/shared/lib';

type Props = {
    trackId: string;
    // картинку не рисуем, но по ней понимаем, есть ли что удалять
    images: Images;
};

// загрузка и удаление обложки трека; показывается только владельцу
// саму картинку рисует TrackCover из entities, мутации остаются здесь
export const TrackCoverActions = ({ trackId, images }: Props) => {
    // у плейлиста в этом месте проверяют наличие варианта original, но
    // у трека набор размеров свой от трека к треку (потому TrackCover и берёт
    // любой доступный), поэтому спрашиваем только «есть ли хоть одна картинка»
    const hasCover = Boolean(images.main?.length);

    // имена разводим: два isLoading в одной области видимости не уживутся
    const [uploadCover, { isLoading: isUploading }] =
        useUploadTrackCoverMutation();
    const [deleteCover, { isLoading: isDeleting }] =
        useDeleteTrackCoverMutation();

    // пока идёт любая операция с обложкой, вторую не начинаем
    const isBusy = isUploading || isDeleting;

    const uploadCoverHandler = async (event: ChangeEvent<HTMLInputElement>) => {
        // files пуст, если пользователь закрыл диалог без выбора
        const file = event.target.files?.length && event.target.files[0];

        // значение инпута сбрасываем сразу: иначе повторный выбор того же файла
        // после ошибки не вызовет onChange и кнопка будет выглядеть сломанной
        event.target.value = '';

        if (!file) return;

        // правила лежат в shared/lib: они принадлежат API, а не этой кнопке.
        // У трека это только вес (100 КБ) — ни квадрата, ни минимальной высоты,
        // поэтому validateImage даже не станет декодировать файл
        const error = await validateImage(file, TRACK_COVER_RULES);

        if (error) {
            // клиентская проверка, до сервера дело не доходит — handleErrors тут ни при чем
            errorToast(error);
            return;
        }

        uploadCover({ trackId, file })
            .unwrap()
            .catch(() => {});
    };

    // confirm нативный намеренно: нужен ответ пользователя до запроса, тостом его не заменить
    const deleteCoverHandler = () => {
        if (confirm('Are you sure you want to delete the cover?')) {
            deleteCover({ trackId })
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
                <button
                    type="button"
                    onClick={deleteCoverHandler}
                    disabled={isBusy}
                >
                    {isDeleting ? 'deleting...' : 'delete cover'}
                </button>
            )}
        </>
    );
};
