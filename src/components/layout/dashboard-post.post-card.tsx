import {
  Eye,
  Flag,
  FlagOff,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Share2,
  ShieldCheck,
  ShieldX,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCircle2,
} from "lucide-react";

import { cn } from "../../lib/cn";
import { type PostListItem } from "../../services";
import {
  actionMenuItemClass,
  actionMenuLabelClass,
  compactNumberFormatter,
} from "./dashboard-post.constants";
import { formatDateLabel, shortenId, truncateText } from "./dashboard-post.utils";

export type PostCardProps = {
  post: PostListItem;
  isMenuOpen: boolean;
  statusUpdating: boolean;
  flagUpdating: boolean;
  promotionUpdating: boolean;
  deleteUpdating: boolean;
  onToggleMenu: () => void;
  onViewPost: (postId: string) => void | Promise<void>;
  onFlagPost: (post: PostListItem) => void | Promise<void>;
  onUnflagPost: (post: PostListItem) => void | Promise<void>;
  onSetStatus: (post: PostListItem, status: "published" | "draft") => void | Promise<void>;
  onPromotePost: (post: PostListItem) => void | Promise<void>;
  onUnpromotePost: (post: PostListItem) => void | Promise<void>;
  onDeletePost: (post: PostListItem) => void | Promise<void>;
};

export function PostCard({
  post,
  isMenuOpen,
  statusUpdating,
  flagUpdating,
  promotionUpdating,
  deleteUpdating,
  onToggleMenu,
  onViewPost,
  onFlagPost,
  onUnflagPost,
  onSetStatus,
  onPromotePost,
  onUnpromotePost,
  onDeletePost,
}: PostCardProps) {
  const headline = post.title
    ? truncateText(post.title, 96)
    : truncateText(post.content, 120) || "Untitled post";
  const body =
    post.title && post.content ? truncateText(post.content, 180) : "";
  const accentColor = post.color || "#3b82f6";
  const hasLocation = Boolean(post.location?.city || post.location?.state);
  const locationLabel = [post.location?.city, post.location?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <li
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-900/5 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/10 dark:border-slate-800/70 dark:bg-slate-950/40 dark:hover:border-blue-900/60 dark:hover:shadow-blue-950/30",
        isMenuOpen && "z-30",
      )}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <p
              className="min-w-0 wrap-anywhere text-sm font-semibold text-slate-900 dark:text-slate-100"
              title={post.title || post.content}
            >
              {headline}
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {post.type || "post"}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                post.isPublished
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
              )}
            >
              {post.isPublished ? "Published" : "Draft"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {post.visibility || "PUBLIC"}
            </span>
            {post.isFlagged ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                Flagged
              </span>
            ) : null}
            {post.isPromoted ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
                Promoted
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatDateLabel(
              post.publishedAt ||
                post.lastUpdatedAt ||
                post.updatedAt ||
                post.createdAt,
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span
            className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200"
            title={post.authorId || "Unknown author"}
          >
            <UserCircle2 className="h-4 w-4" />
            {shortenId(post.authorId)}
          </span>
          {hasLocation ? (
            <span
              className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200"
              title={locationLabel}
            >
              <MapPin className="h-4 w-4" />
              <span className="max-w-40 truncate">{locationLabel}</span>
            </span>
          ) : null}
        </div>
      </div>

      {body ? (
        <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 wrap-anywhere">
          {body}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-slate-500 dark:text-slate-300">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {compactNumberFormatter.format(post.viewCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {compactNumberFormatter.format(post.likeCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {compactNumberFormatter.format(post.commentCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {compactNumberFormatter.format(post.shareCount)}
          </span>
          {post.mediaAssets.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {post.mediaAssets.length}
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex items-end gap-2">
          {post.tags.length > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="max-w-28 truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  +{post.tags.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          <div
            data-post-menu-root={post.id}
            className={cn("relative shrink-0", isMenuOpen && "z-40")}
          >
            <button
              type="button"
              onClick={onToggleMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm shadow-slate-900/5 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label="Post actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {isMenuOpen ? (
              <div
                role="menu"
                className="absolute bottom-11 right-0 z-50 w-64 origin-bottom-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/15 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className={actionMenuLabelClass}>Actions</p>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onViewPost(post.id)}
                  className={actionMenuItemClass}
                >
                  <Eye className="h-4 w-4" />
                  View post
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onFlagPost(post)}
                  disabled={Boolean(post.isFlagged) || flagUpdating}
                  className={actionMenuItemClass}
                >
                  {flagUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4" />
                  )}
                  {post.isFlagged ? "Flagged" : "Flag post"}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onUnflagPost(post)}
                  disabled={!post.isFlagged || flagUpdating}
                  className={actionMenuItemClass}
                >
                  {flagUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FlagOff className="h-4 w-4" />
                  )}
                  Unflag post
                </button>

                <div className="my-2 h-px bg-slate-200/70 dark:bg-slate-800" />

                <p className={actionMenuLabelClass}>Status</p>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onSetStatus(post, "published")}
                  disabled={post.isPublished || statusUpdating}
                  className={cn(
                    actionMenuItemClass,
                    post.isPublished &&
                      "bg-slate-50 text-slate-500 hover:bg-slate-50 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:bg-slate-950/40",
                  )}
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
                  onClick={() => void onSetStatus(post, "draft")}
                  disabled={!post.isPublished || statusUpdating}
                  className={cn(
                    actionMenuItemClass,
                    !post.isPublished &&
                      "bg-slate-50 text-slate-500 hover:bg-slate-50 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:bg-slate-950/40",
                  )}
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
                  onClick={() => void onPromotePost(post)}
                  disabled={post.isPromoted === true || promotionUpdating}
                  className={actionMenuItemClass}
                >
                  {promotionUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {post.isPromoted ? "Promoted" : "Promote post"}
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onUnpromotePost(post)}
                  disabled={post.isPromoted === false || promotionUpdating}
                  className={actionMenuItemClass}
                >
                  {promotionUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  Unpromote post
                </button>

                <div className="my-2 h-px bg-slate-200/70 dark:bg-slate-800" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void onDeletePost(post)}
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
