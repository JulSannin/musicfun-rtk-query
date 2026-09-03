import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import {
    PLAYLIST_DESCRIPTION_MAX_LENGTH,
    PLAYLIST_TITLE_MAX_LENGTH,
    type PlaylistFormValues,
} from '../model/playlistForm'

type Props = {
    // доступ к полям формы; само состояние остается у вызывающей формы
    register: UseFormRegister<PlaylistFormValues>
    errors: FieldErrors<PlaylistFormValues>
}

// поля плейлиста для обеих форм; лежат в entities, потому что фичи не могут импортировать друг друга
export const PlaylistFormFields = ({ register, errors }: Props) => {
    return (
        <>
            <div>
                {/* правила совпадают с ограничениями сервера */}
                <input
                    {...register('title', {
                        required: 'Title is required',
                        maxLength: {
                            value: PLAYLIST_TITLE_MAX_LENGTH,
                            message: `No more than ${PLAYLIST_TITLE_MAX_LENGTH} characters`,
                        },
                    })}
                    placeholder="title"
                />
                {errors.title && (
                    <span style={{ color: 'red' }}>{errors.title.message}</span>
                )}
            </div>

            <div>
                {/* description необязателен, поэтому required тут нет */}
                <input
                    {...register('description', {
                        maxLength: {
                            value: PLAYLIST_DESCRIPTION_MAX_LENGTH,
                            message: `No more than ${PLAYLIST_DESCRIPTION_MAX_LENGTH} characters`,
                        },
                    })}
                    placeholder="description"
                />
                {errors.description && (
                    <span style={{ color: 'red' }}>
                        {errors.description.message}
                    </span>
                )}
            </div>
        </>
    )
}
