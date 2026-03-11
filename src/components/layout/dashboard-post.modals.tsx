import { Eye, Heart, MessageCircle, Share2, X } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/cn";
import { type PostDetail } from "../../services";
import { numberFormatter } from "./dashboard-post.constants";
import {
  formatFullTimestamp,
  shortenId,
  truncateText,
} from "./dashboard-post.utils";

export type PostViewModalProps = {
  postId: string;
  post: PostDetail | null;
  isLoading: boolean;
  errorMessage: string | null;
  onClose: () => void;
};

export function PostViewModal({
  postId,
  post,
  isLoading,
  errorMessage,
  onClose,
}: PostViewModalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  const title =
    post?.title?.trim() ||
    truncateText(post?.content ?? "", 60) ||
    `Post ${shortenId(postId)}`;

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
              View post
            </p>
            <h4 className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h4>
            {post ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold dark:bg-slate-800">
                  {post.type || "post"}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-semibold",
                    post.isPublished
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
                  )}
                >
                  {post.isPublished ? "Published" : "Draft"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {post.visibility || "PUBLIC"}
                </span>
                {post.isFlagged ? (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    Flagged
                  </span>
                ) : null}
                {post.isPromoted ? (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
                    Promoted
                  </span>
                ) : null}
              </div>
            ) : null}
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
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              {errorMessage}
            </div>
          ) : post ? (
            <div className="space-y-4">
              <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Post ID
                  </p>
                  <p className="mt-1 font-mono text-xs wrap-anywhere">
                    {post.id}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Author
                  </p>
                  <p className="mt-1 font-mono text-xs wrap-anywhere">
                    {post.authorId || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Listing
                  </p>
                  <p className="mt-1 font-mono text-xs wrap-anywhere">
                    {post.listingId || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Updated
                  </p>
                  <p className="mt-1 text-xs">
                    {formatFullTimestamp(
                      post.lastUpdatedAt || post.updatedAt || post.createdAt,
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Created
                  </p>
                  <p className="mt-1 text-xs">
                    {post.createdAt ? formatFullTimestamp(post.createdAt) : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Published
                  </p>
                  <p className="mt-1 text-xs">
                    {post.publishedAt
                      ? formatFullTimestamp(post.publishedAt)
                      : "—"}
                  </p>
                </div>
              </div>

              {post.content ? (
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Content
                  </p>
                  <p className="mt-2 wrap-anywhere whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Media assets ({post.mediaAssets.length})
                </p>

                {post.mediaAssets.length > 0 ? (
                  <>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {post.mediaAssets.slice(0, 12).map((asset, index) => (
                        <a
                          key={`${asset}-${index}`}
                          href={asset}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900"
                          title="Open in a new tab"
                        >
                          <img
                            src={asset}
                            alt={`Post media ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-950/70 to-transparent px-2 py-2 text-[10px] font-semibold text-white">
                            <span>#{index + 1}</span>
                            <span className="truncate opacity-90">
                              {asset.split("/").at(-1)}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>

                    {post.mediaAssets.length > 12 ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        +{post.mediaAssets.length - 12} more assets not previewed
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    No media assets attached.
                  </p>
                )}
              </div>

              <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tags ({post.tags.length})
                  </p>
                  {post.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.slice(0, 8).map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex max-w-full rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 wrap-anywhere dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 8 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{post.tags.length - 8} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      None
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    User tags ({post.userTags.length})
                  </p>
                  {post.userTags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.userTags.slice(0, 8).map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex max-w-full rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 wrap-anywhere dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.userTags.length > 8 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{post.userTags.length - 8} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      None
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Liked by ({post.likedBy.length})
                  </p>
                  {post.likedBy.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.likedBy.slice(0, 6).map((value, index) => (
                        <span
                          key={`${value}-${index}`}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          title={value}
                        >
                          {shortenId(value, 8, 6)}
                        </span>
                      ))}
                      {post.likedBy.length > 6 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{post.likedBy.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      None
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Viewed by ({post.viewedBy.length})
                  </p>
                  {post.viewedBy.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.viewedBy.slice(0, 6).map((value, index) => (
                        <span
                          key={`${value}-${index}`}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          title={value}
                        >
                          {shortenId(value, 8, 6)}
                        </span>
                      ))}
                      {post.viewedBy.length > 6 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{post.viewedBy.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      None
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Comments ({post.comments.length})
                  </p>
                  {post.comments.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.comments.slice(0, 6).map((value, index) => (
                        <span
                          key={`${value}-${index}`}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          title={value}
                        >
                          {shortenId(value, 8, 6)}
                        </span>
                      ))}
                      {post.comments.length > 6 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{post.comments.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      None
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Visible to list if private ({post.visibleToListIfPrivate.length})
                  </p>
                  {post.visibleToListIfPrivate.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.visibleToListIfPrivate
                        .slice(0, 6)
                        .map((value, index) => (
                          <span
                            key={`${value}-${index}`}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            title={value}
                          >
                            {shortenId(value, 8, 6)}
                          </span>
                        ))}
                      {post.visibleToListIfPrivate.length > 6 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{post.visibleToListIfPrivate.length - 6} more
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      None
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Engagement
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {numberFormatter.format(post.viewCount)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {numberFormatter.format(post.likeCount)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {numberFormatter.format(post.commentCount)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5" />
                    {numberFormatter.format(post.shareCount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Post not found.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

