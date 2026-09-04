import type { RefObject } from 'react';

type Props = {
    observerRef: RefObject<HTMLDivElement | null>;
    isFetchingNextPage: boolean;
};

// маячок в конце списка, за ним следит useInfiniteScroll
export const LoadingTrigger = ({ observerRef, isFetchingNextPage }: Props) => {
    return (
        <div ref={observerRef}>
            {/* пустой div высотой 20px нужен, чтобы маячку было что показать: */}
            {/* у элемента нулевой высоты IntersectionObserver не сработает */}
            {isFetchingNextPage ? (
                <div>Loading more tracks...</div>
            ) : (
                <div style={{ height: '20px' }} />
            )}
        </div>
    );
};
