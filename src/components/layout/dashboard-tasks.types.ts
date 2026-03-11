import type { AdminTaskPriority, AdminTaskStatus } from "../../services";

export type StatusFilter = "all" | AdminTaskStatus;
export type PriorityFilter = "all" | AdminTaskPriority;

export type TaskEditorMode = "create" | "edit";

export type TaskFormState = {
  title: string;
  description: string;
  status: AdminTaskStatus;
  priority: AdminTaskPriority;
  assigneeName: string;
  assigneeId: string;
  dueDate: string;
  category: string;
  tags: string;
};

