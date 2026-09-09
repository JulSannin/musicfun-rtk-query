import { useEffect, useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { type ArtistRef, type TagRef } from '@/shared/api';
import {
    TagPicker,
    useCreateTagMutation,
    useDeleteTagMutation,
} from '@/entities/tag';
import { ArtistPicker, useCreateArtistMutation } from '@/entities/artist';
import {
    TRACK_ARTISTS_MAX,
    TRACK_TAGS_MAX,
    TrackFormFields,
    useFetchTrackQuery,
    useUpdateTrackMutation,
    type TrackFormValues,
} from '@/entities/track';

type Props = {
    trackId: string;
    // форме нужно только «закрой меня», про состояние списка она не знает
    onClose: () => void;
};

// форма редактирования трека, сама грузит его по id
// подробности берём отдельным запросом не от лени: в выдаче списка нет
// ни lyrics, ни releaseDate, ни тегов с артистами — они есть только здесь
export const UpdateTrackForm = ({ trackId, onClose }: Props) => {
    // currentData, а не data: аргумент меняется без размонтирования формы,
    // и data держала бы ответ по прошлому треку
    const { currentData: trackResponse, isLoading } = useFetchTrackQuery(
        { trackId },
        // фон выключен точечно, хотя в baseApi включён: перезапрос затёр бы набранное
        { refetchOnFocus: false, refetchOnReconnect: false }
    );

    const attributes = trackResponse?.data.attributes;

    // теги держим отдельно от react-hook-form: register работает со строкой
    // из инпута, а тут массив объектов.
    // null означает «пользователь их не трогал» — тогда показываем пришедшие
    // с сервера. Значение выводится на рендере, поэтому правило
    // set-state-in-effect не нарушается
    const [editedTags, setEditedTags] = useState<TagRef[] | null>(null);
    const tags = editedTags ?? attributes?.tags ?? [];

    // артисты живут по тем же правилам, что и теги: массив объектов мимо
    // react-hook-form, null означает «не трогали»
    const [editedArtists, setEditedArtists] = useState<ArtistRef[] | null>(
        null
    );
    const artists = editedArtists ?? attributes?.artists ?? [];

    // мутации зовёт фича, а не пикеры: энтити о мутациях не знают, а поставить
    // рядом отдельную фичу нельзя — фича не может импортировать фичу
    const [createTag, { isLoading: isCreatingTag }] = useCreateTagMutation();

    const createTagHandler = (name: string) => {
        createTag({ name })
            .unwrap()
            // конверт ответа развернул сам эндпоинт — кладём готовый TagRef
            .then((created) => setEditedTags([...tags, created]))
            .catch(() => {});
    };

    const [deleteTag, { isLoading: isDeletingTag }] = useDeleteTagMutation();

    // confirm нативный намеренно, как и у остальных разрушительных действий:
    // ответ нужен ДО запроса, а восстановления удалённого тега в API нет
    const deleteTagHandler = (tag: TagRef) => {
        if (!confirm(`Delete tag "${tag.name}" permanently?`)) return;

        deleteTag(tag.id)
            .unwrap()
            // из выбранных ничего убирать не нужно, хотя соблазн есть:
            // кнопка удаления стоит только у подсказок, а выбранные из них
            // вычёркиваются — значит удалённого тега в форме заведомо нет.
            // Сами подсказки обновит сброс Tags/LIST
            //
            // 403 значит «чужой тег» или «уже используется» — текст от сервера
            // показал handleErrors
            .catch(() => {});
    };

    const [createArtist, { isLoading: isCreatingArtist }] =
        useCreateArtistMutation();

    const createArtistHandler = (name: string) => {
        createArtist({ name })
            .unwrap()
            // ответ приходит голым ArtistRef, без конверта — кладём как есть
            .then((created) => setEditedArtists([...artists, created]))
            // 403 (лимит 100) и 409 (такое имя занято) уже показал handleErrors
            .catch(() => {});
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TrackFormValues>();

    const [updateTrack] = useUpdateTrackMutation();

    // какой трек уже заполнен в форму. Без этой отметки форма затирала бы
    // набранное: рядом стоят действия над обложкой, и их патч кеша меняет
    // ту же запись fetchTrack — attributes приезжает новым объектом,
    // эффект срабатывает снова и reset откатывает поля к серверным.
    // Тем же патчем бьёт и реакция на трек, если карточка открыта
    const filledForRef = useRef<string | null>(null);

    // значения нельзя задать заранее: на первом рендере их ещё нет, поэтому reset по ответу
    useEffect(() => {
        if (!attributes) return;
        // заполняем ровно один раз на трек, а не на каждое изменение кеша
        if (filledForRef.current === trackId) return;

        filledForRef.current = trackId;

        reset({
            title: attributes.title,
            // в ответе оба поля могут прийти null, а форма ждёт строку
            lyrics: attributes.lyrics ?? '',
            // input[type=date] понимает только yyyy-MM-dd, сервер отдаёт ISO
            releaseDate: attributes.releaseDate?.slice(0, 10) ?? '',
        });
    }, [attributes, trackId, reset]);

    const onSubmit: SubmitHandler<TrackFormValues> = (values) => {
        // до загрузки слать нечего: форма ещё не показывает настоящие значения
        if (!attributes) return;

        updateTrack({
            trackId,
            attributes: {
                // trim, потому что сервер считает " " непустым названием
                title: values.title.trim(),
                // пустая строка и «нет текста» для сервера разное
                lyrics: values.lyrics.trim() || null,
                // дата приходит как yyyy-MM-dd, сервер ждёт ISO 8601;
                // строка без времени разбирается как UTC, поэтому день не съезжает
                releaseDate: values.releaseDate
                    ? new Date(values.releaseDate).toISOString()
                    : null,
                tagIds: tags.map((tag) => tag.id),
                // поле обязательное, и пустой массив означает «снять всех»
                artistsIds: artists.map((artist) => artist.id),
            },
        })
            .unwrap()
            .then(onClose)
            // при ошибке форму не закрываем: человек должен поправить введённое
            .catch(() => {});
    };

    // isLoading, а не isFetching: на фоновом перезапросе форма не должна
    // исчезать вместе с набранным
    return isLoading || !attributes ? (
        <div>Loading...</div>
    ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
            <h3>Update track</h3>

            {/* поля и правила лежат в entities: ограничения принадлежат API,
                а не этой кнопке, и название общее с формой загрузки */}
            <TrackFormFields register={register} errors={errors} />

            <TagPicker
                value={tags}
                onChange={setEditedTags}
                max={TRACK_TAGS_MAX}
                onCreate={createTagHandler}
                isCreating={isCreatingTag}
                onDelete={deleteTagHandler}
                isDeleting={isDeletingTag}
            />

            {/* пикеры двух разных энтити встречаются здесь: entities/track
                не имеет права импортировать ни tag, ни artist — композиция
                уезжает наверх, к тому, кто видит оба слайса */}
            <ArtistPicker
                value={artists}
                onChange={setEditedArtists}
                max={TRACK_ARTISTS_MAX}
                onCreate={createArtistHandler}
                isCreating={isCreatingArtist}
            />

            <button>update track</button>
            {/* type="button" обязателен, иначе кнопка отправит форму вместо отмены */}
            <button type="button" onClick={onClose}>
                cancel
            </button>
        </form>
    );
};
