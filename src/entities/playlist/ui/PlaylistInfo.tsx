import { Link } from 'react-router';
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
    // описание есть только в ответе одного плейлиста: в списке этого поля
    // не существует вовсе, поэтому проп необязательный
    description?: string | null;
    // куда ведёт название; готовый адрес, а не id — собирать пути
    // это дело того, кто знает про роутер. Без него название просто текст,
    // как на самой странице плейлиста
    to?: string;
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
    description,
    to,
}: Props) => {
    return (
        <>
            <div>title: {to ? <Link to={to}>{title}</Link> : title}</div>
            <div>name: {authorName}</div>
            <div>
                {tracksCount} tracks · {formatDuration(duration)}
            </div>

            {/* описание необязательное, и сервер отличает пустую строку от null */}
            {description && <div>{description}</div>}

            {/* у плейлиста может не быть ни одного тега, тогда строку не рисуем */}
            {tagNames.length > 0 && <div>tags: {tagNames.join(', ')}</div>}
        </>
    );
};
