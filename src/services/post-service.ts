import axios from "axios";

import {
  apiDelete,
  apiGet,
  apiGetWithMeta,
  apiPatch,
  apiPost,
  apiPut,
  type ApiResponseMeta,
} from "./api-service";

export type PostOverview = {
  totalPosts: number;
  published: number;
  pendingReview: number;
  flagged: number;
  totalViews: number;
};

export type PostOverviewResponse = {
  data: PostOverview;
  meta: ApiResponseMeta;
};

export type PostListMeta = {
  page: number;
  limit: number;
  total: number;
};

export type PostListLocation = {
  city: string;
  state: string;
  country: string;
  address: string;
};

export type PostListItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  color: string;
  authorId: string;
  tags: string[];
  userTags: string[];
  mediaAssets: string[];
  isPublished: boolean;
  isFlagged?: boolean;
  isPromoted?: boolean;
  visibility: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  publishedAt: string;
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  listingId: string;
  location: PostListLocation | null;
  status?: string;
};

export type PostDetail = PostListItem & {
  likedBy: string[];
  viewedBy: string[];
  comments: string[];
  visibleToListIfPrivate: string[];
};

export type PostList = {
  items: PostListItem[];
  meta: PostListMeta;
};

export type PostListResponse = {
  data: PostList;
  meta: ApiResponseMeta;
};

export type GetPostsListParams = {
  page?: number;
  limit?: number;
};

type LooseObject = Record<string, unknown>;

type PostOverviewRaw = {
  totalPosts?: unknown;
  published?: unknown;
  pendingReview?: unknown;
  flagged?: unknown;
  totalViews?: unknown;
};

function toObject(value: unknown): LooseObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as LooseObject;
}

function toString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    if (normalizedValue === "true") {
      return true;
    }
    if (normalizedValue === "false") {
      return false;
    }
  }

  return false;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toString(item)).filter(Boolean);
}

function normalizePostOverview(details: unknown): PostOverview {
  const source = toObject(details) as PostOverviewRaw | null;

  return {
    totalPosts: toNumber(source?.totalPosts),
    published: toNumber(source?.published),
    pendingReview: toNumber(source?.pendingReview),
    flagged: toNumber(source?.flagged),
    totalViews: toNumber(source?.totalViews),
  };
}

type PostListMetaRaw = {
  page?: unknown;
  limit?: unknown;
  total?: unknown;
};

type PostListDetailsRaw = {
  items?: unknown;
  meta?: unknown;
};

type PostListItemRaw = {
  _id?: unknown;
  id?: unknown;
  type?: unknown;
  title?: unknown;
  content?: unknown;
  color?: unknown;
  authorId?: unknown;
  tags?: unknown;
  userTags?: unknown;
  mediaAssets?: unknown;
  isPublished?: unknown;
  isFlagged?: unknown;
  isPromoted?: unknown;
  visibility?: unknown;
  viewCount?: unknown;
  likeCount?: unknown;
  likedBy?: unknown;
  commentCount?: unknown;
  shareCount?: unknown;
  viewedBy?: unknown;
  comments?: unknown;
  publishedAt?: unknown;
  lastUpdatedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  status?: unknown;
  listingId?: unknown;
  location?: unknown;
  visibleToListIfPrivate?: unknown;
};

type PostListLocationRaw = {
  city?: unknown;
  state?: unknown;
  country?: unknown;
  address?: unknown;
};

function normalizePostListLocation(value: unknown): PostListLocation | null {
  const source = toObject(value) as PostListLocationRaw | null;
  if (!source) {
    return null;
  }

  const city = toString(source.city);
  const state = toString(source.state);
  const country = toString(source.country);
  const address = toString(source.address);

  if (!city && !state && !country && !address) {
    return null;
  }

  return {
    city,
    state,
    country,
    address,
  };
}

function normalizePostListItem(item: unknown): PostListItem | null {
  const source = toObject(item) as PostListItemRaw | null;
  if (!source) {
    return null;
  }

  const id = toString(source._id) || toString(source.id);
  if (!id) {
    return null;
  }

  const rawStatus = toString(source.status);
  const normalizedStatus = rawStatus.trim();
  const statusLower = normalizedStatus.toLowerCase();
  const hasIsPublishedField = Object.prototype.hasOwnProperty.call(
    source,
    "isPublished",
  );

  let isPublished = false;
  if (hasIsPublishedField) {
    isPublished = toBoolean(source.isPublished);
  } else if (statusLower === "published") {
    isPublished = true;
  } else if (statusLower === "draft") {
    isPublished = false;
  }

  const status =
    normalizedStatus ||
    (hasIsPublishedField ? (isPublished ? "published" : "draft") : "");

  const normalized: PostListItem = {
    id,
    type: toString(source.type) || "post",
    title: toString(source.title),
    content: toString(source.content),
    color: toString(source.color) || "#3b82f6",
    authorId: toString(source.authorId),
    tags: toStringArray(source.tags),
    userTags: toStringArray(source.userTags),
    mediaAssets: toStringArray(source.mediaAssets),
    isPublished,
    visibility: toString(source.visibility) || "PUBLIC",
    viewCount: toNumber(source.viewCount),
    likeCount: toNumber(source.likeCount),
    commentCount: toNumber(source.commentCount),
    shareCount: toNumber(source.shareCount),
    publishedAt: toString(source.publishedAt),
    lastUpdatedAt: toString(source.lastUpdatedAt),
    createdAt: toString(source.createdAt),
    updatedAt: toString(source.updatedAt),
    status: status || undefined,
    listingId: toString(source.listingId),
    location: normalizePostListLocation(source.location),
  };

  if (Object.prototype.hasOwnProperty.call(source, "isFlagged")) {
    normalized.isFlagged = toBoolean(source.isFlagged);
  }

  if (Object.prototype.hasOwnProperty.call(source, "isPromoted")) {
    normalized.isPromoted = toBoolean(source.isPromoted);
  }

  return normalized;
}

function normalizePostDetail(item: unknown): PostDetail | null {
  const base = normalizePostListItem(item);
  if (!base) {
    return null;
  }

  const source = toObject(item) as PostListItemRaw | null;
  if (!source) {
    return null;
  }

  return {
    ...base,
    likedBy: toStringArray(source.likedBy),
    viewedBy: toStringArray(source.viewedBy),
    comments: toStringArray(source.comments),
    visibleToListIfPrivate: toStringArray(source.visibleToListIfPrivate),
  };
}

type UpdatePostStatusPayload = { status: string } | { isPublished: boolean };

type PostStatusUpdateDetailsRaw = {
  post?: unknown;
};

function extractUpdatedPostCandidate(details: unknown) {
  const source = toObject(details) as PostStatusUpdateDetailsRaw | null;
  if (source && Object.prototype.hasOwnProperty.call(source, "post")) {
    return source.post;
  }

  return details;
}

function normalizePostList(
  details: unknown,
  fallback: { page: number; limit: number },
): PostList {
  const source = toObject(details) as PostListDetailsRaw | null;

  const rawItems = source?.items;
  const items = Array.isArray(rawItems)
    ? rawItems
        .map((item) => normalizePostListItem(item))
        .filter((item): item is PostListItem => Boolean(item))
    : [];

  const metaSource = toObject(source?.meta) as PostListMetaRaw | null;
  const normalizedPage = toNumber(metaSource?.page) || fallback.page;
  const normalizedLimit = toNumber(metaSource?.limit) || fallback.limit || items.length;

  return {
    items,
    meta: {
      page: normalizedPage,
      limit: normalizedLimit,
      total: toNumber(metaSource?.total),
    },
  };
}

export async function getPostOverview() {
  const { details, meta } = await apiGetWithMeta<unknown>(
    "/api/content/post/overview",
  );

  return {
    data: normalizePostOverview(details),
    meta,
  } satisfies PostOverviewResponse;
}

export async function getPostsList(params: GetPostsListParams = {}) {
  const page = typeof params.page === "number" ? params.page : 1;
  const limit = typeof params.limit === "number" ? params.limit : undefined;
  const normalizedLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? limit
      : undefined;

  const { details, meta } = await apiGetWithMeta<unknown>(
    "/api/content/posts/list",
    {
      params: {
        page,
        ...(normalizedLimit ? { limit: normalizedLimit } : {}),
      },
    },
  );

  return {
    data: normalizePostList(details, { page, limit: normalizedLimit ?? 0 }),
    meta,
  } satisfies PostListResponse;
}

export async function getPostById(postId: string) {
  const details = await apiGet<unknown>(
    `/api/content/post/${encodeURIComponent(postId)}`,
  );
  return normalizePostDetail(details);
}

export async function deletePost(postId: string) {
  const url = `/api/content/post/${encodeURIComponent(postId)}`;

  try {
    await apiDelete<unknown>(url);
    return;
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  await apiPost<unknown>(url);
}

export async function updatePostStatus(postId: string, status: string) {
  const normalizedStatus = status.trim() || status;
  const desiredPublished = normalizedStatus.toLowerCase() === "published";
  const statusPayload: UpdatePostStatusPayload = { status: normalizedStatus };
  const publishedPayload: UpdatePostStatusPayload = {
    isPublished: desiredPublished,
  };
  const url = `/api/content/post/${encodeURIComponent(postId)}/update-status`;

  const attemptWithPayload = async (payload: UpdatePostStatusPayload) => {
    try {
      return await apiPatch<unknown, UpdatePostStatusPayload>(url, payload);
    } catch (error) {
      const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
      if (statusCode !== 404 && statusCode !== 405) {
        throw error;
      }
    }

    try {
      return await apiPut<unknown, UpdatePostStatusPayload>(url, payload);
    } catch (fallbackError) {
      const fallbackStatusCode = axios.isAxiosError(fallbackError)
        ? fallbackError.response?.status
        : null;
      if (fallbackStatusCode !== 404 && fallbackStatusCode !== 405) {
        throw fallbackError;
      }

      return await apiPost<unknown, UpdatePostStatusPayload>(url, payload);
    }
  };

  try {
    const details = await attemptWithPayload(statusPayload);
    return normalizePostListItem(extractUpdatedPostCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 400 && statusCode !== 422) {
      throw error;
    }

    const details = await attemptWithPayload(publishedPayload);
    return normalizePostListItem(extractUpdatedPostCandidate(details));
  }
}

export async function flagPost(postId: string) {
  const url = `/api/content/post/${encodeURIComponent(postId)}/flag`;

  try {
    const details = await apiPatch<unknown, Record<string, never>>(url, {});
    return normalizePostListItem(extractUpdatedPostCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }

    try {
      const details = await apiPut<unknown, Record<string, never>>(url, {});
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    } catch (fallbackError) {
      const fallbackStatusCode = axios.isAxiosError(fallbackError)
        ? fallbackError.response?.status
        : null;
      if (fallbackStatusCode !== 404 && fallbackStatusCode !== 405) {
        throw fallbackError;
      }

      const details = await apiPost<unknown>(url);
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    }
  }
}

export async function unflagPost(postId: string) {
  const url = `/api/content/post/${encodeURIComponent(postId)}/unflag`;

  try {
    const details = await apiPatch<unknown, Record<string, never>>(url, {});
    return normalizePostListItem(extractUpdatedPostCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }

    try {
      const details = await apiPut<unknown, Record<string, never>>(url, {});
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    } catch (fallbackError) {
      const fallbackStatusCode = axios.isAxiosError(fallbackError)
        ? fallbackError.response?.status
        : null;
      if (fallbackStatusCode !== 404 && fallbackStatusCode !== 405) {
        throw fallbackError;
      }

      const details = await apiPost<unknown>(url);
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    }
  }
}

export async function promotePost(postId: string) {
  const url = `/api/content/post/${encodeURIComponent(postId)}/promote`;

  try {
    const details = await apiPatch<unknown, Record<string, never>>(url, {});
    return normalizePostListItem(extractUpdatedPostCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }

    try {
      const details = await apiPut<unknown, Record<string, never>>(url, {});
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    } catch (fallbackError) {
      const fallbackStatusCode = axios.isAxiosError(fallbackError)
        ? fallbackError.response?.status
        : null;
      if (fallbackStatusCode !== 404 && fallbackStatusCode !== 405) {
        throw fallbackError;
      }

      const details = await apiPost<unknown>(url);
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    }
  }
}

export async function unpromotePost(postId: string) {
  const url = `/api/content/post/${encodeURIComponent(postId)}/unpromote`;

  try {
    const details = await apiPatch<unknown, Record<string, never>>(url, {});
    return normalizePostListItem(extractUpdatedPostCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }

    try {
      const details = await apiPut<unknown, Record<string, never>>(url, {});
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    } catch (fallbackError) {
      const fallbackStatusCode = axios.isAxiosError(fallbackError)
        ? fallbackError.response?.status
        : null;
      if (fallbackStatusCode !== 404 && fallbackStatusCode !== 405) {
        throw fallbackError;
      }

      const details = await apiPost<unknown>(url);
      return normalizePostListItem(extractUpdatedPostCandidate(details));
    }
  }
}
