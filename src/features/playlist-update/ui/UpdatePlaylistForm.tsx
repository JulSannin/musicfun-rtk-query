import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { type TagRef } from '@/shared/api';
import { TagPicker } from '@/entities/tag';
import { PLAYLIST_TAGS_MAX } from '@/entities/playlist';
import {
    PlaylistFormFields,
    useFetchPlaylistQuery,
    useUpdatePlaylistMutation,
    type PlaylistFormValues,
} from '@/entities/playlist';

type Props = {
    playlistId: string;
    // форме нужно только "закрой меня", про состояние списка она не знает
    onClose: () => void;
};

// форма редактирования плейлиста, сама грузит его по id
export const UpdatePlaylistForm = ({ playlistId, onClose }: Props) => {
    // currentData, а не data: data хранит ответ по прошлому аргументу и показал бы чужой плейлист
    const { currentData: playlistResponse, isLoading } = useFetchPlaylistQuery(
        { playlistId },
        // фон выключен точечно, хотя в baseApi включен: перезапрос затер бы набранное
        { refetchOnFocus: false, refetchOnReconnect: false }
    );
    // теги держим отдельно от react-hook-form: register работает со строкой
    // из инпута, а тут массив объектов
    // null означает «пользователь их не трогал» — тогда показываем то, что пришло
    // с сервера. Так теги не нужно догонять эффектом, как поля формы:
    // значение выводится на рендере и правило set-state-in-effect не нарушается
    const [editedTags, setEditedTags] = useState<TagRef[] | null>(null);
    const tags = editedTags ?? playlistResponse?.data.attributes.tags ?? [];

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PlaylistFormValues>();

    const [updatePlaylist] = useUpdatePlaylistMutation();

    // значения нельзя задать заранее: на первом рендере их еще нет, поэтому reset по ответу
    useEffect(() => {
        if (!playlistResponse) return;

        const { title, description } = playlistResponse.data.attributes;

        // в ответе description может быть null, а форма ждет строку
        reset({ title, description: description ?? '' });
    }, [playlistResponse, reset]);

    const onSubmit: SubmitHandler<PlaylistFormValues> = (values) => {
        // без данных плейлиста нечего слать: tagIds берутся именно оттуда
        if (!playlistResponse) return;

        updatePlaylist({
            playlistId,
            attributes: {
                // trim, потому что сервер считает " " непустым названием
                title: values.title.trim(),
                description: values.description.trim() || null,
                // поле обязательное, и пустой массив означает «удалить все»
                tagIds: tags.map((tag) => tag.id),
            },
        })
            .unwrap()
            .then(onClose)
            // при ошибке форму не закрываем: человек должен поправить введенное
            .catch(() => {});
    };

    // isLoading, а не isFetching: на фоновом перезапросе форма не должна исчезать с набранным
    return isLoading || !playlistResponse ? (
        <div>Loading...</div>
    ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Update playlist</h2>

            {/* поля и правила общие с формой создания, лежат в entities */}
            <PlaylistFormFields register={register} errors={errors} />
            <TagPicker
                value={tags}
                onChange={setEditedTags}
                max={PLAYLIST_TAGS_MAX}
            />

            <button>update playlist</button>
            {/* type="button" обязателен, иначе кнопка отправит форму вместо отмены */}
            <button type="button" onClick={onClose}>
                cancel
            </button>
        </form>
    );
};
