import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentTrackId } from '@/entities/player';
import { useTrackPanel } from '@/shared/lib';

// открытая панель идёт следом за плеером: prev, next, автопереход в конце
// трека и запуск любого трека из списка меняют то, что в ней показано
//
// живёт в app, потому что связывает две вещи, которые друг о друге не знают:
// очередь плеера (entities/player) и параметр адреса (shared)
export const useFollowPlayingTrack = () => {
    const { trackId, followTrack } = useTrackPanel();
    const playingTrackId = useSelector(selectCurrentTrackId);

    // важно ловить именно СМЕНУ трека в плеере, а не расхождение с панелью:
    // иначе панель, открытую по клику на другой трек, тут же перекинуло бы
    // обратно на играющий, и посмотреть чужой трек стало бы невозможно
    const playedRef = useRef(playingTrackId);

    useEffect(() => {
        const changed = playedRef.current !== playingTrackId;
        // запоминаем ДО всех выходов, в том числе при закрытой панели:
        // иначе смена трека «в фоне» осталась бы незамеченной, и открытую
        // потом панель дёрнуло бы на давно проигранный трек
        playedRef.current = playingTrackId;

        if (!changed || !playingTrackId) return;

        // закрытую панель сменой трека не открываем: человек её закрыл,
        // и всплывать сама по себе она не должна
        if (!trackId) return;

        followTrack(playingTrackId);
    }, [playingTrackId, trackId, followTrack]);
};
