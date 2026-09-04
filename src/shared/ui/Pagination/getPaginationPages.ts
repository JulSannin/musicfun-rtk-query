const SIBLING_COUNT = 1;

// два маркера вместо одного: они уходят в key и должны быть уникальны
export type PageItem = number | 'gap-left' | 'gap-right';

// номера для пагинации: первая, последняя, окно вокруг текущей и многоточия между ними
export const getPaginationPages = (
    page: number,
    pagesCount: number
): PageItem[] => {
    if (pagesCount <= 1) return [];

    const pages: PageItem[] = [];

    const leftSibling = Math.max(2, page - SIBLING_COUNT);
    const rightSibling = Math.min(pagesCount - 1, page + SIBLING_COUNT);

    pages.push(1);
    if (leftSibling > 2) pages.push('gap-left');
    for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);
    if (rightSibling < pagesCount - 1) pages.push('gap-right');
    pages.push(pagesCount);

    return pages;
};
