type Props = {
    title: string
    // именно authorName, а не name: рядом с title просто "name" двусмысленно
    authorName: string
}

// текстовая часть карточки
// принимает готовые строки, а не весь плейлист:
// компоненту незачем знать, как устроен ответ API
// пока полей два, но именно сюда поедут теги, счетчики и длительность
export const PlaylistInfo = ({ title, authorName }: Props) => {
    return (
        <>
            <div>title: {title}</div>
            <div>name: {authorName}</div>
        </>
    )
}
