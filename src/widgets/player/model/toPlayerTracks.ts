import type { PlayerTrack } from '@/entities/player';
import type { GetTrackListOutput } from '@/entities/track';

// превращает страницы ответа со списком треков в очередь плеера
// живёт в виджете плеера: entities/track не имеет права знать про
// entities/player, а склейка двух энтити всегда уезжает слоем выше.
// Отсюда же ей пользуется страница треков — свою копию она не держит
export const toPlayerTracks = (pages: GetTrackListOutput[]): PlayerTrack[] => {
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
