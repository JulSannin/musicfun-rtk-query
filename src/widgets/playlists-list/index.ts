// наружу уходит только список: PlaylistCard — его внутренняя деталь
// вынести карточку в отдельный слайс widgets/playlist-card нельзя —
// steiger запрещает импорт между слайсами одного слоя (fsd/forbidden-imports),
// а список рендерит карточку
export { PlaylistsList } from './ui/PlaylistsList';
