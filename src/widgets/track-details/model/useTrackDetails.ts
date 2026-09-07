import { useFetchTrackQuery } from '@/entities/track';
import { useGetMeQuery } from '@/entities/profile';
import type { PlayerTrack } from '@/entities/player';

// владеет запросом подробностей одного трека
export const useTrackDetails = (trackId: string) => {
    // currentData, а не data: панель не размонтируется при клике по другому
    // треку — меняется только аргумент, а data в этот момент держит ответ
    // по прошлому id и показал бы чужой трек
    const { currentData, isError } = useFetchTrackQuery({ trackId });

    // тот же кеш, что у Header: нового запроса не будет
    const { data: me } = useGetMeQuery();

    const attributes = currentData?.data.attributes;

    // mp3 может быть ещё не загружен — тогда играть нечего
    const audio = attributes?.attachments.at(0);
    const covers = attributes?.images.main;

    // снимок на случай, когда трека нет в очереди страницы: панель
    // открывается и по прямой ссылке ?track=<id>, а такой трек может
    // не попасть в список — например, его отсекли фильтры
    const playerTrack: PlayerTrack | null =
        attributes && audio
            ? {
                  id: trackId,
                  title: attributes.title,
                  // артисты лежат прямо в атрибутах: на этой ручке
                  // included нет вообще
                  artistNames: attributes.artists.map(({ name }) => name),
                  url: audio.url,
                  duration: attributes.duration,
                  coverUrl: (
                      covers?.find((img) => img.type === 'thumbnail') ??
                      covers?.at(0)
                  )?.url,
              }
            : null;

    return {
        attributes,
        playerTrack,
        canPlay: Boolean(audio),
        // реагировать может только залогиненный: гостю сервер ответит 401
        canReact: Boolean(me),
        // «нечего показать, и это не ошибка» — значит грузим.
        // Ни isLoading, ни isFetching тут не годятся: до старта запроса
        // RTK Query отдаёт isFetching === undefined и isLoading === false,
        // и на первом же рендере панель мигнула бы ошибкой.
        // Опора на currentData заодно ловит переход с трека на трек,
        // а фоновый перезапрос по фокусу (он включён в baseApi) панель
        // не гасит: данные по текущему id уже есть
        isLoading: !currentData && !isError,
        isError,
    };
};
