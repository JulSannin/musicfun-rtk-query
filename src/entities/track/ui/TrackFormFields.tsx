import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import {
    TRACK_LYRICS_MAX_LENGTH,
    TRACK_TITLE_MAX_LENGTH,
    type TrackFormValues,
    type TrackTitleFormValues,
} from '../model/trackForm';

type TitleProps = {
    // доступ к полям формы; само состояние остаётся у вызывающей формы
    register: UseFormRegister<TrackTitleFormValues>;
    errors: FieldErrors<TrackTitleFormValues>;
};

// название есть у обеих форм трека — и у загрузки, и у правки, — но
// остальные поля у них разные: загрузка принимает от сервера ровно title
// и file. Поэтому название вынесено отдельно от прочих полей
export const TrackTitleField = ({ register, errors }: TitleProps) => {
    return (
        <div>
            {/* правила совпадают с ограничениями сервера */}
            <input
                {...register('title', {
                    required: 'Title is required',
                    maxLength: {
                        value: TRACK_TITLE_MAX_LENGTH,
                        message: `No more than ${TRACK_TITLE_MAX_LENGTH} characters`,
                    },
                    // одного required мало: строка из пробелов непустая,
                    // и он её пропускает — в списке появился бы трек
                    // без видимого названия
                    validate: (value) =>
                        value.trim().length > 0 ||
                        'Title cannot be empty or spaces only',
                })}
                placeholder="title"
            />
            {errors.title && (
                <span style={{ color: 'red' }}>{errors.title.message}</span>
            )}
        </div>
    );
};

type Props = {
    register: UseFormRegister<TrackFormValues>;
    errors: FieldErrors<TrackFormValues>;
};

// все поля формы правки трека; лежат в entities, потому что ограничения
// принадлежат API, а не кнопке, и потому что фичи не могут импортировать
// друг друга — общий с загрузкой TrackTitleField живёт здесь же
export const TrackFormFields = ({ register, errors }: Props) => {
    return (
        <>
            <TrackTitleField register={register} errors={errors} />

            <div>
                {/* текст песни необязателен, поэтому required тут нет */}
                <textarea
                    {...register('lyrics', {
                        maxLength: {
                            value: TRACK_LYRICS_MAX_LENGTH,
                            message: `No more than ${TRACK_LYRICS_MAX_LENGTH} characters`,
                        },
                    })}
                    placeholder="lyrics"
                />
                {errors.lyrics && (
                    <span style={{ color: 'red' }}>
                        {errors.lyrics.message}
                    </span>
                )}
            </div>

            <label>
                release date
                {/* input[type=date] работает с yyyy-MM-dd, а сервер ждёт ISO —
                    перекладывает это форма при отправке */}
                <input type="date" {...register('releaseDate')} />
            </label>
        </>
    );
};
