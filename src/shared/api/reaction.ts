import { CurrentUserReaction } from './types';
import type { ReactionOutput } from './types';

// то, что реакция меняет в атрибутах сущности
// dislikesCount опционален: в списке треков сервер его вообще не отдаёт
export type ReactionCounters = {
    currentUserReaction: CurrentUserReaction;
    likesCount: number;
    dislikesCount?: number;
};

// применяет реакцию к счётчикам: снимает старую, ставит новую
// меняет объект на месте, потому что вызывается внутри updateQueryData
// и получает черновик immer, а не копию
export const applyReaction = (
    target: ReactionCounters,
    next: CurrentUserReaction
) => {
    const prev = target.currentUserReaction;

    // клик по активной кнопке приходит сюда как None, а не как та же реакция,
    // но выход оставляем: он делает функцию безопасной при повторном вызове
    if (prev === next) return;

    if (prev === CurrentUserReaction.Like) {
        target.likesCount -= 1;
    }

    // поле проверяем отдельно от реакции: у трека в списке его нет
    if (
        prev === CurrentUserReaction.Dislike &&
        target.dislikesCount !== undefined
    ) {
        target.dislikesCount -= 1;
    }

    if (next === CurrentUserReaction.Like) {
        target.likesCount += 1;
    }

    if (
        next === CurrentUserReaction.Dislike &&
        target.dislikesCount !== undefined
    ) {
        target.dislikesCount += 1;
    }

    target.currentUserReaction = next;
};

// кладёт в кеш точные счётчики из ответа сервера
// имена полей в ответе другие: likes/dislikes против likesCount/dislikesCount
export const syncReaction = (
    target: ReactionCounters,
    output: ReactionOutput
) => {
    target.currentUserReaction = output.value;
    target.likesCount = output.likes;

    if (target.dislikesCount !== undefined) {
        target.dislikesCount = output.dislikes;
    }
};
