import { useSetTrackReactionMutation } from '@/entities/track';
import { CurrentUserReaction } from '@/shared/api';

type Props = {
    trackId: string;
    // счётчики приходят сверху: они уже есть в ответе списка,
    // отдельный запрос за ними не нужен. Оба необязательные, потому что
    // выдачи разные: в составе плейлиста сервер не отдаёт ни одного —
    // там кнопки показывают только состояние, без чисел
    likesCount?: number;
    // в списке треков сервер дизлайки не отдаёт, и тогда у кнопки не будет
    // числа — она показывает лишь состояние. На странице трека поле есть,
    // поэтому проп необязательный, как dislikesCount в ReactionCounters
    dislikesCount?: number;
    currentUserReaction: CurrentUserReaction;
    // гостю сервер отвечает 401, поэтому кнопки ему выключаем;
    // сам счётчик лайков видят все
    canReact: boolean;
};

// лайк и дизлайк трека
// устроено как PlaylistReactions, но без счётчика дизлайков — его нет в ответе
export const TrackReactions = ({
    trackId,
    likesCount,
    dislikesCount,
    currentUserReaction,
    canReact,
}: Props) => {
    const [setReaction, { isLoading }] = useSetTrackReactionMutation();

    const reactionHandler = (reaction: CurrentUserReaction) => {
        // повторный клик по активной кнопке снимает реакцию, а не ставит заново
        const next =
            currentUserReaction === reaction
                ? CurrentUserReaction.None
                : reaction;

        setReaction({ trackId, reaction: next })
            .unwrap()
            // catch пустой намеренно: тост показал handleErrors,
            // а откат кеша сделал onQueryStarted
            .catch(() => {});
    };

    return (
        <div>
            <button
                onClick={() => reactionHandler(CurrentUserReaction.Like)}
                disabled={!canReact || isLoading}
                aria-pressed={currentUserReaction === CurrentUserReaction.Like}
            >
                like {likesCount}
            </button>
            <button
                onClick={() => reactionHandler(CurrentUserReaction.Dislike)}
                disabled={!canReact || isLoading}
                aria-pressed={
                    currentUserReaction === CurrentUserReaction.Dislike
                }
            >
                dislike {dislikesCount}
            </button>
        </div>
    );
};
