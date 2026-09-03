import defaultCover from './default-playlist-cover.png'
import {
    useDeletePlaylistCoverMutation,
    useUploadPlaylistCoverMutation,
} from '@/entities/playlist'
import type { ChangeEvent } from 'react'
import type { Images } from '@/shared/api'
import { ALLOWED_IMAGE_TYPES, validateImageFile } from '@/shared/lib'
import { toast } from 'react-toastify'
import s from './PlaylistCover.module.css'

type Props = {
    playlistId: string
    // весь плейлист компоненту не нужен, только его картинки
    images: Images
}

// обложка плейлиста вместе с загрузкой и удалением
export const PlaylistCover = ({ playlistId, images }: Props) => {
    // сервер отдает несколько размеров одной картинки, берем оригинал
    const originalCover = images.main?.find((img) => img.type === 'original')

    // обложки может не быть, тогда показываем заглушку
    const src = originalCover ? originalCover.url : defaultCover

    // имена разводим: два isLoading в одной области видимости не уживутся
    const [uploadCover, { isLoading: isUploading }] =
        useUploadPlaylistCoverMutation()
    const [deleteCover, { isLoading: isDeleting }] =
        useDeletePlaylistCoverMutation()

    // пока идет любая операция с обложкой, вторую не начинаем
    const isBusy = isUploading || isDeleting

    const uploadCoverHandler = (event: ChangeEvent<HTMLInputElement>) => {
        // files пуст, если пользователь закрыл диалог без выбора
        const file = event.target.files?.length && event.target.files[0]

        if (!file) return

        // правила лежат в shared/lib: они одни на все картинки этого API
        const error = validateImageFile(file)

        if (error) {
            toast.error(error)
            return
        }

        uploadCover({ playlistId, file })
            .unwrap()
            .catch(() => toast.error('Failed to change the image'))
    }

    // confirm нативный намеренно: нужен ответ пользователя до запроса, тостом его не заменить
    const deleteCoverHandler = () => {
        if (confirm('Are you sure you want to delete the cover?')) {
            deleteCover({ playlistId })
                .unwrap()
                .catch(() => toast.error('Failed to delete the image'))
        }
    }

    return (
        <>
            <img src={src} alt="cover" width={'240px'} className={s.cover} />
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
            {originalCover && (
                <button onClick={deleteCoverHandler} disabled={isBusy}>
                    {isDeleting ? 'deleting...' : 'delete cover'}
                </button>
            )}
        </>
    )
}
