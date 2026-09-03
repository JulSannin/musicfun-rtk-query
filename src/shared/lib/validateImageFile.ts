// типы, которые принимает сервер; отсюда же берется accept у инпута
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

const MAX_IMAGE_SIZE = 1024 * 1024

// проверяет картинку до отправки, возвращает текст ошибки или null
export const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Only JPEG, PNG or GIF images are allowed'
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return `The file is too large. Max size is ${Math.round(MAX_IMAGE_SIZE / 1024)} KB`
    }

    return null
}
