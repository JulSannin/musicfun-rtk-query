// расширения, которые принимает сервер; отсюда же берётся accept у инпута
export const ALLOWED_AUDIO_EXTENSIONS = ['.mp3'];

type AudioRules = {
    maxSize: number;
};

// правила держим здесь, а не в фиче: они принадлежат API, а не кнопке
export const TRACK_MP3_RULES: AudioRules = {
    maxSize: 1024 * 1024,
};

// проверяет файл до отправки, возвращает текст ошибки или null
// синхронная, в отличие от validateImage: у аудио нет габаритов,
// ради которых пришлось бы декодировать файл
export const validateAudio = (file: File, rules: AudioRules): string | null => {
    // проверяем расширение, а не file.type: у mp3 браузеры отдают то
    // 'audio/mpeg', то 'audio/mp3', а на некоторых системах и пустую строку —
    // спека же говорит именно про расширение
    const isAllowed = ALLOWED_AUDIO_EXTENSIONS.some((extension) =>
        file.name.toLowerCase().endsWith(extension)
    );

    if (!isAllowed) return 'Only MP3 files are allowed';

    if (file.size > rules.maxSize) {
        return `The file is too large. Max size is ${Math.round(rules.maxSize / 1024)} KB`;
    }

    return null;
};
