import axios from "axios";

import {
  apiDelete,
  apiGetWithMeta,
  apiPatch,
  apiPost,
  apiPut,
  type ApiResponseMeta,
} from "./api-service";

export type BlogOverview = {
  totalBlogs: number;
  published: number;
  drafts: number;
};

export type BlogOverviewResponse = {
  data: BlogOverview;
  meta: ApiResponseMeta;
};

export type BlogListMeta = {
  page: number;
  limit: number;
  total: number;
};

export type BlogListItem = {
  id: string;
  username: string;
  imageCover: string;
  content: string;
  title: string;
  subtitle: string;
  createdAt: string;
  status?: string;
  publishedAt?: string;
  updatedAt?: string;
};

export type BlogList = {
  items: BlogListItem[];
  meta: BlogListMeta;
};

export type BlogListResponse = {
  data: BlogList;
  meta: ApiResponseMeta;
};

export type GetBlogsListParams = {
  page?: number;
  limit?: number;
};

export type CreateBlogPayload = {
  username: string;
  title: string;
  subtitle?: string;
  content: string;
  imageCover?: string;
  status?: string;
};

export type CreateBlogResult = {
  id: string;
  blog: BlogListItem;
};

type LooseObject = Record<string, unknown>;

type BlogOverviewRaw = {
  totalBlogs?: unknown;
  published?: unknown;
  drafts?: unknown;
};

type BlogListMetaRaw = {
  page?: unknown;
  limit?: unknown;
  total?: unknown;
};

type BlogListDetailsRaw = {
  items?: unknown;
  meta?: unknown;
};

type BlogListItemRaw = {
  _id?: unknown;
  id?: unknown;
  username?: unknown;
  imageCover?: unknown;
  content?: unknown;
  title?: unknown;
  subtitle?: unknown;
  createdAt?: unknown;
  status?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
};

type BlogCreateDetailsRaw = {
  id?: unknown;
  blog?: unknown;
};

type BlogUpdateDetailsRaw = {
  blog?: unknown;
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

function normalizeBlogOverview(details: unknown): BlogOverview {
  const source = toObject(details) as BlogOverviewRaw | null;

  return {
    totalBlogs: toNumber(source?.totalBlogs),
    published: toNumber(source?.published),
    drafts: toNumber(source?.drafts),
  };
}

function normalizeBlogListItem(item: unknown): BlogListItem | null {
  const source = toObject(item) as BlogListItemRaw | null;
  if (!source) {
    return null;
  }

  const id = toString(source._id) || toString(source.id);
  if (!id) {
    return null;
  }

  const looseSource = source as LooseObject;
  const title =
    toString(source.title) ||
    toString(looseSource.blogTitle) ||
    toString(looseSource.blog_title) ||
    toString(looseSource.name);
  const subtitle =
    toString(source.subtitle) ||
    toString(looseSource.subTitle) ||
    toString(looseSource.sub_title);

  return {
    id,
    username: toString(source.username),
    imageCover: toString(source.imageCover),
    content: toString(source.content),
    title,
    subtitle,
    createdAt: toString(source.createdAt),
    status: toString(source.status) || undefined,
    publishedAt: toString(source.publishedAt) || undefined,
    updatedAt: toString(source.updatedAt) || undefined,
  };
}

function normalizeBlogList(
  details: unknown,
  fallback: { page: number; limit: number },
): BlogList {
  const source = toObject(details) as BlogListDetailsRaw | null;

  const rawItems = source?.items;
  const items = Array.isArray(rawItems)
    ? rawItems
        .map((item) => normalizeBlogListItem(item))
        .filter((item): item is BlogListItem => Boolean(item))
    : [];

  const metaSource = toObject(source?.meta) as BlogListMetaRaw | null;
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

function extractUpdatedBlogCandidate(details: unknown) {
  const source = toObject(details) as BlogUpdateDetailsRaw | null;
  if (source && Object.prototype.hasOwnProperty.call(source, "blog")) {
    return source.blog;
  }

  return details;
}

export async function getBlogOverview() {
  const { details, meta } = await apiGetWithMeta<unknown>(
    "/api/content/blogs/overview",
  );

  return {
    data: normalizeBlogOverview(details),
    meta,
  } satisfies BlogOverviewResponse;
}

export async function getBlogsList(params: GetBlogsListParams = {}) {
  const page = typeof params.page === "number" ? params.page : 1;
  const limit = typeof params.limit === "number" ? params.limit : undefined;
  const normalizedLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? limit
      : undefined;

  const { details, meta } = await apiGetWithMeta<unknown>(
    "/api/content/blogs/list",
    {
      params: {
        page,
        ...(normalizedLimit ? { limit: normalizedLimit } : {}),
      },
    },
  );

  return {
    data: normalizeBlogList(details, { page, limit: normalizedLimit ?? 0 }),
    meta,
  } satisfies BlogListResponse;
}

function normalizeBlogCreate(details: unknown): CreateBlogResult {
  const source = toObject(details) as BlogCreateDetailsRaw | null;
  const blogCandidate =
    source && Object.prototype.hasOwnProperty.call(source, "blog")
      ? source.blog
      : details;
  const blog = normalizeBlogListItem(blogCandidate);
  const id = toString(source?.id) || blog?.id || "";

  if (!blog) {
    return {
      id,
      blog: {
        id,
        username: "",
        imageCover: "",
        content: "",
        title: "",
        subtitle: "",
        createdAt: "",
      },
    };
  }

  return {
    id: id || blog.id,
    blog,
  };
}

export async function createBlog(payload: CreateBlogPayload) {
  const url = "/api/content/blogs/create";

  try {
    const details = await apiPost<unknown, CreateBlogPayload>(url, payload);
    return normalizeBlogCreate(details);
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  try {
    const details = await apiPatch<unknown, CreateBlogPayload>(url, payload);
    return normalizeBlogCreate(details);
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  const details = await apiPut<unknown, CreateBlogPayload>(url, payload);
  return normalizeBlogCreate(details);
}

type UpdateBlogStatusPayload = { status: string };

export async function updateBlogStatus(blogId: string, status: string) {
  const normalizedStatus = status.trim() || status;
  const url = `/api/content/blogs/${encodeURIComponent(blogId)}/update-status`;
  const payload: UpdateBlogStatusPayload = { status: normalizedStatus };

  try {
    const details = await apiPatch<unknown, UpdateBlogStatusPayload>(url, payload);
    return normalizeBlogListItem(extractUpdatedBlogCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  try {
    const details = await apiPut<unknown, UpdateBlogStatusPayload>(url, payload);
    return normalizeBlogListItem(extractUpdatedBlogCandidate(details));
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  const details = await apiPost<unknown, UpdateBlogStatusPayload>(url, payload);
  return normalizeBlogListItem(extractUpdatedBlogCandidate(details));
}

export async function deleteBlog(blogId: string) {
  const url = `/api/content/blogs/${encodeURIComponent(blogId)}/delete`;

  try {
    await apiDelete<unknown>(url);
    return;
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  try {
    await apiPatch<unknown, Record<string, never>>(url, {});
    return;
  } catch (error) {
    const statusCode = axios.isAxiosError(error) ? error.response?.status : null;
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }
  }

  await apiPost<unknown>(url);
}
