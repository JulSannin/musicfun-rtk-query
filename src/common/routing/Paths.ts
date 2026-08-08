// адреса всех страниц приложения
// собраны в одном месте, чтобы не дублировать строки в роутере и в ссылках меню
const Paths = {
  Main: '/',
  Playlists: '/playlists',
  Tracks: '/tracks',
  Profile: '/profile',
  // "*" ловит любой адрес, которого нет в списке
  NotFound: '*',
}

export {Paths}
