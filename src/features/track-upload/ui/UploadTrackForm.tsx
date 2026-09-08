import { useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import {
    TrackTitleField,
    useUploadTrackMutation,
    type TrackTitleFormValues,
} from '@/entities/track';
import {
    ALLOWED_AUDIO_EXTENSIONS,
    errorToast,
    TRACK_MP3_RULES,
    validateAudio,
} from '@/shared/lib';

type Props = {
    // «я закончила» — форму показывают по кнопке и схлопывают после успеха
    onUploaded?: () => void;
};

// форма создания трека из mp3
// поля формы — только название: файл держит сам input, см. ниже
// список обновится сам: uploadTrack сбрасывает тег Track/LIST
export const UploadTrackForm = ({ onUploaded }: Props) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TrackTitleFormValues>();

    // файл читаем из инпута на отправке, а не храним в useState по onChange:
    // иначе после неудачной проверки выбор того же файла заново не вызвал бы
    // onChange (значение инпута не изменилось), и кнопка выглядела бы сломанной
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadTrack, { isLoading }] = useUploadTrackMutation();

    const onSubmit: SubmitHandler<TrackTitleFormValues> = (values) => {
        const file = fileInputRef.current?.files?.[0];

        // клиентские проверки handleErrors не видит, тост показываем руками
        if (!file) {
            errorToast('Choose an MP3 file');
            return;
        }

        const error = validateAudio(file, TRACK_MP3_RULES);

        if (error) {
            errorToast(error);
            return;
        }

        uploadTrack({ title: values.title.trim(), file })
            .unwrap()
            .then(() => {
                // очищаем только после успеха, иначе при ошибке потеряем
                // и название, и выбранный файл
                reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
                onUploaded?.();
            })
            // без catch у unwrap будет необработанный промис
            .catch(() => {});
    };

    return (
        // handleSubmit зовём внутри обработчика, а не на рендере: onSubmit
        // читает ref файлового инпута, и правило react-hooks/refs считает
        // вызов прямо в атрибуте попыткой прочитать ref во время отрисовки
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <h2>Upload track</h2>

            {/* то же поле с теми же правилами, что и в форме правки:
                оно живёт в entities, фичи делить его между собой не могут */}
            <TrackTitleField register={register} errors={errors} />

            {/* accept только подсказывает браузеру фильтр, расширение он
                не гарантирует — проверяем сами перед отправкой */}
            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_AUDIO_EXTENSIONS.join(',')}
                disabled={isLoading}
            />

            {/* кнопка без type: внутри form по умолчанию это submit */}
            <button disabled={isLoading}>
                {isLoading ? 'uploading...' : 'upload track'}
            </button>

            {/* трек создаётся черновиком: его ещё нужно опубликовать,
                кнопка появится в списке ниже */}
            <p>New tracks are created as drafts</p>
        </form>
    );
};
