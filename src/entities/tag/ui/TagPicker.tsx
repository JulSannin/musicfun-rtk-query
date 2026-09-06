import { useState } from 'react';
import type { TagRef } from '@/shared/api';
import { useDebounce } from '@/shared/lib';
import { useSearchTagsQuery } from '../api/tagsApi';

type Props = {
    // выбранные теги целиком, а не только id: имя нужно, чтобы нарисовать чип,
    // а сервер отдаёт теги вместе с плейлистом — доспрашивать нечего
    value: TagRef[];
    onChange: (tags: TagRef[]) => void;
    // сколько тегов разрешено: у плейлиста 5, у фильтра ограничения нет
    max?: number;
};

// поиск тегов по подстроке плюс уже выбранные рядом
// entities: про плейлисты не знает, наверх отдаёт только выбор
export const TagPicker = ({ value, onChange, max }: Props) => {
    const [search, setSearch] = useState('');

    // запрос уходит после паузы, как и поиск плейлистов
    const debouncedSearch = useDebounce(search);
    const query = debouncedSearch.trim();

    const { data: found = [], isFetching } = useSearchTagsQuery(
        { search: query },
        { skip: !query }
    );

    const isFull = max !== undefined && value.length >= max;

    // выбранные убираем из подсказок: клик по ним всё равно ничего не изменит
    const suggestions = found.filter(
        (tag) => !value.some((selected) => selected.id === tag.id)
    );

    const addHandler = (tag: TagRef) => {
        // лимит держим здесь, а не только на disabled у инпута: подсказки остаются
        // в разметке и кликабельны, а сервер на шестой тег ответит 400
        if (isFull) return;

        onChange([...value, tag]);
        // строку чистим, чтобы следующий тег искали с нуля
        setSearch('');
    };

    return (
        <div>
            {value.map((tag) => (
                <span key={tag.id}>
                    {tag.name}
                    {/* type="button" обязателен: внутри form кнопка по умолчанию сабмитит */}
                    <button
                        type="button"
                        onClick={() =>
                            onChange(value.filter((t) => t.id !== tag.id))
                        }
                    >
                        ×
                    </button>
                </span>
            ))}

            <input
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder={isFull ? `Maximum ${max} tags` : 'search tags'}
                disabled={isFull}
            />

            {/* «не найдено» только когда искали и дождались: иначе моргает на каждой букве */}
            {query && !isFetching && suggestions.length === 0 && (
                <span>Nothing found</span>
            )}

            {suggestions.map((tag) => (
                <button
                    type="button"
                    key={tag.id}
                    onClick={() => addHandler(tag)}
                >
                    {tag.name}
                </button>
            ))}
        </div>
    );
};
