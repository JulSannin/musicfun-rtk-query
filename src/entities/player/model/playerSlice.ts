import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// имя редьюсера в сторе; отсюда же собирается тип состояния для селекторов,
// поэтому опечатка в store.ts не пройдёт молча
export const PLAYER_SLICE = 'player';

// снимок трека для плеера: ровно то, что он рисует и проигрывает
// сущность целиком сюда не кладём — см. комментарий к playTrack
export type PlayerTrack = {
    id: string;
    title: string;
    artistNames: string[];
    // ссылка на mp3 из attachments; трека без файла в очереди не бывает
    url: string;
    // длительность секундами, как её отдаёт сервер: полное время видно
    // ещё до того, как браузер прочитает метаданные файла
    duration: number;
    coverUrl?: string;
};

type PlayerState = {
    queue: PlayerTrack[];
    // -1 значит «ничего не выбрано»: в этом случае плеер не рендерится вовсе
    currentIndex: number;
    isPlaying: boolean;
};

const initialState: PlayerState = {
    queue: [],
    currentIndex: -1,
    isPlaying: false,
};

const playerSlice = createSlice({
    name: PLAYER_SLICE,
    initialState,
    reducers: {
        // запускает список с конкретного трека
        // очередь приезжает снимками, а не ссылками на кеш RTK Query: кеш
        // перезапрашивается по фокусу и выбрасывается при смене фильтров,
        // а начатый трек обязан доиграть в любом случае
        playTrack(
            state,
            action: PayloadAction<{ queue: PlayerTrack[]; trackId: string }>
        ) {
            const index = action.payload.queue.findIndex(
                (track) => track.id === action.payload.trackId
            );

            // трека нет в очереди — молча ничего не делаем: кнопка не должна
            // уметь поставить плеер в состояние «играет неизвестно что»
            if (index === -1) return;

            state.queue = action.payload.queue;
            state.currentIndex = index;
            state.isPlaying = true;
        },

        // возобновление того же трека: src не меняется, и звук пойдёт
        // с той же секунды, на которой поставили паузу
        play(state) {
            if (state.currentIndex !== -1) state.isPlaying = true;
        },

        pause(state) {
            state.isPlaying = false;
        },

        // конец трека и кнопка «вперёд» — одно и то же действие
        // на последнем треке очередь останавливается, а не зацикливается
        next(state) {
            if (state.currentIndex + 1 < state.queue.length) {
                state.currentIndex += 1;
            } else {
                state.isPlaying = false;
            }
        },

        // «в начало списка» отдельного смысла не имеет: с первого трека
        // кнопка назад перематывает его сам, и это решает виджет
        prev(state) {
            if (state.currentIndex > 0) state.currentIndex -= 1;
        },
    },
});

export const playerReducer = playerSlice.reducer;
export const playerActions = playerSlice.actions;

// селекторы типизированы своим куском состояния, а не RootState:
// entities не имеет права импортировать app, а стор подходит структурно
type WithPlayer = Record<typeof PLAYER_SLICE, PlayerState>;

export const selectCurrentTrack = (state: WithPlayer): PlayerTrack | null =>
    state[PLAYER_SLICE].queue[state[PLAYER_SLICE].currentIndex] ?? null;

// отдельный селектор на id, а не производная от объекта трека: строка списка
// подписывается на примитив и не перерисовывается на каждое действие плеера
export const selectCurrentTrackId = (state: WithPlayer): string | null =>
    selectCurrentTrack(state)?.id ?? null;

export const selectIsPlaying = (state: WithPlayer): boolean =>
    state[PLAYER_SLICE].isPlaying;

export const selectHasNext = (state: WithPlayer): boolean =>
    state[PLAYER_SLICE].currentIndex + 1 < state[PLAYER_SLICE].queue.length;

export const selectHasPrev = (state: WithPlayer): boolean =>
    state[PLAYER_SLICE].currentIndex > 0;
