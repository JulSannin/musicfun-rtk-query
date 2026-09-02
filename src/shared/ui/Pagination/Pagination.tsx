type Props = {
    // запрошенная страница: по ней блокируем кнопки на краях
    page: number
    // страница, данные которой реально на экране
    // расходится с page ровно на время запроса, пока новая еще не пришла
    // необязательный: если источник такой разницы не знает, показываем page
    shownPage?: number
    pagesCount: number
    onPageChange: (page: number) => void
}

// переключение страниц списка
// ничего не запрашивает и не знает про формат ответа API:
// принимает голые числа и отдает наверх новую страницу
export const Pagination = ({
    page,
    shownPage,
    pagesCount,
    onPageChange,
}: Props) => {
    return (
        <>
            {/* на краях списка кнопки блокируем */}
            <button
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
            >
                prev
            </button>
            <span>
                {shownPage ?? page} of {pagesCount}
            </span>
            <button
                disabled={page === pagesCount}
                onClick={() => onPageChange(page + 1)}
            >
                next
            </button>
        </>
    )
}
