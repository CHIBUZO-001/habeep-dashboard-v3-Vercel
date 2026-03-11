import type { AdminTask, AdminTaskPriority, AdminTaskStatus } from "../../services";

import { DEFAULT_TASK_PRIORITY, DEFAULT_TASK_STATUS } from "./dashboard-tasks.constants";
import type { TaskFormState } from "./dashboard-tasks.types";

export function normalizeTaskStatus(value: AdminTaskStatus): AdminTaskStatus {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "done") {
    return "completed";
  }

  if (normalized === "in progress" || normalized === "in-progress") {
    return "in_progress";
  }

  return value;
}

export function parseTime(value: string | null) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 0;
  }
  return timestamp;
}

export function formatDate(value: string | null) {
  const timestamp = parseTime(value);
  if (timestamp === 0) {
    return "N/A";
  }

  return new Date(timestamp).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLabel(value: string) {
  const normalized = value.replace(/[_-]+/g, " ").trim();
  if (!normalized) {
    return "Unknown";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getStatusBadgeClasses(status: string) {
  const normalized = status.trim().toLowerCase();

  if (normalized === "done" || normalized === "completed") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (normalized === "in_progress" || normalized === "in progress") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";
  }

  if (normalized === "todo" || normalized === "pending") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

export function getPriorityBadgeClasses(priority: string) {
  const normalized = priority.trim().toLowerCase();

  if (normalized === "high" || normalized === "urgent") {
    return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300";
  }

  if (normalized === "medium" || normalized === "normal") {
    return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300";
  }

  if (normalized === "low") {
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

export function buildInitialFormState(task: AdminTask | null): TaskFormState {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: normalizeTaskStatus(
      (task?.status ?? DEFAULT_TASK_STATUS) as AdminTaskStatus,
    ),
    priority: (task?.priority ?? DEFAULT_TASK_PRIORITY) as AdminTaskPriority,
    assigneeName: task?.assigneeName ?? "",
    assigneeId: task?.assigneeId ?? "",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    category: task?.category ?? "",
    tags: task?.tags?.length ? task.tags.join(", ") : "",
  };
}

export function toTagList(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function toIsoStartOfDay(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  return `${normalized}T00:00:00.000Z`;
}

export function isTaskDone(task: AdminTask) {
  const normalized = task.status.trim().toLowerCase();
  return normalized === "done" || normalized === "completed";
}

export function isTaskOverdue(task: AdminTask) {
  if (!task.dueDate || isTaskDone(task)) {
    return false;
  }

  const due = parseTime(task.dueDate);
  if (due === 0) {
    return false;
  }

  return due < Date.now();
}
