import { useState } from 'react'
import { useFetchPlaylistsQuery } from '@/entities/playlist'
import { CreatePlaylistForm } from '@/features/playlist-create'
import { UpdatePlaylistForm } from '@/features/playlist-update'
import { PlaylistCard } from '@/widgets/playlist-card'
import { Pagination } from '@/shared/ui'
import s from './PlaylistsPage.module.css'

// страница со списком плейлистов
// хранит только состояние списка: какая страница открыта и что редактируем
// мутации сюда не поднимаем, они живут в фичах рядом со своими кнопками
export const PlaylistsPage = () => {
    // state, хранит id плейлиста, который сейчас редактируем
    // это состояние всего списка, а не карточки: форма открыта только одна
    const [playlistId, setPlaylistId] = useState<string | null>(null)

    // state, хранит номер текущей страницы списка
    const [page, setPage] = useState<number>(1)

    // RTK Query хук, получает список плейлистов для рендеринга
    // каждая страница кешируется отдельно, поэтому возврат назад мгновенный
    // refetchOnFocus нужен из-за обложек: сервер дописывает их не мгновенно,
    // и данные, полученные сразу после загрузки, могут быть еще без картинки
    // работает только потому, что в store вызван setupListeners
    const { data, isLoading, isError } = useFetchPlaylistsQuery(
        { pageNumber: page },
        { refetchOnFocus: true }
    )

    // кнопки переключения страниц
    // meta приходит от сервера, пока данных нет — рисовать нечего
    // вынесены в переменную, чтобы разметку ниже не раздувать
    const pagination = data?.meta ? (
        <Pagination
            page={page}
            shownPage={data.meta.page}
            pagesCount={data.meta.pagesCount}
            onPageChange={setPage}
        />
    ) : null

    // isLoading считается отдельно для каждого набора аргументов:
    // на еще не открытой странице он снова true, на уже загруженной — нет
    if (isLoading) {
        return <div>Loading...</div>
    }

    // без этой ветки упавший запрос выглядел бы как "плейлистов нет"
    if (isError) {
        return <div>Failed to load playlists</div>
    }

    return (
        <div className={s.container}>
            <h1>Playlists page</h1>

            <CreatePlaylistForm />
            <div className={s.items}>
                {/* data опционально: до первого ответа его нет, и это нормально */}
                {data?.data.map((playlist) => {
                    // проверяем, редактируется ли текущий плейлист
                    const isEditing = playlistId === playlist.id
                    return (
                        // key берем от плейлиста, а не индекс:
                        // при удалении из середины индексы съезжают и React путает элементы
                        <div className={s.item} key={playlist.id}>
                            {/* редактируем этот плейлист — показываем форму, */}
                            {/* иначе обычную карточку */}
                            {isEditing ? (
                                <UpdatePlaylistForm
                                    // id берем из данных, а не из состояния: они здесь равны,
                                    // но так не приходится полагаться на сужение типа
                                    playlistId={playlist.id}
                                    // форме важно только закрыться, про null знает страница
                                    onClose={() => setPlaylistId(null)}
                                />
                            ) : (
                                <PlaylistCard
                                    playlist={playlist}
                                    onEdit={setPlaylistId}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
            {pagination}
        </div>
    )
}
