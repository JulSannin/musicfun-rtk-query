import { formatDuration } from '@/shared/lib';

type Props = {
    title: string;
    // именно authorName, а не name: рядом с title просто "name" двусмысленно
    authorName: string;
    tracksCount: number;
    // длительность всего плейлиста в секундах, как её отдаёт сервер
    duration: number;
    // только имена: id тегов компоненту не нужны, он по ним не кликает
    tagNames: string[];
};

// текстовая часть карточки
// принимает готовые строки и числа, а не весь плейлист:
// компоненту незачем знать, как устроен ответ API
export const PlaylistInfo = ({
    title,
    authorName,
    tracksCount,
    duration,
    tagNames,
}: Props) => {
    return (
        <>
            <div>title: {title}</div>
            <div>name: {authorName}</div>
            <div>
                {tracksCount} tracks · {formatDuration(duration)}
            </div>

            {/* у плейлиста может не быть ни одного тега, тогда строку не рисуем */}
            {tagNames.length > 0 && <div>tags: {tagNames.join(', ')}</div>}
        </>
    );
};
