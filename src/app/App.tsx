import { Header } from '@/widgets/header';
import { MiniPlayer } from '@/widgets/player';
import { TrackDetails } from '@/widgets/track-details';
import { Routing } from './routing/Routing';
import { useGlobalLoading } from './model/useGlobalLoading';
import { useFollowPlayingTrack } from './model/useFollowPlayingTrack';
import { LinearProgress } from '@/shared/ui';
import { useTrackPanel } from '@/shared/lib';
import s from './App.module.css';
import { ToastContainer } from 'react-toastify';
// стили тостов не подключаются сами: без этого импорта
// разметка в DOM появится, но будет без позиционирования и фона
import 'react-toastify/dist/ReactToastify.css';

// корневой компонент приложения
// Header виден всегда, внутри layout меняются страницы по текущему роуту
function App() {
    const isGlobalLoading = useGlobalLoading();

    // какой трек раскрыт — параметр адреса, а не состояние страницы
    const { trackId, openTrack, closeTrack } = useTrackPanel();

    // пока панель открыта, она показывает то, что играет: prev/next,
    // автопереход и запуск трека из списка меняют её содержимое
    useFollowPlayingTrack();

    return (
        <>
            <Header />
            {isGlobalLoading && <LinearProgress />}
            <div className={s.layout}>
                <Routing />
            </div>
            {/* плеер стоит вне layout и рядом с Routing, а не внутри страницы: */}
            {/* при переходе по ссылке страница размонтируется, и звук оборвался бы */}
            {/* подробности он не открывает сам, а отдаёт наверх id трека */}
            <MiniPlayer onOpenTrack={openTrack} />
            {/* панель на том же уровне, что и плеер: она про трек, а не про
                страницу, и раскрывается поверх любой из них — иначе клик
                по названию в плеере уводил бы со страницы на /tracks */}
            {trackId && <TrackDetails trackId={trackId} onClose={closeTrack} />}
            {/* контейнер тостов один на все приложение и стоит вне layout: */}
            {/* toast() зовется из любого компонента, а рисуется всегда здесь */}
            {/* тема задается один раз тут, а не в каждом вызове toast */}
            <ToastContainer theme="colored" />
        </>
    );
}

export { App };
