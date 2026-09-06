type Option<T extends string | number> = {
    value: T;
    label: string;
};

type Props<T extends string | number> = {
    label: string;
    value: T;
    options: Option<T>[];
    onChange: (value: T) => void;
};

// селект, который отдаёт наверх исходное значение, а не строку из DOM
// дженерик нужен именно за этим: без него union вроде 'addedAt' | 'likesCount'
// пришлось бы возвращать через as, и опечатка прошла бы молча
export const Select = <T extends string | number>({
    label,
    value,
    options,
    onChange,
}: Props<T>) => {
    return (
        <label>
            {label}
            <select
                value={value}
                onChange={(e) => {
                    // ищем опцию по строковому представлению: так число остаётся
                    // числом, а союз строк — своим типом
                    const next = options.find(
                        (option) =>
                            String(option.value) === e.currentTarget.value
                    );

                    if (next) onChange(next.value);
                }}
            >
                {options.map((option) => (
                    <option value={option.value} key={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
};
