import type {
    GetTrackListOutput,
    TrackListItemResource,
} from '../api/tracksApi.types';

// трек вместе с готовыми именами артистов
// именно в таком виде его принимает строка списка: сам TrackItem в included
// не полезет, ему отдают уже разобранные имена
export type TrackListItem = {
    track: TrackListItemResource;
    artistNames: string[];
};

// схлопывает страницы бесконечного списка в один массив и подставляет
// каждому треку имена его артистов
//
// живёт здесь, а не в хуке страницы, потому что мест с этим разбором уже
// три — общий список треков, свои треки и понравившиеся, — а связь
// «id артиста -> имя» одинаковая во всех: в самом треке лежат только id,
// имена приезжают в included каждой страницы
export const toTrackListItems = (
    pages: GetTrackListOutput[]
): TrackListItem[] => {
    // словарь общий по всем подгруженным страницам: артист может встретиться
    // на первой, а трек с ним — на третьей
    const artistNameById = new Map<string, string>(
        pages
            .flatMap((page) => page.included)
            .map((artist) => [artist.id, artist.attributes.name] as const)
    );

    return pages
        .flatMap((page) => page.data)
        .map((track) => ({
            track,
            // артист мог не приехать в included — filter убирает такие дырки,
            // чтобы в разметке не появилось undefined
            artistNames: track.relationships.artists.data
                .map(({ id }) => artistNameById.get(id))
                // предикат явный: get у Map возвращает string | undefined,
                // и без него отфильтрованный массив остался бы с undefined в типе
                .filter((name): name is string => Boolean(name)),
        }));
};
