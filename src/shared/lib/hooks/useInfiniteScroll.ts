import { useCallback, useEffect, useRef } from 'react';

type Props = {
    hasNextPage: boolean;
    isFetching: boolean;
    // не void: RTK Query отдает fetchNextPage, возвращающий промис, и на void
    // ругается no-misused-promises; результат нам все равно не нужен
    fetchNextPage: () => unknown;
    rootMargin?: string;
    threshold?: number;
};

// следит за элементом-маячком в конце списка и просит следующую страницу,
// когда маячок появляется во вьюпорте
export const useInfiniteScroll = ({
    hasNextPage,
    isFetching,
    fetchNextPage,
    rootMargin = '100px',
    threshold = 0.1,
}: Props) => {
    // сюда страница повесит ref на элемент-маячок
    const observerRef = useRef<HTMLDivElement>(null);

    // обе проверки обязательны: наблюдатель срабатывает и во время загрузки,
    // без них уехало бы несколько запросов за одной и той же страницей
    const loadMoreHandler = useCallback(() => {
        if (hasNextPage && !isFetching) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetching, fetchNextPage]);

    useEffect(() => {
        const target = observerRef.current;

        // маячка нет, когда страницы кончились: наблюдать не за чем
        if (!target) return;

        // IntersectionObserver сообщает, попал ли элемент во вьюпорт
        // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMoreHandler();
                }
            },
            {
                // null значит "относительно окна браузера"
                root: null,
                // начинаем грузить за 100px до того, как маячок покажется
                rootMargin,
                // срабатываем, когда видно 10% маячка
                threshold,
            }
        );

        observer.observe(target);

        // эффект перезапускается на каждую смену isFetching, наблюдатель
        // пересоздается часто; disconnect надежнее unobserve — снимает все цели разом
        return () => observer.disconnect();
    }, [loadMoreHandler, rootMargin, threshold]);

    return { observerRef };
};
