import type {PlaylistListItemResource} from "@/features/playlists/api/playlistsApi.types";

type Props = {
    playlist: PlaylistListItemResource;
    // колбэки принимают id, сам компонент состоянием не владеет
    onUpdate: (id: string) => void;
    onDelete: (id: string) => void;
};

// карточка одного плейлиста в списке
// показывает данные и две кнопки, всю логику отдает наверх
export const PlaylistItem = ({playlist, onUpdate, onDelete}: Props) => {
    return (
        <>
            <div>title: {playlist.attributes.title}</div>
            <div>name: {playlist.attributes.user.name}</div>
            <button
                onClick={() => {
                    onUpdate(playlist.id);
                }}
            >
                update
            </button>
            <button onClick={() => onDelete(playlist.id)}>delete</button>
        </>
    );
};
