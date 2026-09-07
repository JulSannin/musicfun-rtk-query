import { CurrentUserReaction } from './types';
import type { ReactionOutput } from './types';

// то, что реакция меняет в атрибутах сущности
// счётчики оба опциональны, потому что выдачи отличаются: в списке треков
// сервер не отдаёт dislikesCount, а в составе плейлиста не отдаёт ни одного
// из них — там есть только сама реакция, и она может прийти null
export type ReactionCounters = {
    currentUserReaction: CurrentUserReaction | null;
    likesCount?: number;
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

    // счётчик правим, только если сервер его вообще прислал: поле проверяем
    // отдельно от реакции — состояние кнопки живёт и без чисел
    if (prev === CurrentUserReaction.Like && target.likesCount !== undefined) {
        target.likesCount -= 1;
    }

    // поле проверяем отдельно от реакции: у трека в списке его нет
    if (
        prev === CurrentUserReaction.Dislike &&
        target.dislikesCount !== undefined
    ) {
        target.dislikesCount -= 1;
    }

    if (next === CurrentUserReaction.Like && target.likesCount !== undefined) {
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

    // как и в applyReaction: кладём только те счётчики, которые в этой
    // выдаче вообще существуют
    if (target.likesCount !== undefined) {
        target.likesCount = output.likes;
    }

    if (target.dislikesCount !== undefined) {
        target.dislikesCount = output.dislikes;
    }
};
