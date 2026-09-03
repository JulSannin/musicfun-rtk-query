import { useEffect, useState } from 'react'

// откладывает значение: отдает его не на каждое изменение, а после паузы
export const useDebounce = <T>(value: T, delay = 500): T => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedValue(value), delay)

        // отменяет таймер предыдущего символа, в этом и есть debounce
        return () => clearTimeout(timeoutId)
    }, [value, delay])

    return debouncedValue
}
