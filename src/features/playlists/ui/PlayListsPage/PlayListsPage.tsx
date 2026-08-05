import {useFetchPlaylistsQuery} from "../../api/playlistsApi";
import s from "./PlayListsPage.module.css"

export const PlayListsPage = () => {
    const {data} = useFetchPlaylistsQuery({});

    return (
        <div className={s.container}>
            <h1>Playlists page</h1>
            <div className={s.items}>
                {data?.data.map((playlist) => {
                    return (
                        <div className={s.item} key={playlist.id}>
                            <div>title: {playlist.attributes.title}</div>
                            <div>name: {playlist.attributes.user.name}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
