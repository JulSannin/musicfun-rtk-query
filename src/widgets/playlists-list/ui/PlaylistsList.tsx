import { useState } from 'react';
import type { PlaylistListItemResource } from '@/entities/playlist';
import { useGetMeQuery } from '@/entities/profile';
import { UpdatePlaylistForm } from '@/features/playlist-update';
import { LinearProgress } from '@/shared/ui';
import { PlaylistCard } from './PlaylistCard';
import s from './PlaylistsList.module.css';

type Props = {
    // весь плейлист приходит только сюда: это граница списка,
    // ниже в карточку уходят уже отдельные поля
    playlists: PlaylistListItemResource[] | undefined;
    isLoading: boolean;
    isError: boolean;
    // на профиле пагинации и поиска нет, гасить список не от чего,
    // поэтому необязательный
    isFetching?: boolean;
    // текст пустого списка задаёт страница: на /playlists пусто значит
    // "поиск ничего не нашёл", на профиле — "своих плейлистов ещё нет"
    emptyText?: string;
};

// список плейлистов вместе с режимом редактирования
// виджет, потому что склеивает карточку с формой из features,
// и одну и ту же разметку показывают две разные страницы
export const PlaylistsList = ({
    playlists,
    isLoading,
    isError,
    isFetching = false,
    emptyText = 'Nothing found',
}: Props) => {
    // какой плейлист сейчас редактируем; форма открыта только одна
    // это состояние списка, поэтому живёт здесь, а не в странице
    const [playlistId, setPlaylistId] = useState<string | null>(null);

    // не новый запрос: Header подписан на getMe всегда, тут читается тот же кеш
    // владельца считаем один раз на весь список, а не хуком в каждой карточке
    const { data: me } = useGetMeQuery();

    // тот же ответ решает и второй вопрос — может ли человек реагировать
    // от плейлиста это не зависит, поэтому считаем один раз, а не в цикле
    const canReact = Boolean(me);

    return (
        <>
            {isError && <div>Failed to load playlists</div>}
            {isLoading && <div>Loading...</div>}

            {/* без подсказки пустой список выглядит как сломанная страница */}
            {playlists?.length === 0 && <div>{emptyText}</div>}

            {/* isFetching не убирает список, а гасит его и рисует полосу поверх: */}
            {/* старые карточки остаются на экране, пока едет новая страница */}
            <div
                className={`${s.items} ${isFetching || isLoading ? s.fetching : ''}`}
            >
                {(isFetching || isLoading) && <LinearProgress />}
                {playlists?.map((playlist) => {
                    // у неавторизованного me это undefined, и сравнение честно даёт false
                    const isOwner = playlist.attributes.user.id === me?.userId;
                    const isEditing = playlistId === playlist.id;
                    return (
                        // key от плейлиста, а не индекс: при удалении из середины индексы съезжают
                        <div className={s.item} key={playlist.id}>
                            {/* isOwner в условии не лишний: если разлогиниться */}
                            {/* с открытой формой, она сама схлопнется в карточку */}
                            {isEditing && isOwner ? (
                                <UpdatePlaylistForm
                                    playlistId={playlist.id}
                                    // форме важно только закрыться, про null знает список
                                    onClose={() => setPlaylistId(null)}
                                />
                            ) : (
                                <PlaylistCard
                                    playlist={playlist}
                                    isOwner={isOwner}
                                    canReact={canReact}
                                    onEdit={setPlaylistId}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
};
