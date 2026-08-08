import {useForm, type SubmitHandler} from "react-hook-form";
import {useCreatePlaylistMutation} from "@/features/playlists/api/playlistsApi";

// поля формы
// это НЕ тип запроса: input всегда отдает строку, null тут взяться неоткуда
// в тип запроса значения превращаются в onSubmit
type CreatePlaylistFormValues = {
    title: string;
    description: string;
};

// форма создания нового плейлиста
export const CreatePlaylistForm = () => {
    // react-hook-form хук, создает форму создания плейлиста
    // errors нужен, чтобы показать пользователю, что именно он ввел не так
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<CreatePlaylistFormValues>();

    // RTK Query мутация для создания нового плейлиста
    const [createPlaylist] = useCreatePlaylistMutation();

    // обработчик отправки формы
    // отправляет новый плейлист на сервер
    // после успешного создания очищает форму
    const onSubmit: SubmitHandler<CreatePlaylistFormValues> = (values) => {
        createPlaylist({
            title: values.title,
            // пустое поле отправляем как null, а не как ""
            description: values.description.trim() || null,
        })
            .unwrap()
            .then(() => reset())
            // unwrap бросает на неуспешном ответе,
            // без catch будет необработанный промис
            .catch(() => alert("Не удалось создать плейлист"));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Create new playlist</h2>

            <div>
                {/* правила совпадают с ограничениями сервера */}
                <input
                    {...register("title", {
                        required: "Title обязателен",
                        maxLength: {
                            value: 100,
                            message: "Не больше 100 символов",
                        },
                    })}
                    placeholder="title"
                />
                {/* правило без вывода сообщения бесполезно: */}
                {/* форма не отправится, а почему — непонятно */}
                {errors.title && (
                    <span style={{color: "red"}}>
                        {errors.title.message}
                    </span>
                )}
            </div>

            <div>
                <input
                    {...register("description", {
                        maxLength: {
                            value: 1000,
                            message: "Не больше 1000 символов",
                        },
                    })}
                    placeholder="description"
                />
                {errors.description && (
                    <span style={{color: "red"}}>
                        {errors.description.message}
                    </span>
                )}
            </div>

            <button>create playlist</button>
        </form>
    );
};
