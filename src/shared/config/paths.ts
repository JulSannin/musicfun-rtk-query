// адреса всех страниц приложения
// собраны в одном месте, чтобы не дублировать строки в роутере и в ссылках меню
const paths = {
    Main: '/',
    Playlists: '/playlists',
    // ":playlistId" подставляет роутер; ссылки собираются playlistPath ниже,
    // чтобы шаблон пути жил в одном месте с роутером
    Playlist: '/playlists/:playlistId',
    Tracks: '/tracks',
    // понравившееся: своей секции у него нет на профиле,
    // потому что «моё» и «понравившееся» это разные вещи
    Library: '/library',
    Profile: '/profile',
    OAuthCallback: '/oauth/callback',
    // "*" ловит любой адрес, которого нет в списке
    NotFound: '*',
};

// отдельного адреса у трека нет: подробности раскрываются панелью поверх
// любой страницы, а какой именно трек открыт — этим параметром. Читает его
// useTrackPanel, но имя лежит здесь, вместе с остальным словарём адресов
const TRACK_PARAM = 'track';

// адрес конкретного плейлиста; строку в компонентах руками не собираем
const playlistPath = (playlistId: string) =>
    paths.Playlist.replace(':playlistId', playlistId);

export { paths, TRACK_PARAM, playlistPath };
