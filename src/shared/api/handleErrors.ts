// src/shared/api/handleErrors.ts
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { errorToast } from '@/shared/lib';

// error is Record<T, string> — типовой предикат: если true, TS считает объект
// содержащим строковое поле property, без as и без риска рантайм-ошибки
function isErrorWithProperty<T extends string>(
    error: unknown,
    property: T
): error is Record<T, string> {
    return (
        typeof error === 'object' &&
        error !== null &&
        property in error &&
        typeof (error as Record<string, unknown>)[property] === 'string'
    );
}

// 400/403 бэкенд отдаёт по JSON:API спеке: { errors: [{ detail: string }] }
function isErrorWithDetailArray(
    error: unknown
): error is { errors: { detail: string }[] } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'errors' in error &&
        Array.isArray(error.errors) &&
        typeof (error as { errors: { detail?: unknown }[] }).errors[0]
            ?.detail === 'string'
    );
}

// 400 может прилететь на "название длиннее 100 символов" — сообщение сервера
// в такой ошибке дублирует само значение поля, обрезаем, чтобы тост не разъезжался
function trimToMaxLength(str: string, maxLength = 100): string {
    return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
}

// единая точка показа ошибок сервера: разбирает статус и достаёт текст,
// который реально можно показать пользователю
export function handleErrors(error: FetchBaseQueryError) {
    switch (error.status) {
        case 'FETCH_ERROR':
        case 'PARSING_ERROR':
        case 'CUSTOM_ERROR':
        case 'TIMEOUT_ERROR':
            errorToast(error.error);
            break;

        // "название длиннее 100" / "чужой плейлист" / "лимит в 10 плейлистов"
        case 400:
        case 403:
            if (isErrorWithDetailArray(error.data)) {
                const message = error.data.errors[0].detail;
                // ошибка невалидного/просроченного refreshToken из baseQueryWithReauth —
                // это ожидаемая ситуация (например разлогин), пользователю тост не нужен
                if (message.includes('refreshToken')) break;
                errorToast(trimToMaxLength(message));
            } else {
                errorToast(JSON.stringify(error.data));
            }
            break;

        // несуществующий url/ресурс — { error: string }
        case 404:
            if (isErrorWithProperty(error.data, 'error')) {
                errorToast(error.data.error);
            } else {
                errorToast(JSON.stringify(error.data));
            }
            break;

        // невалидный API-KEY — { message: string }
        // 401 сюда не долетает: его перехватывает baseQueryWithReauth для refresh-флоу
        case 429:
            if (isErrorWithProperty(error.data, 'message')) {
                errorToast(error.data.message);
            } else {
                errorToast(JSON.stringify(error.data));
            }
            break;

        default:
            // 5xx нельзя показывать как есть: там может быть стектрейс,
            // имена таблиц, внутренние пути — потенциальная утечка данных
            if (
                typeof error.status === 'number' &&
                error.status >= 500 &&
                error.status < 600
            ) {
                errorToast('Server error occurred. Please try again later.');
            } else {
                errorToast('Some error occurred');
            }
    }
}
