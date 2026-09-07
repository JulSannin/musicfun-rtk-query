import type { Images } from '@/shared/api';
import type { PlayerTrack } from './playerSlice';

// минимум, который нужен очереди. Под него структурно подходят обе выдачи:
// общий список треков (GetTrackListOutput) и состав плейлиста
// (GetTracksForPlaylistOutput), хотя атрибуты у них разные — в составе нет
// likesCount, user и isPublished, но играть трек это не мешает
type PlayerSourcePage = {
    data: {
        id: string;
        attributes: {
            title: string;
            duration: number;
            images: Images;
            attachments: { url: string }[];
        };
        relationships: { artists: { data: { id: string }[] } };
    }[];
    included: { id: string; attributes: { name: string } }[];
};

// превращает страницы ответа со списком треков в очередь плеера
// живёт в entities/player, а не рядом с треками: параметр описан
// структурно, поэтому импортировать entities/track (что запрещено)
// не приходится. Пользуются им и страница треков, и состав плейлиста,
// и подстановка очереди в плеер — копий этой логики быть не должно
export const toPlayerTracks = (pages: PlayerSourcePage[]): PlayerTrack[] => {
    // имена артистов лежат в included каждой страницы, в самом треке только их id
    const artistNameById = new Map<string, string>(
        pages
            .flatMap((page) => page.included)
            .map((artist) => [artist.id, artist.attributes.name] as const)
    );

    return pages
        .flatMap((page) => page.data)
        .flatMap((track) => {
            const audio = track.attributes.attachments.at(0);

            // трек без mp3 в очередь не берём: на нём автопереход встал бы намертво
            if (!audio) return [];

            const covers = track.attributes.images.main;

            return [
                {
                    id: track.id,
                    title: track.attributes.title,
                    artistNames: track.relationships.artists.data
                        .map(({ id }) => artistNameById.get(id))
                        // предикат явный: get у Map возвращает string | undefined,
                        // и без него в типе осталось бы undefined
                        .filter((name): name is string => Boolean(name)),
                    url: audio.url,
                    duration: track.attributes.duration,
                    // в плеере картинка размером с иконку: оригинал тут лишний
                    // вес, но если сервер отдал только его — берём что есть
                    coverUrl: (
                        covers?.find((img) => img.type === 'thumbnail') ??
                        covers?.at(0)
                    )?.url,
                },
            ];
        });
};
