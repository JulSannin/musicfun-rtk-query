import { useForm, type SubmitHandler } from 'react-hook-form';
import {
    PlaylistFormFields,
    useCreatePlaylistMutation,
    type PlaylistFormValues,
} from '@/entities/playlist';

// форма создания плейлиста; список обновится сам по инвалидации тега Playlists/LIST
export const CreatePlaylistForm = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PlaylistFormValues>();

    const [createPlaylist] = useCreatePlaylistMutation();

    // сюда попадаем только после успешной валидации, ее делает handleSubmit
    const onSubmit: SubmitHandler<PlaylistFormValues> = (values) => {
        createPlaylist({
            title: values.title,
            // пустое поле отправляем как null, а не как ""
            description: values.description.trim() || null,
        })
            .unwrap()
            // очищаем только после успеха, иначе при ошибке потеряем введенное
            .then(() => reset())
            // без catch у unwrap будет необработанный промис
            .catch(() => {});
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Create new playlist</h2>

            {/* поля и правила общие с формой редактирования, лежат в entities */}
            <PlaylistFormFields register={register} errors={errors} />

            {/* кнопка без type: внутри form по умолчанию это submit */}
            <button>create playlist</button>
        </form>
    );
};
