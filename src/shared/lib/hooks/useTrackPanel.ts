import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { TRACK_PARAM } from '@/shared/config';

// какой трек раскрыт в панели подробностей
// состояние живёт в адресе, а не в useState: ссылка остаётся рабочей,
// «назад» закрывает панель, а список под ней не размонтируется
//
// хук лежит в shared, потому что нужен сразу двум слоям: app рисует саму
// панель рядом с плеером, а страница треков открывает её из строки списка,
// и импортировать app страница не имеет права
export const useTrackPanel = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const trackId = searchParams.get(TRACK_PARAM);

    const setTrack = useCallback(
        (next: string | null, replace = false) => {
            // тот же адрес не трогаем: лишняя запись в истории заставила бы
            // жать «назад» несколько раз, чтобы закрыть панель
            if (next === trackId) return;

            setSearchParams(
                (prev) => {
                    // остальные параметры адреса сохраняем: панель тут не одна
                    const params = new URLSearchParams(prev);

                    if (next) {
                        params.set(TRACK_PARAM, next);
                    } else {
                        params.delete(TRACK_PARAM);
                    }

                    return params;
                },
                { replace }
            );
        },
        [trackId, setSearchParams]
    );

    return {
        trackId,
        // параметр ставится на текущий адрес, а не ведёт на /tracks:
        // панель раскрывается поверх той страницы, где человек сейчас
        openTrack: useCallback((id: string) => setTrack(id), [setTrack]),
        closeTrack: useCallback(() => setTrack(null), [setTrack]),
        // панель идёт следом за плеером: адрес подменяем, а не пушим —
        // иначе автопереход по очереди забил бы историю, и «назад» пришлось
        // бы жать по разу на каждый проигранный трек
        followTrack: useCallback(
            (id: string) => setTrack(id, true),
            [setTrack]
        ),
    };
};
