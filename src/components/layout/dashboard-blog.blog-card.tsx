import {
  CalendarDays,
  Eye,
  Loader2,
  MoreVertical,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserCircle2,
} from "lucide-react";

import { cn } from "../../lib/cn";
import { type BlogListItem } from "../../services";
import {
  actionMenuItemClass,
  actionMenuLabelClass,
} from "./dashboard-blog.constants";
import { formatDateLabel, stripMarkdown, truncateText } from "./dashboard-blog.utils";

export type BlogCardProps = {
  blog: BlogListItem;
  isMenuOpen: boolean;
  statusUpdating: boolean;
  deleteUpdating: boolean;
  onToggleMenu: () => void;
  onViewBlog: (blog: BlogListItem) => void;
  onSetStatus: (blog: BlogListItem, status: "published" | "draft") => void | Promise<void>;
  onDeleteBlog: (blog: BlogListItem) => void | Promise<void>;
};

export function BlogCard({
  blog,
  isMenuOpen,
  statusUpdating,
  deleteUpdating,
  onToggleMenu,
  onViewBlog,
  onSetStatus,
  onDeleteBlog,
}: BlogCardProps) {
  const rawTitle = blog.title?.trim() || "";
  const rawSubtitle = blog.subtitle?.trim() || "";
  const displayTitle = rawTitle || rawSubtitle || "Untitled blog post";
  const displaySubtitle = rawTitle ? rawSubtitle : "";
  const snippet = truncateText(stripMarkdown(blog.content), 180);
  const status = blog.status?.trim().toLowerCase();

  const isPublished = status === "published";
  const isDraft = status === "draft";

  return (
    <li
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm shadow-slate-900/5 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/10 dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:border-blue-900/60 dark:hover:shadow-blue-950/30",
        isMenuOpen && "z-30",
      )}
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
        {blog.imageCover ? (
          <img
            src={blog.imageCover}
            alt={displayTitle}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-400">
            No cover image
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/70 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4
              className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
              title={displayTitle}
            >
              {truncateText(displayTitle, 72)}
            </h4>
            {blog.status ? (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  isPublished
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : isDraft
                      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
                      : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
                )}
              >
                {blog.status}
              </span>
            ) : null}
          </div>

          {displaySubtitle ? (
            <p
              className="mt-1 text-xs text-slate-600 dark:text-slate-300"
              title={displaySubtitle}
            >
              {truncateText(displaySubtitle, 96)}
            </p>
          ) : null}
          {snippet ? (
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              {snippet}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <UserCircle2 className="h-4 w-4" />
            {blog.username || "Unknown"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <CalendarDays className="h-4 w-4" />
            {blog.createdAt ? formatDateLabel(blog.createdAt) : "—"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <div
            data-blog-menu-root={blog.id}
            className={cn("relative flex items-center gap-2", isMenuOpen && "z-40")}
          >
            <button
              type="button"
              onClick={() => onViewBlog(blog)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Eye className="h-4 w-4" />
              View
            </button>

            <button
              type="button"
              onClick={onToggleMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-900/5 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Blog actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute bottom-11 right-0 z-50 w-64 origin-bottom-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className={actionMenuLabelClass}>Status</p>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onSetStatus(blog, "published")}
                  disabled={(isPublished && Boolean(blog.status)) || statusUpdating}
                  className={actionMenuItemClass}
                >
                  {statusUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Published
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onSetStatus(blog, "draft")}
                  disabled={(isDraft && Boolean(blog.status)) || statusUpdating}
                  className={actionMenuItemClass}
                >
                  {statusUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldX className="h-4 w-4" />
                  )}
                  Draft
                </button>

                <div className="my-2 h-px bg-slate-200/70 dark:bg-slate-800" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onDeleteBlog(blog)}
                  disabled={deleteUpdating}
                  className={cn(
                    actionMenuItemClass,
                    "text-rose-700 hover:bg-rose-50 dark:text-rose-200 dark:hover:bg-rose-950/30",
                  )}
                >
                  {deleteUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
