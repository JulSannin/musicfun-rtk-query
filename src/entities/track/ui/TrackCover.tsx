import type { Images } from '@/shared/api';
import s from './TrackCover.module.css';

type Props = {
    // весь трек компоненту не нужен, только его картинки
    images: Images;
    // в строке списка нужен маленький вариант, в развёрнутой карточке — крупный:
    // от размера зависит и то, какой файл просить у сервера
    size?: 'small' | 'large';
};

// обложка трека без действий над ней: её видят все, включая неавторизованных
// картинки-заглушки для треков в проекте нет (в отличие от плейлистов),
// поэтому пустое место рисуем сами — иначе строки списка разъезжаются по высоте
export const TrackCover = ({ images, size = 'small' }: Props) => {
    const covers = images.main;

    const preferred =
        size === 'small'
            ? (covers?.find((img) => img.type === 'thumbnail') ??
              covers?.find((img) => img.type === 'medium'))
            : covers?.find((img) => img.type === 'original');

    // любой доступный вариант лучше пустоты: набор размеров у разных треков
    // разный, и нужного может просто не оказаться
    const src = (preferred ?? covers?.at(0))?.url;

    const className = `${s.cover} ${size === 'large' ? s.large : s.small}`;

    return src ? (
        <img className={className} src={src} alt="" />
    ) : (
        <div className={`${className} ${s.placeholder}`}>♪</div>
    );
};
