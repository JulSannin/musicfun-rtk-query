import { usePublishTrackMutation } from '@/entities/track';

type Props = {
    trackId: string;
};

// публикация черновика: до неё трек виден только автору
// кнопку показывает вызывающий код — у опубликованного трека её нет вовсе,
// потому что обратного действия («снять с публикации») в API не существует
export const PublishTrackButton = ({ trackId }: Props) => {
    const [publishTrack, { isLoading }] = usePublishTrackMutation();

    const clickHandler = () => {
        publishTrack({ trackId })
            .unwrap()
            // catch пустой намеренно: 403 (чужой трек) и 409 (уже опубликован)
            // уже показал handleErrors
            .catch(() => {});
    };

    return (
        <button type="button" onClick={clickHandler} disabled={isLoading}>
            {isLoading ? 'publishing...' : 'publish'}
        </button>
    );
};
