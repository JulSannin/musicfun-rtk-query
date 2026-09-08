import { useState } from 'react';
import type { ArtistRef } from '@/shared/api';
import { useDebounce } from '@/shared/lib';
import { useSearchArtistsQuery } from '../api/artistsApi';
import {
    ARTIST_NAME_MAX_LENGTH,
    ARTIST_NAME_MIN_LENGTH,
} from '../model/artistForm';

type Props = {
    // выбранные артисты целиком, а не только id: имя нужно, чтобы нарисовать
    // чип, а сервер отдаёт артистов вместе с треком — доспрашивать нечего
    value: ArtistRef[];
    onChange: (artists: ArtistRef[]) => void;
    // сколько артистов разрешено: у трека 5, у фильтра ограничения нет
    max?: number;
    // «заведи артиста с таким именем». Мутацию зовёт тот, кто передал колбэк:
    // энтити о мутациях не знает, а поставить рядом фичу нельзя — пикер
    // рендерится внутри формы, и фича не может импортировать фичу.
    // Без колбэка кнопка создания просто не рисуется: в фильтре треков
    // заводить артиста незачем
    onCreate?: (name: string) => void;
    // создание в процессе: гасим кнопку, чтобы не завести двух одинаковых
    isCreating?: boolean;
};

// поиск артистов по подстроке плюс уже выбранные рядом
// устроен как TagPicker, но с двумя отличиями: ручка требует токен
// (гостю показывать нечего) и умеет заводить нового артиста
export const ArtistPicker = ({
    value,
    onChange,
    max,
    onCreate,
    isCreating = false,
}: Props) => {
    const [search, setSearch] = useState('');

    // запрос уходит после паузы, как и в остальных поисках
    const debouncedSearch = useDebounce(search);
    const query = debouncedSearch.trim();

    const { data: found = [], isFetching } = useSearchArtistsQuery(
        { search: query },
        // с пустой строкой сервер ответит 400: search обязателен
        { skip: !query }
    );

    const isFull = max !== undefined && value.length >= max;

    // выбранных убираем из подсказок: клик по ним всё равно ничего не изменит
    const suggestions = found.filter(
        (artist) => !value.some((selected) => selected.id === artist.id)
    );

    // создавать предлагаем, только когда искали, дождались и точно ничего
    // не нашли: иначе кнопка мигает на каждой букве. Длину проверяем здесь,
    // а не после 400 от сервера
    const canCreate =
        Boolean(onCreate) &&
        !isFull &&
        !isFetching &&
        query.length >= ARTIST_NAME_MIN_LENGTH &&
        query.length <= ARTIST_NAME_MAX_LENGTH &&
        // точное совпадение уже есть — создавать дубль сервер и не даст (409)
        ![...found, ...value].some(
            (artist) => artist.name.toLowerCase() === query.toLowerCase()
        );

    const addHandler = (artist: ArtistRef) => {
        // лимит держим здесь, а не только на disabled у инпута: подсказки
        // остаются в разметке и кликабельны, а сервер на шестого ответит 400
        if (isFull) return;

        onChange([...value, artist]);
        // строку чистим, чтобы следующего артиста искали с нуля
        setSearch('');
    };

    return (
        <div>
            {value.map((artist) => (
                <span key={artist.id}>
                    {artist.name}
                    {/* type="button" обязателен: внутри form кнопка по умолчанию сабмитит */}
                    <button
                        type="button"
                        onClick={() =>
                            onChange(value.filter((a) => a.id !== artist.id))
                        }
                    >
                        ×
                    </button>
                </span>
            ))}

            <input
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder={
                    isFull ? `Maximum ${max} artists` : 'search artists'
                }
                disabled={isFull}
            />

            {/* «не найдено» только когда искали и дождались: иначе моргает на каждой букве */}
            {query && !isFetching && suggestions.length === 0 && (
                <span>Nothing found</span>
            )}

            {suggestions.map((artist) => (
                <button
                    type="button"
                    key={artist.id}
                    onClick={() => addHandler(artist)}
                >
                    {artist.name}
                </button>
            ))}

            {canCreate && (
                <button
                    type="button"
                    onClick={() => {
                        onCreate?.(query);
                        // поле чистим сразу: созданного артиста вызывающий код
                        // сам положит в value, искать его заново незачем
                        setSearch('');
                    }}
                    disabled={isCreating}
                >
                    {isCreating ? 'creating...' : `create "${query}"`}
                </button>
            )}
        </div>
    );
};
