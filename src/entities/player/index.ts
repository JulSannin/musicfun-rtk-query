export {
    PLAYER_SLICE,
    playerReducer,
    playerActions,
    selectCurrentTrack,
    selectCurrentTrackId,
    selectIsPlaying,
    selectHasNext,
    selectHasPrev,
} from './model/playerSlice';
export type { PlayerTrack } from './model/playerSlice';
