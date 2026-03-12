import {
  CalendarDays,
  Image,
  ShieldCheck,
  ShieldX,
  UserCircle2,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import type { BlogListItem } from "../../services";

import { formatDateLabel } from "./dashboard-blog.utils";

export type BlogViewModalProps = {
  blog: BlogListItem;
  onClose: () => void;
};

export function BlogViewModal({ blog, onClose }: BlogViewModalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  const rawTitle = blog.title?.trim() || "";
  const rawSubtitle = blog.subtitle?.trim() || "";
  const title = rawTitle || rawSubtitle || "Untitled blog post";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              View blog
            </p>
            <h4 className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h4>
            {rawTitle && rawSubtitle ? (
              <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-300">
                {rawSubtitle}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <UserCircle2 className="h-4 w-4" />
                {blog.username || "Unknown"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <CalendarDays className="h-4 w-4" />
                {blog.createdAt ? formatDateLabel(blog.createdAt) : "—"}
              </span>
              {blog.status ? (
                <span
                  className={
                    blog.status.toLowerCase() === "published"
                      ? "inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
                  }
                >
                  {blog.status.toLowerCase() === "published" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldX className="h-4 w-4" />
                  )}
                  {blog.status}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="max-h-[70dvh] overflow-y-auto p-4">
          {blog.imageCover ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
              <img
                src={blog.imageCover}
                alt={title}
                loading="lazy"
                decoding="async"
                className="h-56 w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Content
            </p>
            <p className="mt-2 whitespace-pre-wrap wrap-anywhere">
              {blog.content || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export type BlogCreateValues = {
  username: string;
  title: string;
  subtitle: string;
  imageCover: string;
  status: "draft" | "published";
  content: string;
};

export type BlogCreateModalProps = {
  initialUsername?: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: BlogCreateValues) => void | Promise<void>;
};

export function BlogCreateModal({
  initialUsername,
  isSubmitting,
  onClose,
  onSubmit,
}: BlogCreateModalProps) {
  const [formState, setFormState] = useState<BlogCreateValues>(() => ({
    username: initialUsername?.trim() || "",
    title: "",
    subtitle: "",
    imageCover: "",
    status: "draft",
    content: "",
  }));

  if (typeof document === "undefined") {
    return null;
  }

  const hasUsername = Boolean(formState.username.trim());
  const hasTitle = Boolean(formState.title.trim());
  const hasContent = Boolean(formState.content.trim());

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 mt-4 flex max-h-[calc(90dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mt-8 sm:w-[min(96vw,46rem)]"
        role="dialog"
        aria-modal="true"
        aria-label="Create blog"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create blog
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Posts to <span className="font-mono">/api/content/blogs/create</span>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close create blog dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-8"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(formState);
          }}
        >
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Username
            </span>
            <input
              value={formState.username}
              onChange={(event) =>
                setFormState((previousState) => ({
                  ...previousState,
                  username: event.target.value,
                }))
              }
              required
              type="text"
              placeholder="Author username"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Title
            </span>
            <input
              value={formState.title}
              onChange={(event) =>
                setFormState((previousState) => ({
                  ...previousState,
                  title: event.target.value,
                }))
              }
              required
              type="text"
              placeholder="Blog title"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Subtitle
            </span>
            <input
              value={formState.subtitle}
              onChange={(event) =>
                setFormState((previousState) => ({
                  ...previousState,
                  subtitle: event.target.value,
                }))
              }
              type="text"
              placeholder="Short intro (optional)"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </span>
              <select
                value={formState.status}
                onChange={(event) =>
                  setFormState((previousState) => ({
                    ...previousState,
                    status: event.target.value as BlogCreateValues["status"],
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Cover image URL
              </span>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Image className="h-4 w-4" />
                </span>
                <input
                  value={formState.imageCover}
                  onChange={(event) =>
                    setFormState((previousState) => ({
                      ...previousState,
                      imageCover: event.target.value,
                    }))
                  }
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
                />
              </div>
            </label>
          </div>

          {formState.imageCover.trim() ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
              <img
                src={formState.imageCover.trim()}
                alt="Cover preview"
                loading="lazy"
                decoding="async"
                className="h-40 w-full object-cover"
              />
            </div>
          ) : null}

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Content
            </span>
            <textarea
              value={formState.content}
              onChange={(event) =>
                setFormState((previousState) => ({
                  ...previousState,
                  content: event.target.value,
                }))
              }
              required
              rows={8}
              placeholder="Write your blog content (markdown supported by API)."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasUsername || !hasTitle || !hasContent}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Creating..." : "Create blog"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export type ConfirmDeleteBlogModalProps = {
  blog: BlogListItem | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmDeleteBlogModal({
  blog,
  isDeleting,
  onClose,
  onConfirm,
}: ConfirmDeleteBlogModalProps) {
  if (!blog || typeof document === "undefined") {
    return null;
  }

  const title = blog.title?.trim() || blog.subtitle?.trim() || "this blog";

  return createPortal(
    <div className="fixed inset-0 z-85 flex items-start justify-center p-0 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-1 mt-24 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-label="Delete blog"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Delete blog
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close delete dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-3 px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
          <p>
            Delete{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              &quot;{title}&quot;
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-900/25 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
