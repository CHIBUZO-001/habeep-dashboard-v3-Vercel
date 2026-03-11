import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type {
  AdminTask,
  AdminTaskPriority,
  AdminTaskStatus,
} from "../../services";

import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "./dashboard-tasks.constants";
import { buildInitialFormState, formatLabel } from "./dashboard-tasks.utils";
import type { TaskEditorMode, TaskFormState } from "./dashboard-tasks.types";

type TaskEditorModalProps = {
  mode: TaskEditorMode;
  task: AdminTask | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormState) => Promise<void>;
};

export function TaskEditorModal({
  mode,
  task,
  isSubmitting,
  onClose,
  onSubmit,
}: TaskEditorModalProps) {
  const [formState, setFormState] = useState<TaskFormState>(() =>
    buildInitialFormState(task),
  );

  if (typeof document === "undefined") {
    return null;
  }

  const heading = mode === "create" ? "Create task" : "Edit task";
  const submitLabel = mode === "create" ? "Create" : "Save";

  return createPortal(
    <div className="fixed inset-0 z-80 flex items-start justify-center p-2 sm:p-6">
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-1 mt-4 flex max-h-[calc(90dvh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:mt-8 sm:w-[min(96vw,46rem)]"
        role="dialog"
        aria-modal="true"
        aria-label={heading}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
              {heading}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {mode === "create"
                ? "Add a new task to the queue."
                : "Update task details and assignment."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close task editor"
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
              placeholder="Short task title"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Description
            </span>
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((previousState) => ({
                  ...previousState,
                  description: event.target.value,
                }))
              }
              rows={3}
              placeholder="Optional details"
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
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
                    status: event.target.value as AdminTaskStatus,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              >
                {TASK_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(String(option))}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Priority
              </span>
              <select
                value={formState.priority}
                onChange={(event) =>
                  setFormState((previousState) => ({
                    ...previousState,
                    priority: event.target.value as AdminTaskPriority,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              >
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(String(option))}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Assignee Name
              </span>
              <input
                value={formState.assigneeName}
                onChange={(event) =>
                  setFormState((previousState) => ({
                    ...previousState,
                    assigneeName: event.target.value,
                  }))
                }
                type="text"
                placeholder="Jane Admin"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Assignee ID
              </span>
              <input
                value={formState.assigneeId}
                onChange={(event) =>
                  setFormState((previousState) => ({
                    ...previousState,
                    assigneeId: event.target.value,
                  }))
                }
                type="text"
                placeholder="admin2"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Due Date
              </span>
              <input
                value={formState.dueDate}
                onChange={(event) =>
                  setFormState((previousState) => ({
                    ...previousState,
                    dueDate: event.target.value,
                  }))
                }
                type="date"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Category
              </span>
              <input
                value={formState.category}
                onChange={(event) =>
                  setFormState((previousState) => ({
                    ...previousState,
                    category: event.target.value,
                  }))
                }
                type="text"
                placeholder="Development"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tags
            </span>
            <input
              value={formState.tags}
              onChange={(event) =>
                setFormState((previousState) => ({
                  ...previousState,
                  tags: event.target.value,
                }))
              }
              type="text"
              placeholder="development, verification"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
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
              disabled={isSubmitting || !formState.title.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDeleteModalProps = {
  task: AdminTask | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmDeleteModal({
  task,
  isDeleting,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  if (!task || typeof document === "undefined") {
    return null;
  }

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
        aria-label="Delete task"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Delete task
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
            You are about to permanently delete{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {task.title}
            </span>
            .
          </p>
          {task.isLocked ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              This task is locked. Delete might be rejected by the API.
            </p>
          ) : null}
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
