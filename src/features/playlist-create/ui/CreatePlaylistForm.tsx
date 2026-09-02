import { useForm, type SubmitHandler } from 'react-hook-form'
import { useCreatePlaylistMutation } from '@/entities/playlist'
import { toast } from 'react-toastify'

// поля формы
// это НЕ тип запроса: input всегда отдает строку, null тут взяться неоткуда
// в тип запроса значения превращаются в onSubmit
type CreatePlaylistFormValues = {
    title: string
    description: string
}

// форма создания нового плейлиста
// пропсов у нее нет: снаружи о ней знать нечего, список обновится сам
// по инвалидации тега Playlists/LIST в мутации
export const CreatePlaylistForm = () => {
    // react-hook-form хук, создает форму создания плейлиста
    // errors нужен, чтобы показать пользователю, что именно он ввел не так
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreatePlaylistFormValues>()

    // RTK Query мутация для создания нового плейлиста
    const [createPlaylist] = useCreatePlaylistMutation()

    // обработчик отправки формы
    // отправляет новый плейлист на сервер
    // после успешного создания очищает форму
    // сюда попадаем только если валидация прошла: этим занимается handleSubmit
    const onSubmit: SubmitHandler<CreatePlaylistFormValues> = (values) => {
        createPlaylist({
            title: values.title,
            // пустое поле отправляем как null, а не как ""
            description: values.description.trim() || null,
        })
            .unwrap()
            // очищаем только после успеха: иначе при ошибке потеряем введенное
            .then(() => reset())
            // unwrap бросает на неуспешном ответе,
            // без catch будет необработанный промис
            .catch(() => toast.error('Failed to create the playlist'))
    }

    return (
        // handleSubmit сначала валидирует поля и только потом зовет onSubmit
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Create new playlist</h2>

            <div>
                {/* правила совпадают с ограничениями сервера */}
                {/* register возвращает пропсы инпута, поэтому его разворачиваем */}
                <input
                    {...register('title', {
                        required: 'Title is required',
                        maxLength: {
                            value: 100,
                            message: 'No more than 100 characters',
                        },
                    })}
                    placeholder="title"
                />
                {/* правило без вывода сообщения бесполезно: */}
                {/* форма не отправится, а почему — непонятно */}
                {errors.title && (
                    <span style={{ color: 'red' }}>{errors.title.message}</span>
                )}
            </div>

            <div>
                {/* description необязателен, поэтому required тут нет */}
                <input
                    {...register('description', {
                        maxLength: {
                            value: 1000,
                            message: 'No more than 1000 characters',
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

            {/* кнопка без type: внутри form по умолчанию это submit */}
            <button>create playlist</button>
        </form>
    )
}
