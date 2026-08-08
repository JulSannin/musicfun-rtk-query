import {useEffect} from "react";
import {useForm, type SubmitHandler} from "react-hook-form";
import {
    useFetchPlaylistQuery,
    useUpdatePlaylistMutation,
} from "../../../api/playlistsApi";

type Props = {
    // id всегда есть: форма рендерится только для выбранного плейлиста
    selectedPlaylistId: string;
    // форма зовет его только с null, то есть "закрой меня"
    onPlaylistSelect: (id: string | null) => void;
};

// поля формы
// это НЕ тип запроса: input всегда отдает строку, null тут взяться неоткуда
// в тип запроса значения превращаются в onSubmit
type UpdatePlaylistFormValues = {
    title: string;
    description: string;
};

// форма редактирования выбранного плейлиста
// сама грузит нужный плейлист, снаружи ей нужен только id
export const UpdatePlaylistForm = ({
    selectedPlaylistId,
    onPlaylistSelect,
}: Props) => {
    // RTK Query хук, получает плейлист по id
    // в списке нет description, поэтому нужен отдельный запрос
    // берем currentData, а не data: data хранит последний успешный ответ
    // независимо от аргумента, и при переключении плейлистов отдал бы чужие данные
    const {currentData: playlistResponse, isFetching} = useFetchPlaylistQuery({
        playlistId: selectedPlaylistId,
    });

    // react-hook-form хук, создает форму редактирования
    // errors нужен, чтобы показать пользователю, что именно он ввел не так
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<UpdatePlaylistFormValues>();

    // RTK Query мутация для обновления плейлиста
    const [updatePlaylist] = useUpdatePlaylistMutation();

    // после получения плейлиста заполняем форму его данными
    useEffect(() => {
        if (!playlistResponse) return;

        const {title, description} = playlistResponse.data.attributes;

        // в ответе description может быть null, а форма ждет строку
        reset({title, description: description ?? ""});
    }, [playlistResponse, reset]);

    // обработчик отправки формы
    // отправляет изменения на сервер
    // после успешного обновления закрывает форму
    const onSubmit: SubmitHandler<UpdatePlaylistFormValues> = (values) => {
        if (!playlistResponse) return;

        updatePlaylist({
            playlistId: selectedPlaylistId,
            attributes: {
                title: values.title.trim(),
                // пустое поле отправляем как null, а не как ""
                description: values.description.trim() || null,
                // теги берем из ответа сервера, а не из формы:
                // инпута для них нет, а пустой tagIds очистил бы их
                tagIds: playlistResponse.data.attributes.tags.map(
                    (tag) => tag.id,
                ),
            },
        })
            .unwrap()
            .then(() => {
                onPlaylistSelect(null);
            })
            // форму намеренно не закрываем:
            // если ошибка в валидации, человек должен поправить введенное
            // unwrap бросает на неуспешном ответе, без catch будет необработанный промис
            .catch(() => {
                alert("Не удалось обновить плейлист");
            });
    };

    // форму не рисуем, пока не пришли данные плейлиста,
    // иначе в первом кадре поля окажутся пустыми
    return isFetching || !playlistResponse ? (
        <div>Loading...</div>
    ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Update playlist</h2>

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
                    <span style={{color: "red"}}>{errors.title.message}</span>
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
            <button>update playlist</button>
            {/* type="button" обязателен, */}
            {/* иначе кнопка отправит форму вместо отмены */}
            <button type="button" onClick={() => onPlaylistSelect(null)}>
                cancel
            </button>
        </form>
    );
};
