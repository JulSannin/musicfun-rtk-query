import { getPaginationPages } from './getPaginationPages';
import s from './Pagination.module.css';

const PAGE_SIZE_OPTIONS = [4, 8, 16, 32];

type Props = {
    page: number;
    pagesCount: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
};

// переключение страниц списка: принимает числа, отдает наверх новые
export const Pagination = ({
    page,
    pagesCount,
    onPageChange,
    pageSize,
    onPageSizeChange,
}: Props) => {
    const pages = getPaginationPages(page, pagesCount);

    return (
        <div className={s.container}>
            {/* номера прячем, когда листать нечего, но селектор оставляем: иначе из pageSize=32 не выбраться */}
            {pagesCount > 1 && (
                <div className={s.pagination}>
                    {pages.map((item) =>
                        typeof item === 'number' ? (
                            <button
                                key={item}
                                type="button"
                                className={
                                    item === page
                                        ? `${s.pageButton} ${s.pageButtonActive}`
                                        : s.pageButton
                                }
                                // помечаем, а не блокируем: disabled убрал бы текущую страницу из обхода по Tab
                                aria-current={
                                    item === page ? 'page' : undefined
                                }
                                onClick={() => onPageChange(item)}
                            >
                                {item}
                            </button>
                        ) : (
                            <span className={s.ellipsis} key={item}>
                                ...
                            </span>
                        )
                    )}
                </div>
            )}

            <label>
                Show
                <select
                    value={pageSize}
                    onChange={(e) =>
                        onPageSizeChange(Number(e.currentTarget.value))
                    }
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option value={size} key={size}>
                            {size}
                        </option>
                    ))}
                </select>
                per page
            </label>
        </div>
    );
};
