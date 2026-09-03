type Props = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

// поле поиска по списку: получает строку и отдает строку, про запросы не знает
export const SearchInput = ({ value, onChange, placeholder }: Props) => {
    return (
        // type="search" дает нативный крестик очистки
        <input
            type="search"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.currentTarget.value)}
        />
    )
}
