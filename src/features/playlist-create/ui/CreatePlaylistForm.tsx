import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { TagRef } from '@/shared/api';
import { TagPicker, useCreateTagMutation } from '@/entities/tag';
import {
    PLAYLIST_TAGS_MAX,
    PlaylistFormFields,
    useCreatePlaylistMutation,
    useUpdatePlaylistMutation,
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

    // теги идут мимо react-hook-form: register работает со строкой из инпута,
    // а тут массив объектов. В отличие от формы правки, здесь это обычный
    // массив, а не TagRef[] | null: серверного значения, к которому можно
    // было бы откатиться, ещё не существует
    const [tags, setTags] = useState<TagRef[]>([]);

    const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();

    const createTagHandler = (name: string) => {
        createTag({ name })
            .unwrap()
            .then((created) => setTags((prev) => [...prev, created]))
            // 403 (лимит 100) и 409 (такое имя занято) уже показал handleErrors
            .catch(() => {});
    };

    const [createPlaylist, { isLoading: isCreating }] =
        useCreatePlaylistMutation();
    // вторая мутация нужна не от хорошей жизни: POST /playlists принимает
    // только title и description, тегов у него в теле нет вовсе — навесить
    // их можно лишь через PUT. Поэтому форма делает два запроса подряд
    const [updatePlaylist, { isLoading: isSavingTags }] =
        useUpdatePlaylistMutation();

    // кнопку гасим на всё время цепочки, а не только на первый запрос:
    // второй клик по ней завёл бы ВТОРОЙ плейлист, и удалять его пришлось бы
    // руками. Окно для такого клика тут вдвое шире обычного — запросов два
    const isSubmitting = isCreating || isSavingTags;

    // сюда попадаем только после успешной валидации, ее делает handleSubmit
    const onSubmit: SubmitHandler<PlaylistFormValues> = (values) => {
        const attributes = {
            // trim, потому что валидация отсекает только строку целиком
            // из пробелов, а « название » сервер сохранит как есть
            title: values.title.trim(),
            // пустое поле отправляем как null, а не как ""
            description: values.description.trim() || null,
        };

        createPlaylist(attributes)
            .unwrap()
            .then((created) => {
                // форму чистим сразу, как только плейлист создан, и не ждём
                // второго запроса: плейлист уже существует, и повторная
                // отправка завела бы второй такой же
                reset();
                setTags([]);

                // тегов не выбрали — второй запрос не нужен
                if (!tags.length) return;

                // если этот запрос упадёт, плейлист всё равно останется
                // созданным, просто без тегов: тост покажет handleErrors,
                // а теги человек навесит правкой. Отменять создание нечем —
                // транзакции на две ручки в API нет
                return updatePlaylist({
                    playlistId: created.data.id,
                    attributes: {
                        ...attributes,
                        tagIds: tags.map((tag) => tag.id),
                    },
                    // теги целиком просит сама мутация — они нужны её
                    // оптимистичному патчу. Здесь он, впрочем, почти всегда
                    // впустую: только что созданный плейлист в кеш списка
                    // ещё не приехал (POST успел лишь сбросить Playlists/LIST),
                    // и находить патчу нечего. Теги появятся в карточке
                    // перезапросом, который вызовет инвалидация от этого PUT
                    tags,
                }).unwrap();
            })
            // без catch у unwrap будет необработанный промис
            .catch(() => {});
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h2>Create new playlist</h2>

            {/* поля и правила общие с формой редактирования, лежат в entities */}
            <PlaylistFormFields register={register} errors={errors} />

            {/* пикер встречается с полями формы здесь, а не внутри
                PlaylistFormFields: entities/playlist не имеет права
                импортировать entities/tag */}
            <TagPicker
                value={tags}
                onChange={setTags}
                max={PLAYLIST_TAGS_MAX}
                onCreate={createTagHandler}
                isCreating={isCreatingTag}
            />

            {/* кнопка без type: внутри form по умолчанию это submit */}
            <button disabled={isSubmitting}>
                {isSubmitting ? 'creating...' : 'create playlist'}
            </button>
        </form>
    );
};
