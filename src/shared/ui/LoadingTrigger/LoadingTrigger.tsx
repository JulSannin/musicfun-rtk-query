import type { RefObject } from 'react';

type Props = {
    observerRef: RefObject<HTMLDivElement | null>;
    isFetchingNextPage: boolean;
};

// маячок в конце списка, за ним следит useInfiniteScroll
export const LoadingTrigger = ({ observerRef, isFetchingNextPage }: Props) => {
    return (
        <div ref={observerRef}>
            {isFetchingNextPage ? (
                <div>Loading more tracks...</div>
            ) : (
                // распорка, а не пустой div: у элемента нулевой высоты
                // IntersectionObserver не сработает, и подгрузка не запустится
                <div style={{ height: '20px' }} />
            )}
        </div>
    );
};
