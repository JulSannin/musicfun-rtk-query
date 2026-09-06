// типы, которые принимает сервер; отсюда же берется accept у инпута
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// ограничения сервера на конкретную картинку
type ImageRules = {
    maxSize: number;
    // проверяются, только если заданы: декодирование стоит дороже чтения размера
    minHeight?: number;
    square?: boolean;
};

// правила держим здесь, а не в фичах: они принадлежат API, а не кнопке
export const PLAYLIST_COVER_RULES: ImageRules = {
    maxSize: 1024 * 1024,
    minHeight: 500,
    square: true,
};

export const TRACK_COVER_RULES: ImageRules = {
    maxSize: 100 * 1024,
};

// проверяет картинку до отправки, возвращает текст ошибки или null
// async, потому что габариты известны только после декодирования файла
export const validateImage = async (
    file: File,
    rules: ImageRules
): Promise<string | null> => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Only JPEG, PNG or GIF images are allowed';
    }

    if (file.size > rules.maxSize) {
        return `The file is too large. Max size is ${Math.round(rules.maxSize / 1024)} KB`;
    }

    // габаритов не требуют — декодировать файл незачем
    if (!rules.minHeight && !rules.square) return null;

    let bitmap: ImageBitmap;

    try {
        bitmap = await createImageBitmap(file);
    } catch {
        // сюда попадаем на битом файле с правильным MIME
        return 'The image could not be read';
    }

    try {
        if (rules.square && bitmap.width !== bitmap.height) {
            return 'The image must be square';
        }

        if (rules.minHeight && bitmap.height < rules.minHeight) {
            return `The image must be at least ${rules.minHeight}px tall`;
        }

        return null;
    } finally {
        // освобождаем декодированный кадр: он живёт вне сборщика мусора JS
        bitmap.close();
    }
};
