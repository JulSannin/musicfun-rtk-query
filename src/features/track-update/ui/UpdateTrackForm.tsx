import { useEffect, useRef, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { type TagRef } from '@/shared/api';
import { TagPicker } from '@/entities/tag';
import {
    TRACK_LYRICS_MAX_LENGTH,
    TRACK_TAGS_MAX,
    TRACK_TITLE_MAX_LENGTH,
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
                // артистов форма не меняет, но отправить их обязана: сервер
                // заменяет трек целиком, и отсутствие поля стёрло бы их.
                // Редактирование появится вместе с поиском артистов
                artistsIds: attributes.artists.map((artist) => artist.id),
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

            <input
                placeholder="title"
                {...register('title', {
                    required: 'Title is required',
                    maxLength: {
                        value: TRACK_TITLE_MAX_LENGTH,
                        message: `Title must be ${TRACK_TITLE_MAX_LENGTH} characters or less`,
                    },
                })}
            />
            {errors.title && <span>{errors.title.message}</span>}

            <textarea
                placeholder="lyrics"
                {...register('lyrics', {
                    maxLength: {
                        value: TRACK_LYRICS_MAX_LENGTH,
                        message: `Lyrics must be ${TRACK_LYRICS_MAX_LENGTH} characters or less`,
                    },
                })}
            />
            {errors.lyrics && <span>{errors.lyrics.message}</span>}

            <label>
                release date
                <input type="date" {...register('releaseDate')} />
            </label>

            <TagPicker
                value={tags}
                onChange={setEditedTags}
                max={TRACK_TAGS_MAX}
            />

            <button>update track</button>
            {/* type="button" обязателен, иначе кнопка отправит форму вместо отмены */}
            <button type="button" onClick={onClose}>
                cancel
            </button>
        </form>
    );
};
