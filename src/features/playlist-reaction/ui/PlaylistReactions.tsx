import { useSetPlaylistReactionMutation } from '@/entities/playlist';
import { CurrentUserReaction } from '@/shared/api';

type Props = {
    playlistId: string;
    // счётчики приходят сверху: они уже есть в ответе списка,
    // отдельный запрос за ними не нужен
    likesCount: number;
    dislikesCount: number;
    currentUserReaction: CurrentUserReaction;
    // гостю сервер отвечает 401, поэтому кнопки ему выключаем;
    // сами счётчики видны всем
    canReact: boolean;
};

// лайк и дизлайк плейлиста
// счётчики рисуются всегда, действие доступно только авторизованному
export const PlaylistReactions = ({
    playlistId,
    likesCount,
    dislikesCount,
    currentUserReaction,
    canReact,
}: Props) => {
    const [setReaction, { isLoading }] = useSetPlaylistReactionMutation();

    const reactionHandler = (reaction: CurrentUserReaction) => {
        // повторный клик по активной кнопке снимает реакцию, а не ставит заново
        const next =
            currentUserReaction === reaction
                ? CurrentUserReaction.None
                : reaction;

        setReaction({ playlistId, reaction: next })
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
