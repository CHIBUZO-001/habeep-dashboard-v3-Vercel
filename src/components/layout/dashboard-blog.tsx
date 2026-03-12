import {
  BookOpenText,
  Image,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldX,
  UserCircle2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "../../lib/cn";
import { getApiErrorMessage } from "../../lib/http-client";
import { getSession } from "../../lib/session";
import {
  createBlog,
  deleteBlog,
  getBlogOverview,
  getBlogsList,
  updateBlogStatus,
  type BlogListItem,
  type BlogListMeta,
  type BlogOverview,
} from "../../services";
import { useToast } from "../ui/toast-provider";
import { numberFormatter, surfaceCardClass } from "./dashboard-blog.constants";
import { BlogCard } from "./dashboard-blog.blog-card";
import {
  BlogCreateModal,
  BlogViewModal,
  ConfirmDeleteBlogModal,
  type BlogCreateValues,
} from "./dashboard-blog.modals";
import {
  buildPaginationItems,
  formatFullTimestamp,
  stripMarkdown,
} from "./dashboard-blog.utils";

type OverviewStat = {
  key: keyof BlogOverview;
  label: string;
  icon: typeof BookOpenText;
  iconWrapClassName: string;
  valueClassName: string;
};

function getDefaultBlogUsername() {
  const sessionUser = getSession()?.user;
  if (!sessionUser || typeof sessionUser !== "object" || Array.isArray(sessionUser)) {
    return "Admin";
  }

  const source = sessionUser as Record<string, unknown>;
  const usernameCandidate =
    typeof source.username === "string" ? source.username.trim() : "";
  const nameCandidate = typeof source.name === "string" ? source.name.trim() : "";
  const emailCandidate = typeof source.email === "string" ? source.email.trim() : "";
  const derivedFromEmail = emailCandidate
    ? emailCandidate.split("@")[0]?.replace(/[._-]+/g, " ").trim()
    : "";

  return usernameCandidate || nameCandidate || derivedFromEmail || "Admin";
}

export function DashboardBlog() {
  const defaultUsername = useMemo(getDefaultBlogUsername, []);
  const [overview, setOverview] = useState<BlogOverview | null>(null);
  const [metaTimestamp, setMetaTimestamp] = useState("");
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [blogsMeta, setBlogsMeta] = useState<BlogListMeta | null>(null);
  const [blogsMetaTimestamp, setBlogsMetaTimestamp] = useState("");
  const [isBlogsLoading, setIsBlogsLoading] = useState(false);
  const [blogsErrorMessage, setBlogsErrorMessage] = useState<string | null>(
    null,
  );

  type CoverFilter = "all" | "with-cover" | "no-cover";

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [coverFilter, setCoverFilter] = useState<CoverFilter>("all");
  const [viewBlog, setViewBlog] = useState<BlogListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogListItem | null>(null);
  const [actionMenuBlogId, setActionMenuBlogId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>(
    {},
  );
  const [deleteUpdating, setDeleteUpdating] = useState<Record<string, boolean>>(
    {},
  );
  const listLimitRef = useRef<number | null>(null);
  const blogOverridesRef = useRef<Record<string, { title: string; subtitle?: string }>>(
    {},
  );

  const { toast } = useToast();

  const loadOverview = useCallback(
    async (showErrorToast = false) => {
      setIsOverviewLoading(true);
      try {
        const response = await getBlogOverview();
        setOverview(response.data);
        setMetaTimestamp(response.meta.timestamp);
        setErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Failed to load blog overview.",
        );
        setErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Blog overview unavailable",
            description: message,
          });
        }
      } finally {
        setIsOverviewLoading(false);
      }
    },
    [toast],
  );

  const loadBlogs = useCallback(
    async (showErrorToast = false, nextPage = page) => {
      setIsBlogsLoading(true);
      try {
        const response = await getBlogsList({
          page: nextPage,
          limit: listLimitRef.current ?? undefined,
        });
        const overrides = blogOverridesRef.current;
        const items = response.data.items.map((item) => {
          const override = overrides[item.id];
          if (!override) {
            return item;
          }

          const shouldOverrideTitle = !item.title.trim() && override.title.trim();
          const shouldOverrideSubtitle =
            !item.subtitle.trim() && Boolean(override.subtitle?.trim());

          if (!shouldOverrideTitle && !shouldOverrideSubtitle) {
            return item;
          }

          return {
            ...item,
            title: shouldOverrideTitle ? override.title : item.title,
            subtitle:
              shouldOverrideSubtitle && override.subtitle
                ? override.subtitle
                : item.subtitle,
          };
        });

        setBlogs(items);
        setBlogsMeta(response.data.meta);
        setBlogsMetaTimestamp(response.meta.timestamp);
        if (typeof response.data.meta.limit === "number" && response.data.meta.limit > 0) {
          listLimitRef.current = response.data.meta.limit;
        }
        setBlogsErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to load blogs list.");
        setBlogsErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Blogs unavailable",
            description: message,
          });
        }
      } finally {
        setIsBlogsLoading(false);
      }
    },
    [page, toast],
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadBlogs();
  }, [loadBlogs]);

  useEffect(() => {
    if (!actionMenuBlogId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const path = event.composedPath?.() as EventTarget[] | undefined;
      const clickedInside = path?.some((node) => {
        if (!(node instanceof HTMLElement)) {
          return false;
        }
        return node.dataset.blogMenuRoot === actionMenuBlogId;
      });

      if (!clickedInside) {
        setActionMenuBlogId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActionMenuBlogId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionMenuBlogId]);

  useEffect(() => {
    if (!viewBlog && !createOpen && !deleteTarget) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (viewBlog) {
        setViewBlog(null);
      }
      if (createOpen && !isCreating) {
        setCreateOpen(false);
      }
      if (deleteTarget && !deleteUpdating[deleteTarget.id]) {
        setDeleteTarget(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [createOpen, deleteTarget, deleteUpdating, isCreating, viewBlog]);

  const openCreateModal = () => {
    setCreateOpen(true);
  };

  const closeCreateModal = (force = false) => {
    if (isCreating && !force) {
      return;
    }
    setCreateOpen(false);
  };

  const handleCreateBlog = async (values: BlogCreateValues) => {
    const username = values.username.trim();
    const title = values.title.trim();
    const content = values.content.trim();
    if (!username || !title || !content) {
      return;
    }

    const payload = {
      username,
      title,
      subtitle: values.subtitle.trim() || undefined,
      content,
      imageCover: values.imageCover.trim() || undefined,
      status: values.status,
    };

    setIsCreating(true);

    try {
      const result = await createBlog(payload);
      if (result.id) {
        blogOverridesRef.current[result.id] = {
          title,
          subtitle: payload.subtitle,
        };
      }
      toast({
        variant: "success",
        title: "Blog created",
        description: title ? `Added "${title}".` : "Blog was created successfully.",
      });

      closeCreateModal(true);
      setPage(1);
      await loadOverview();
      await loadBlogs(true, 1);
    } catch (error) {
      toast({
        variant: "error",
        title: "Create blog failed",
        description: getApiErrorMessage(
          error,
          "Could not create the blog post.",
        ),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const stats = useMemo<OverviewStat[]>(
    () => [
      {
        key: "totalBlogs",
        label: "Total blogs",
        icon: BookOpenText,
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
        key: "drafts",
        label: "Drafts",
        icon: ShieldX,
        iconWrapClassName:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
        valueClassName: "text-slate-900 dark:text-slate-100",
      },
    ],
    [],
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() || authorFilter !== "all" || coverFilter !== "all",
  );

  const availableAuthors = useMemo(() => {
    const authors = new Set<string>();
    for (const blog of blogs) {
      const username = blog.username.trim() || "Unknown";
      authors.add(username);
    }
    if (authorFilter !== "all") {
      authors.add(authorFilter);
    }
    return Array.from(authors).sort((left, right) => left.localeCompare(right));
  }, [authorFilter, blogs]);

  const filteredBlogs = useMemo(() => {
    const normalizedQuery = stripMarkdown(searchQuery).toLowerCase();

    return blogs.filter((blog) => {
      const username = blog.username.trim() || "Unknown";

      if (authorFilter !== "all" && username !== authorFilter) {
        return false;
      }

      const hasCoverImage = Boolean(blog.imageCover.trim());
      if (coverFilter === "with-cover" && !hasCoverImage) {
        return false;
      }
      if (coverFilter === "no-cover" && hasCoverImage) {
        return false;
      }

      const searchable = [
        blog.title,
        blog.subtitle,
        username,
        stripMarkdown(blog.content),
      ]
        .join(" ")
        .toLowerCase();

      return normalizedQuery ? searchable.includes(normalizedQuery) : true;
    });
  }, [authorFilter, blogs, coverFilter, searchQuery]);

  const totalPages = useMemo(() => {
    const total = blogsMeta?.total ?? 0;
    const limit = blogsMeta?.limit ?? 0;
    if (!total || !limit) {
      return 1;
    }
    return Math.max(1, Math.ceil(total / limit));
  }, [blogsMeta]);
  const currentListPage = blogsMeta?.page || page;
  const desktopPaginationItems = useMemo(
    () => buildPaginationItems(currentListPage, totalPages, 7),
    [currentListPage, totalPages],
  );
  const mobilePaginationItems = useMemo(
    () => buildPaginationItems(currentListPage, totalPages, 5),
    [currentListPage, totalPages],
  );

  const closeViewBlog = useCallback(() => {
    setViewBlog(null);
  }, []);

  const handleSetStatus = useCallback(
    async (blog: BlogListItem, status: "published" | "draft") => {
      setActionMenuBlogId(null);
      setStatusUpdating((previous) => ({ ...previous, [blog.id]: true }));
      try {
        const updated = await updateBlogStatus(blog.id, status);
        const nextBlog = updated ?? { ...blog, status };

        setBlogs((previousBlogs) =>
          previousBlogs.map((item) => (item.id === blog.id ? nextBlog : item)),
        );
        if (viewBlog?.id === blog.id) {
          setViewBlog(nextBlog);
        }

      setActionMenuBlogId(null);
      void loadOverview();

      const blogLabel = nextBlog.title.trim() || nextBlog.subtitle.trim();

      toast({
        variant: "success",
        title: "Blog status updated",
        description: blogLabel ? `Updated "${blogLabel}".` : "Status updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Status update failed",
          description: getApiErrorMessage(
            error,
            "Could not update the blog status.",
          ),
        });
      } finally {
        setStatusUpdating((previous) => {
          if (!previous[blog.id]) {
            return previous;
          }
          const next = { ...previous };
          delete next[blog.id];
          return next;
        });
      }
    },
    [loadOverview, toast, viewBlog],
  );

  const handleDeleteBlog = useCallback((blog: BlogListItem) => {
    setActionMenuBlogId(null);
    setDeleteTarget(blog);
  }, []);

  const closeDeleteModal = useCallback(
    (force = false) => {
      if (!deleteTarget) {
        return;
      }
      if (deleteUpdating[deleteTarget.id] && !force) {
        return;
      }
      setDeleteTarget(null);
    },
    [deleteTarget, deleteUpdating],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    const blog = deleteTarget;
    const label = blog.title.trim() || blog.subtitle.trim() || "this blog";

    setDeleteUpdating((previous) => ({ ...previous, [blog.id]: true }));

    try {
      await deleteBlog(blog.id);
      setBlogs((previousBlogs) =>
        previousBlogs.filter((item) => item.id !== blog.id),
      );
      setBlogsMeta((currentMeta) => {
        if (!currentMeta) {
          return currentMeta;
        }

        return {
          ...currentMeta,
          total: Math.max(0, currentMeta.total - 1),
        };
      });
      if (viewBlog?.id === blog.id) {
        setViewBlog(null);
      }

      closeDeleteModal(true);
      void loadOverview();
      void loadBlogs(true);

      toast({
        variant: "success",
        title: "Blog deleted",
        description: `"${label}" has been deleted.`,
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: getApiErrorMessage(error, "Could not delete the blog."),
      });
    } finally {
      setDeleteUpdating((previous) => {
        if (!previous[blog.id]) {
          return previous;
        }
        const next = { ...previous };
        delete next[blog.id];
        return next;
      });
    }
  }, [
    closeDeleteModal,
    deleteTarget,
    loadBlogs,
    loadOverview,
    toast,
    viewBlog,
  ]);

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <section
          className={cn(
            surfaceCardClass,
            "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-rose-800 dark:text-rose-200">
                Blog overview unavailable
              </h3>
              <p className="mt-1 text-sm text-rose-700/80 dark:text-rose-200/80">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadOverview(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 dark:hover:bg-rose-950/60"
            >
              <RefreshCw
                className={cn("h-4 w-4", isOverviewLoading && "animate-spin")}
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
                Blog overview
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Derived from{" "}
                <span className="font-mono">/api/content/blogs/overview</span>
              </p>
              {metaTimestamp ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Last updated {formatFullTimestamp(metaTimestamp)}.
                </p>
              ) : null}
            </div>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
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
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Blogs
              </h3>

              {blogsMetaTimestamp ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Last updated {formatFullTimestamp(blogsMetaTimestamp)}.
                </p>
              ) : null}
            </div>

            <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap sm:justify-end">
              <button
                type="button"
                onClick={openCreateModal}
                disabled={isCreating}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                New blog
              </button>
              <button
                type="button"
                onClick={() => {
                  void loadOverview(true);
                  void loadBlogs(true);
                }}
                disabled={isBlogsLoading || isOverviewLoading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 sm:flex-none"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (isBlogsLoading || isOverviewLoading) && "animate-spin",
                  )}
                />
                Refresh
              </button>
            </div>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative col-span-2 block lg:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => {
                  setPage(1);
                  setSearchQuery(event.target.value);
                }}
                type="text"
                placeholder="Search blogs..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 lg:w-auto">
              <UserCircle2 className="h-4 w-4" />
              <select
                value={authorFilter}
                onChange={(event) => {
                  setPage(1);
                  setAuthorFilter(event.target.value);
                }}
                className="w-full min-w-0 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700 lg:w-40"
              >
                <option value="all">All authors</option>
                {availableAuthors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20 lg:w-auto">
              <Image className="h-4 w-4" />
              <select
                value={coverFilter}
                onChange={(event) => {
                  setPage(1);
                  setCoverFilter(event.target.value as CoverFilter);
                }}
                className="w-full min-w-0 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700 lg:w-32"
              >
                <option value="all">All covers</option>
                <option value="with-cover">With cover</option>
                <option value="no-cover">No cover</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setPage(1);
                setSearchQuery("");
                setAuthorFilter("all");
                setCoverFilter("all");
              }}
              disabled={!hasActiveFilters}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 lg:w-auto"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>

          {blogsErrorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {blogsErrorMessage}
            </div>
          ) : null}

          {isBlogsLoading && blogs.length === 0 ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-slate-800/70 dark:bg-slate-950/40"
                />
              ))}
            </div>
          ) : filteredBlogs.length > 0 ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBlogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  isMenuOpen={actionMenuBlogId === blog.id}
                  statusUpdating={Boolean(statusUpdating[blog.id])}
                  deleteUpdating={Boolean(deleteUpdating[blog.id])}
                  onToggleMenu={() =>
                    setActionMenuBlogId((previous) =>
                      previous === blog.id ? null : blog.id,
                    )
                  }
                  onViewBlog={(nextBlog) => {
                    setActionMenuBlogId(null);
                    setViewBlog(nextBlog);
                  }}
                  onSetStatus={handleSetStatus}
                  onDeleteBlog={handleDeleteBlog}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {hasActiveFilters
                ? "No blogs matched your filters."
                : "No blogs found."}
            </p>
          )}

          {totalPages > 1 ? (
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="sm:hidden">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(currentListPage - 1, 1))}
                      disabled={currentListPage <= 1 || isBlogsLoading}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Prev
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPage(Math.min(currentListPage + 1, totalPages))
                      }
                      disabled={currentListPage >= totalPages || isBlogsLoading}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Next
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {mobilePaginationItems.map((item) => {
                      if (typeof item !== "number") {
                        return (
                          <span
                            key={item}
                            className="inline-flex h-9 min-w-7 items-center justify-center px-1 text-sm font-medium text-slate-400 dark:text-slate-500"
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
                          disabled={isBlogsLoading}
                          aria-current={isActivePage ? "page" : undefined}
                          className={cn(
                            "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
                    disabled={currentListPage <= 1 || isBlogsLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
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
                          disabled={isBlogsLoading}
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
                    onClick={() => setPage(Math.min(currentListPage + 1, totalPages))}
                    disabled={currentListPage >= totalPages || isBlogsLoading}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {viewBlog ? (
        <BlogViewModal blog={viewBlog} onClose={closeViewBlog} />
      ) : null}
      {createOpen ? (
        <BlogCreateModal
          initialUsername={defaultUsername}
          isSubmitting={isCreating}
          onClose={() => closeCreateModal()}
          onSubmit={handleCreateBlog}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDeleteBlogModal
          blog={deleteTarget}
          isDeleting={Boolean(deleteUpdating[deleteTarget.id])}
          onClose={() => closeDeleteModal()}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
    </div>
  );
}
