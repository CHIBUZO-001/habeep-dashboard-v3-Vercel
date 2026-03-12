import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Flag,
  PenSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../lib/cn";
import { getApiErrorMessage } from "../../lib/http-client";
import {
  deletePost,
  getPostOverview,
  getPostsList,
  getPostById,
  flagPost,
  unflagPost,
  promotePost,
  unpromotePost,
  updatePostStatus,
  type PostDetail,
  type PostListItem,
  type PostListMeta,
  type PostOverview,
} from "../../services";
import { useToast } from "../ui/toast-provider";
import {
  numberFormatter,
  surfaceCardClass,
} from "./dashboard-post.constants";
import { PostViewModal } from "./dashboard-post.modals";
import { PostCard } from "./dashboard-post.post-card";
import {
  buildPaginationItems,
  formatFullTimestamp,
  truncateText,
} from "./dashboard-post.utils";

type OverviewStat = {
  key: keyof PostOverview;
  label: string;
  icon: typeof PenSquare;
  iconWrapClassName: string;
  valueClassName: string;
};

type PublishFilter = "all" | "published" | "draft";

export function DashboardPost() {
  const [overview, setOverview] = useState<PostOverview | null>(null);
  const [metaTimestamp, setMetaTimestamp] = useState("");
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [postsMeta, setPostsMeta] = useState<PostListMeta | null>(null);
  const [postsMetaTimestamp, setPostsMetaTimestamp] = useState("");
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [postsErrorMessage, setPostsErrorMessage] = useState<string | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionMenuPostId, setActionMenuPostId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>(
    {},
  );
  const [flagUpdating, setFlagUpdating] = useState<Record<string, boolean>>({});
  const [promotionUpdating, setPromotionUpdating] = useState<
    Record<string, boolean>
  >({});
  const [deleteUpdating, setDeleteUpdating] = useState<Record<string, boolean>>(
    {},
  );
  const [viewPostId, setViewPostId] = useState<string | null>(null);
  const [viewPost, setViewPost] = useState<PostDetail | null>(null);
  const [isViewPostLoading, setIsViewPostLoading] = useState(false);
  const [viewPostErrorMessage, setViewPostErrorMessage] = useState<
    string | null
  >(null);
  const listLimitRef = useRef<number | null>(null);
  const { toast } = useToast();

  const loadOverview = useCallback(
    async (showErrorToast = false) => {
      setIsOverviewLoading(true);
      try {
        const response = await getPostOverview();
        setOverview(response.data);
        setMetaTimestamp(response.meta.timestamp);
        setErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to load post overview.");
        setErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Post overview unavailable",
            description: message,
          });
        }
      } finally {
        setIsOverviewLoading(false);
      }
    },
    [toast],
  );

  const loadPosts = useCallback(
    async (showErrorToast = false) => {
      setIsPostsLoading(true);
      try {
        const response = await getPostsList({
          page,
          limit: listLimitRef.current ?? undefined,
        });
        setPosts(response.data.items);
        setPostsMeta(response.data.meta);
        setPostsMetaTimestamp(response.meta.timestamp);
        if (
          typeof response.data.meta.limit === "number" &&
          response.data.meta.limit > 0
        ) {
          listLimitRef.current = response.data.meta.limit;
        }
        setPostsErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to load posts list.");
        setPostsErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Posts unavailable",
            description: message,
          });
        }
      } finally {
        setIsPostsLoading(false);
      }
    },
    [page, toast],
  );

  const closeViewPost = useCallback(() => {
    setViewPostId(null);
    setViewPost(null);
    setViewPostErrorMessage(null);
    setIsViewPostLoading(false);
  }, []);

  const handleViewPost = useCallback(
    async (postId: string) => {
      setActionMenuPostId(null);
      setViewPostId(postId);
      setViewPost(null);
      setViewPostErrorMessage(null);
      setIsViewPostLoading(true);

      try {
        const details = await getPostById(postId);
        if (!details) {
          throw new Error("Post not found.");
        }
        setViewPost(details);
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to load the post.");
        setViewPostErrorMessage(message);
        toast({
          variant: "error",
          title: "Post load failed",
          description: message,
        });
      } finally {
        setIsViewPostLoading(false);
      }
    },
    [toast],
  );

  const handleSetStatus = useCallback(
    async (post: PostListItem, desiredStatus: "published" | "draft") => {
      setActionMenuPostId(null);
      setStatusUpdating((previous) => ({ ...previous, [post.id]: true }));

      try {
        const updatedPost = await updatePostStatus(post.id, desiredStatus);
        if (!updatedPost) {
          throw new Error("Update did not return the updated post.");
        }

        setPosts((currentPosts) =>
          currentPosts.map((item) =>
            item.id === post.id ? { ...item, ...updatedPost } : item,
          ),
        );
        void loadOverview();

        toast({
          variant: "success",
          title: "Status updated",
          description: `${
            post.title?.trim() || truncateText(post.content, 32) || "Post"
          } is now ${desiredStatus}.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Status update failed",
          description: getApiErrorMessage(
            error,
            "Could not update the post status.",
          ),
        });
      } finally {
        setStatusUpdating((previous) => {
          if (!previous[post.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[post.id];
          return next;
        });
      }
    },
    [loadOverview, toast],
  );

  const handleFlagPost = useCallback(
    async (post: PostListItem) => {
      setActionMenuPostId(null);
      setFlagUpdating((previous) => ({ ...previous, [post.id]: true }));

      try {
        const updatedPost = await flagPost(post.id);
        if (!updatedPost) {
          throw new Error("Flag request did not return the updated post.");
        }

        setPosts((currentPosts) =>
          currentPosts.map((item) =>
            item.id === post.id ? { ...item, ...updatedPost } : item,
          ),
        );
        void loadOverview();

        toast({
          variant: "success",
          title: "Post flagged",
          description: `${
            post.title?.trim() || truncateText(post.content, 32) || "Post"
          } has been flagged.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Flag failed",
          description: getApiErrorMessage(error, "Could not flag the post."),
        });
      } finally {
        setFlagUpdating((previous) => {
          if (!previous[post.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[post.id];
          return next;
        });
      }
    },
    [loadOverview, toast],
  );

  const handleUnflagPost = useCallback(
    async (post: PostListItem) => {
      setActionMenuPostId(null);
      setFlagUpdating((previous) => ({ ...previous, [post.id]: true }));

      try {
        const updatedPost = await unflagPost(post.id);
        if (!updatedPost) {
          throw new Error("Unflag request did not return the updated post.");
        }

        setPosts((currentPosts) =>
          currentPosts.map((item) =>
            item.id === post.id ? { ...item, ...updatedPost } : item,
          ),
        );
        void loadOverview();

        toast({
          variant: "success",
          title: "Post unflagged",
          description: `${
            post.title?.trim() || truncateText(post.content, 32) || "Post"
          } has been unflagged.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Unflag failed",
          description: getApiErrorMessage(error, "Could not unflag the post."),
        });
      } finally {
        setFlagUpdating((previous) => {
          if (!previous[post.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[post.id];
          return next;
        });
      }
    },
    [loadOverview, toast],
  );

  const handlePromotePost = useCallback(
    async (post: PostListItem) => {
      setActionMenuPostId(null);
      setPromotionUpdating((previous) => ({ ...previous, [post.id]: true }));

      try {
        const updatedPost = await promotePost(post.id);
        if (!updatedPost) {
          throw new Error("Promote request did not return the updated post.");
        }

        setPosts((currentPosts) =>
          currentPosts.map((item) =>
            item.id === post.id ? { ...item, ...updatedPost } : item,
          ),
        );
        void loadOverview();

        toast({
          variant: "success",
          title: "Post promoted",
          description: `${
            post.title?.trim() || truncateText(post.content, 32) || "Post"
          } has been promoted.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Promote failed",
          description: getApiErrorMessage(error, "Could not promote the post."),
        });
      } finally {
        setPromotionUpdating((previous) => {
          if (!previous[post.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[post.id];
          return next;
        });
      }
    },
    [loadOverview, toast],
  );

  const handleUnpromotePost = useCallback(
    async (post: PostListItem) => {
      setActionMenuPostId(null);
      setPromotionUpdating((previous) => ({ ...previous, [post.id]: true }));

      try {
        const updatedPost = await unpromotePost(post.id);
        if (!updatedPost) {
          throw new Error("Unpromote request did not return the updated post.");
        }

        setPosts((currentPosts) =>
          currentPosts.map((item) =>
            item.id === post.id ? { ...item, ...updatedPost } : item,
          ),
        );
        void loadOverview();

        toast({
          variant: "success",
          title: "Post unpromoted",
          description: `${
            post.title?.trim() || truncateText(post.content, 32) || "Post"
          } has been unpromoted.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Unpromote failed",
          description: getApiErrorMessage(
            error,
            "Could not unpromote the post.",
          ),
        });
      } finally {
        setPromotionUpdating((previous) => {
          if (!previous[post.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[post.id];
          return next;
        });
      }
    },
    [loadOverview, toast],
  );

  const handleDeletePost = useCallback(
    async (post: PostListItem) => {
      setActionMenuPostId(null);

      const postLabel =
        post.title?.trim() || truncateText(post.content, 32) || "Post";

      const confirmed = window.confirm(
        `Delete "${postLabel}"?\n\nThis action cannot be undone.`,
      );
      if (!confirmed) {
        return;
      }

      setDeleteUpdating((previous) => ({ ...previous, [post.id]: true }));

      try {
        await deletePost(post.id);

        setPosts((currentPosts) =>
          currentPosts.filter((item) => item.id !== post.id),
        );
        setPostsMeta((currentMeta) => {
          if (!currentMeta) {
            return currentMeta;
          }

          return {
            ...currentMeta,
            total: Math.max(0, currentMeta.total - 1),
          };
        });

        if (viewPostId === post.id) {
          closeViewPost();
        }

        void loadOverview();
        void loadPosts();

        toast({
          variant: "success",
          title: "Post deleted",
          description: `"${postLabel}" has been deleted.`,
        });
      } catch (error) {
        toast({
          variant: "error",
          title: "Delete failed",
          description: getApiErrorMessage(error, "Could not delete the post."),
        });
      } finally {
        setDeleteUpdating((previous) => {
          if (!previous[post.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[post.id];
          return next;
        });
      }
    },
    [closeViewPost, loadOverview, loadPosts, toast, viewPostId],
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!actionMenuPostId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const path = event.composedPath?.() as EventTarget[] | undefined;
      const clickedInside = path?.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        return node.dataset.postMenuRoot === actionMenuPostId;
      });

      if (!clickedInside) {
        setActionMenuPostId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionMenuPostId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionMenuPostId]);

  useEffect(() => {
    if (!viewPostId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewPost();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeViewPost, viewPostId]);

  const stats = useMemo<OverviewStat[]>(
    () => [
      {
        key: "totalPosts",
        label: "Total posts",
        icon: PenSquare,
        iconWrapClassName:
          "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200",
        valueClassName: "text-slate-900 dark:text-slate-100",
      },
      {
        key: "published",
        label: "Published",
        icon: ShieldCheck,
        iconWrapClassName:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200",
        valueClassName: "text-slate-900 dark:text-slate-100",
      },
      {
        key: "pendingReview",
        label: "Pending review",
        icon: Timer,
        iconWrapClassName:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
        valueClassName: "text-slate-900 dark:text-slate-100",
      },
      {
        key: "flagged",
        label: "Flagged",
        icon: Flag,
        iconWrapClassName:
          "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200",
        valueClassName:
          (overview?.flagged ?? 0) > 0
            ? "text-rose-700 dark:text-rose-200"
            : "text-slate-900 dark:text-slate-100",
      },
      {
        key: "totalViews",
        label: "Total views",
        icon: Eye,
        iconWrapClassName:
          "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-200",
        valueClassName: "text-slate-900 dark:text-slate-100",
      },
    ],
    [overview?.flagged],
  );

  const totalPages = useMemo(() => {
    const total = postsMeta?.total ?? 0;
    const limit = postsMeta?.limit ?? 0;
    if (!total || !limit) {
      return 1;
    }

    return Math.max(1, Math.ceil(total / limit));
  }, [postsMeta]);

  const totalPosts = postsMeta?.total ?? 0;
  const currentListPage = postsMeta?.page || page;
  const pageSize = postsMeta?.limit || posts.length || 1;
  const pageStart =
    totalPosts === 0 ? 0 : (currentListPage - 1) * pageSize + 1;
  const pageEnd =
    totalPosts === 0
      ? 0
      : Math.min(currentListPage * pageSize, totalPosts);
  const desktopPaginationItems = useMemo(
    () => buildPaginationItems(currentListPage, totalPages, 7),
    [currentListPage, totalPages],
  );
  const mobilePaginationItems = useMemo(
    () => buildPaginationItems(currentListPage, totalPages, 5),
    [currentListPage, totalPages],
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      publishFilter !== "all" ||
      visibilityFilter !== "all" ||
      typeFilter !== "all",
  );

  const availableVisibilities = useMemo(() => {
    const visibilities = new Set<string>();
    for (const post of posts) {
      const visibility = post.visibility.trim();
      if (visibility) {
        visibilities.add(visibility);
      }
    }
    if (visibilityFilter !== "all") {
      visibilities.add(visibilityFilter);
    }
    return Array.from(visibilities).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [posts, visibilityFilter]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    for (const post of posts) {
      const type = post.type.trim();
      if (type) {
        types.add(type);
      }
    }
    if (typeFilter !== "all") {
      types.add(typeFilter);
    }
    return Array.from(types).sort((left, right) => left.localeCompare(right));
  }, [posts, typeFilter]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedVisibilityFilter = visibilityFilter.trim().toLowerCase();
    const normalizedTypeFilter = typeFilter.trim().toLowerCase();

    return posts.filter((post) => {
      if (publishFilter !== "all") {
        const wantsPublished = publishFilter === "published";
        if (wantsPublished !== post.isPublished) {
          return false;
        }
      }

      if (
        visibilityFilter !== "all" &&
        post.visibility.trim().toLowerCase() !== normalizedVisibilityFilter
      ) {
        return false;
      }

      if (
        typeFilter !== "all" &&
        post.type.trim().toLowerCase() !== normalizedTypeFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const locationParts = [
        post.location?.city,
        post.location?.state,
        post.location?.country,
        post.location?.address,
      ]
        .filter(Boolean)
        .join(" ");

      const searchable = [
        post.title,
        post.content,
        post.authorId,
        post.listingId,
        post.status ?? "",
        post.visibility,
        post.type,
        locationParts,
        post.tags.join(" "),
        post.userTags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [posts, publishFilter, searchQuery, typeFilter, visibilityFilter]);

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <section className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                Post overview unavailable
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadOverview(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  isOverviewLoading && "animate-spin",
                )}
              />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className={cn(surfaceCardClass, "relative overflow-hidden z-0")}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/15" />
        <div className="pointer-events-none absolute -left-24 -bottom-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/15" />

        <div className="relative z-10">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Post overview
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Derived from post overview.
              </p>
              {metaTimestamp ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Last updated {formatFullTimestamp(metaTimestamp)}.
                </p>
              ) : null}
            </div>

          </header>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const value = overview?.[stat.key];
              const displayValue =
                overview && typeof value === "number"
                  ? numberFormatter.format(value)
                  : isOverviewLoading
                    ? "..."
                    : "—";

              return (
                <div
                  key={stat.key}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        stat.iconWrapClassName,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                      {stat.label}
                    </p>
                  </div>

                  <p
                    className={cn(
                      "mt-3 text-2xl font-semibold",
                      stat.valueClassName,
                    )}
                  >
                    {displayValue}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={cn(surfaceCardClass, "relative z-10")}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-500/15" />
          <div className="absolute -left-24 -bottom-20 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl dark:bg-fuchsia-500/10" />
        </div>

        <div className="relative z-10">
          <header className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:items-center">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Posts
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {totalPosts > 0
                  ? `Showing ${numberFormatter.format(pageStart)}-${numberFormatter.format(pageEnd)} of ${numberFormatter.format(totalPosts)} posts`
                  : "Snapshot from posts list"}
                {hasActiveFilters
                  ? ` • ${numberFormatter.format(filteredPosts.length)} match${filteredPosts.length === 1 ? "" : "es"} on this page`
                  : ""}
              </p>
              {postsMetaTimestamp ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Last updated {formatFullTimestamp(postsMetaTimestamp)}.
                </p>
              ) : null}
            </div>

            <div className="ml-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  void loadOverview(true);
                  void loadPosts(true);
                }}
                disabled={isPostsLoading || isOverviewLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (isPostsLoading || isOverviewLoading) && "animate-spin",
                  )}
                />
                Refresh
              </button>
            </div>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            <label className="relative col-span-2 block lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setPage(1);
                  setSearchQuery(event.target.value);
                }}
                type="text"
                placeholder="Search posts, authors, tags..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 lg:w-auto">
              <Filter className="h-4 w-4" />
              <select
                value={publishFilter}
                onChange={(event) => {
                  setPage(1);
                  setPublishFilter(event.target.value as PublishFilter);
                }}
                className="w-full min-w-0 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700 lg:w-auto"
              >
                <option value="all">All posts</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 lg:w-auto">
              <Eye className="h-4 w-4" />
              <select
                value={visibilityFilter}
                onChange={(event) => {
                  setPage(1);
                  setVisibilityFilter(event.target.value);
                }}
                className="w-full min-w-0 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700 lg:w-32"
              >
                <option value="all">All visibility</option>
                {availableVisibilities.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 lg:w-auto">
              <PenSquare className="h-4 w-4" />
              <select
                value={typeFilter}
                onChange={(event) => {
                  setPage(1);
                  setTypeFilter(event.target.value);
                }}
                className="w-full min-w-0 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700 lg:w-28"
              >
                <option value="all">All types</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearchQuery("");
                setPublishFilter("all");
                setVisibilityFilter("all");
                setTypeFilter("all");
              }}
              disabled={!hasActiveFilters}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:w-auto"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          {postsErrorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {postsErrorMessage}
            </div>
          ) : null}

          {isPostsLoading && posts.length === 0 ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-950/40"
                />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isMenuOpen={actionMenuPostId === post.id}
                  statusUpdating={Boolean(statusUpdating[post.id])}
                  flagUpdating={Boolean(flagUpdating[post.id])}
                  promotionUpdating={Boolean(promotionUpdating[post.id])}
                  deleteUpdating={Boolean(deleteUpdating[post.id])}
                  onToggleMenu={() =>
                    setActionMenuPostId((previous) =>
                      previous === post.id ? null : post.id,
                    )
                  }
                  onViewPost={handleViewPost}
                  onFlagPost={handleFlagPost}
                  onUnflagPost={handleUnflagPost}
                  onSetStatus={handleSetStatus}
                  onPromotePost={handlePromotePost}
                  onUnpromotePost={handleUnpromotePost}
                  onDeletePost={handleDeletePost}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {hasActiveFilters
                ? "No posts matched your filters."
                : "No posts found."}
            </p>
          )}

	          {totalPages > 1 ? (
	            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
	              <div className="sm:hidden">
	                <div className="flex flex-col gap-3 max-[400px]:gap-2">
	                  <div className="flex items-center justify-between gap-2">
		                    <button
		                      type="button"
		                      onClick={() => setPage(Math.max(currentListPage - 1, 1))}
		                      disabled={currentListPage <= 1 || isPostsLoading}
		                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:px-2 max-[400px]:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
		                    >
	                      <ChevronLeft className="h-4 w-4" />
	                      Prev
	                    </button>

		                    <button
		                      type="button"
		                      onClick={() =>
		                        setPage(Math.min(currentListPage + 1, totalPages))
		                      }
		                      disabled={currentListPage >= totalPages || isPostsLoading}
		                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:px-2 max-[400px]:text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
		                    >
	                      Next
	                      <ChevronRight className="h-4 w-4" />
	                    </button>
	                  </div>

	                  <div className="flex flex-wrap items-center justify-center gap-1">
	                    {mobilePaginationItems.map((item) => {
	                      if (typeof item !== "number") {
	                        return (
	                          <span
	                            key={item}
	                            className="inline-flex h-9 min-w-7 items-center justify-center px-1 text-sm font-medium text-slate-400 max-[400px]:h-8 max-[400px]:min-w-6 max-[400px]:text-xs dark:text-slate-500"
	                          >
	                            ...
	                          </span>
	                        );
	                      }

	                      const isActivePage = item === currentListPage;

	                      return (
	                        <button
	                          key={item}
	                          type="button"
	                          onClick={() => setPage(item)}
	                          disabled={isPostsLoading}
	                          aria-current={isActivePage ? "page" : undefined}
	                          className={cn(
	                            "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 max-[400px]:h-8 max-[400px]:min-w-8 max-[400px]:px-2 max-[400px]:text-xs",
	                            isActivePage
	                              ? "bg-blue-600 text-white shadow-sm shadow-blue-900/20"
	                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
	                          )}
	                        >
	                          {numberFormatter.format(item)}
	                        </button>
	                      );
	                    })}
	                  </div>
	                </div>
	              </div>

	              <div className="hidden items-center justify-end gap-3 sm:flex">
	                <div className="flex flex-wrap items-center gap-2">
		                  <button
		                    type="button"
		                    onClick={() => setPage(Math.max(currentListPage - 1, 1))}
		                    disabled={currentListPage <= 1 || isPostsLoading}
		                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
		                  >
	                    <ChevronLeft className="h-4 w-4" />
	                    Prev
	                  </button>

	                  <div className="flex flex-wrap items-center gap-1">
	                    {desktopPaginationItems.map((item) => {
	                      if (typeof item !== "number") {
	                        return (
	                          <span
	                            key={item}
	                            className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm font-medium text-slate-400 dark:text-slate-500"
	                          >
	                            ...
	                          </span>
	                        );
	                      }

	                      const isActivePage = item === currentListPage;

	                      return (
	                        <button
	                          key={item}
	                          type="button"
	                          onClick={() => setPage(item)}
	                          disabled={isPostsLoading}
	                          aria-current={isActivePage ? "page" : undefined}
	                          className={cn(
	                            "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
	                            isActivePage
	                              ? "bg-blue-600 text-white shadow-sm shadow-blue-900/20"
	                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
	                          )}
	                        >
	                          {numberFormatter.format(item)}
	                        </button>
	                      );
	                    })}
	                  </div>

		                  <button
		                    type="button"
		                    onClick={() =>
		                      setPage(Math.min(currentListPage + 1, totalPages))
		                    }
		                    disabled={currentListPage >= totalPages || isPostsLoading}
		                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
		                  >
	                    Next
	                    <ChevronRight className="h-4 w-4" />
	                  </button>
	                </div>
	              </div>
	            </div>
	          ) : null}
	        </div>
	      </section>

      {viewPostId ? (
        <PostViewModal
          postId={viewPostId}
          post={viewPost}
          isLoading={isViewPostLoading}
          errorMessage={viewPostErrorMessage}
          onClose={closeViewPost}
        />
      ) : null}
    </div>
  );
}
