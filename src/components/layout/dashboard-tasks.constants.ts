import type { AdminTaskPriority, AdminTaskStatus } from "../../services";

export const DEFAULT_TASK_STATUS: AdminTaskStatus = "todo";
export const DEFAULT_TASK_PRIORITY: AdminTaskPriority = "medium";

export const TASK_STATUS_OPTIONS: AdminTaskStatus[] = [
  "todo",
  "in_progress",
  "completed",
];

export const TASK_PRIORITY_OPTIONS: AdminTaskPriority[] = ["low", "medium", "high"];

