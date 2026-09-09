import { useState } from 'react';
import type { TagRef } from '@/shared/api';
import { useDebounce } from '@/shared/lib';
import { useSearchTagsQuery } from '../api/tagsApi';
import { TAG_NAME_MAX_LENGTH, TAG_NAME_MIN_LENGTH } from '../model/tagForm';

type Props = {
    // выбранные теги целиком, а не только id: имя нужно, чтобы нарисовать чип,
    // а сервер отдаёт теги вместе с плейлистом — доспрашивать нечего
    value: TagRef[];
    onChange: (tags: TagRef[]) => void;
    // сколько тегов разрешено: у плейлиста 5, у фильтра ограничения нет
    max?: number;
    // «заведи тег с таким именем». Мутацию зовёт тот, кто передал колбэк:
    // энтити о мутациях не знает, а поставить рядом фичу нельзя — пикер
    // рендерится внутри формы, и фича не может импортировать фичу.
    // Без колбэка кнопка создания просто не рисуется: в фильтрах списков
    // заводить тег незачем
    onCreate?: (name: string) => void;
    // создание в процессе: гасим кнопку, чтобы не завести двух одинаковых
    isCreating?: boolean;
    // «удали этот тег насовсем». Мутацию, как и создание, зовёт тот, кто
    // передал колбэк. Без него кнопки удаления нет вовсе: в фильтрах списков
    // разрушительному действию не место
    onDelete?: (tag: TagRef) => void;
    // удаление в процессе: гасим кнопки, чтобы не отправить два запроса
    isDeleting?: boolean;
};

// поиск тегов по подстроке плюс уже выбранные рядом
// entities: про плейлисты не знает, наверх отдаёт только выбор
export const TagPicker = ({
    value,
    onChange,
    max,
    onCreate,
    isCreating = false,
    onDelete,
    isDeleting = false,
}: Props) => {
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

    // создавать предлагаем, только когда искали, дождались и точно ничего
    // не нашли: иначе кнопка мигает на каждой букве. Длину проверяем здесь,
    // а не после 400 от сервера
    const canCreate =
        Boolean(onCreate) &&
        !isFull &&
        !isFetching &&
        query.length >= TAG_NAME_MIN_LENGTH &&
        query.length <= TAG_NAME_MAX_LENGTH &&
        // точное совпадение уже есть — создавать дубль сервер и не даст (409)
        ![...found, ...value].some(
            (tag) => tag.name.toLowerCase() === query.toLowerCase()
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
                // обёртка, а не одна кнопка: вложить кнопку удаления внутрь
                // кнопки выбора нельзя — это невалидная разметка
                <span key={tag.id}>
                    <button type="button" onClick={() => addHandler(tag)}>
                        {tag.name}
                    </button>

                    {/* ярлык словом, а не крестиком: крестик рядом у выбранных
                        тегов означает «убрать из выбранных», и спутать эти два
                        действия — значит стереть чужой тег вместо своего.
                        Свои теги от чужих отличить нечем: в ответе поиска
                        об авторе ничего нет, поэтому кнопка есть у всех,
                        а на чужой сервер ответит 403 с объяснением */}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => onDelete(tag)}
                            disabled={isDeleting}
                            aria-label={`Delete tag ${tag.name} permanently`}
                        >
                            delete
                        </button>
                    )}
                </span>
            ))}

            {canCreate && (
                <button
                    type="button"
                    onClick={() => {
                        onCreate?.(query);
                        // поле чистим сразу: созданный тег вызывающий код
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
