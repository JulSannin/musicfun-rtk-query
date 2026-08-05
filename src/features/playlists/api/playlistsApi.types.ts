import type { CurrentUserReaction } from "@/common/enums/enums";
import type { Images, TagRef, User } from "@/common/types/types";

export type FetchPlaylistsArgs = {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    sortBy?: "addedAt" | "likesCount";
    sortDirection?: "asc" | "desc";
    tagsIds?: string[];
    userId?: string;
    trackId?: string;
    onlyLikedByMe?: boolean;
};

export type GetPlaylistsOutput = {
    data: PlaylistListItemResourse[];
    meta: JsonApiMetaWithPaging;
};

type PlaylistListItemResourse = {
    id: string;
    type: string;
    attributes: PlaylistListItemAttributes;
};

type JsonApiMetaWithPaging = {
    totalCount: number;
    page: number;
    pageSize: number;
    pagesCount: number;
};

type PlaylistListItemAttributes = {
    title: string;
    addedAt: string;
    updatedAt: string;
    order: number;
    user: User;
    images: Images;
    tags: TagRef;
    likesCount: number;
    dislikesCount: number;
    currentUserReaction: CurrentUserReaction;
    tracksCount: number;
    duration: number;
};