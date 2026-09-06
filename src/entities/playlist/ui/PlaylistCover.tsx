import type { Images } from '@/shared/api';
import defaultCover from './default-playlist-cover.png';
import s from './PlaylistCover.module.css';

type Props = {
    // весь плейлист компоненту не нужен, только его картинки
    images: Images;
};

// картинка плейлиста без действий над ней: её видят все, включая неавторизованных
// playlistId сюда не передаём — рисовать картинку можно, ничего про неё не зная
export const PlaylistCover = ({ images }: Props) => {
    // сервер отдаёт несколько размеров одной картинки, берём оригинал
    const originalCover = images.main?.find((img) => img.type === 'original');

    // обложки может не быть, тогда показываем заглушку
    const src = originalCover ? originalCover.url : defaultCover;

    return <img src={src} alt="cover" width={'240px'} className={s.cover} />;
};
