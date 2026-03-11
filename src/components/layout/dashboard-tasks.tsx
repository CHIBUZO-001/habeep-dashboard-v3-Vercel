import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "../../lib/cn";
import {
  CalendarDays,
  Filter,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Unlock,
  UserCircle2,
} from "lucide-react";
import { getApiErrorMessage } from "../../lib/http-client";
import {
  createAdminTask,
  deleteAdminTask,
  getAdminTasks,
  lockAdminTask,
  unlockAdminTask,
  updateAdminTask,
  type AdminTask,
  type CreateAdminTaskPayload,
  type UpdateAdminTaskPayload,
} from "../../services";
import { useToast } from "../ui/toast-provider";
import {
  ConfirmDeleteModal,
  TaskEditorModal,
} from "./dashboard-tasks.modals";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "./dashboard-tasks.constants";
import type {
  PriorityFilter,
  StatusFilter,
  TaskEditorMode,
  TaskFormState,
} from "./dashboard-tasks.types";
import {
  formatDate,
  formatLabel,
  getPriorityBadgeClasses,
  getStatusBadgeClasses,
  isTaskOverdue,
  normalizeTaskStatus,
  parseTime,
  toIsoStartOfDay,
  toTagList,
} from "./dashboard-tasks.utils";

const numberFormatter = new Intl.NumberFormat("en-NG");

const surfaceCardClass =
  "rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80";

export function DashboardTasks() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<TaskEditorMode>("create");
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminTask | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lockToggling, setLockToggling] = useState<Record<string, boolean>>(
    {},
  );
  const { toast } = useToast();

  const loadTasks = useCallback(
    async (showErrorToast = false) => {
      setIsLoading(true);
      try {
        const nextTasks = await getAdminTasks();
        setTasks(nextTasks);
        setErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(error, "Failed to load tasks.");
        setErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Tasks unavailable",
            description: message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const summary = useMemo(() => {
    const totals = {
      total: tasks.length,
      todo: 0,
      inProgress: 0,
      done: 0,
      overdue: 0,
    };

    for (const task of tasks) {
      const normalized = task.status.trim().toLowerCase();
      if (normalized === "done" || normalized === "completed") {
        totals.done += 1;
      } else if (normalized === "in_progress" || normalized === "in progress") {
        totals.inProgress += 1;
      } else {
        totals.todo += 1;
      }

      if (isTaskOverdue(task)) {
        totals.overdue += 1;
      }
    }

    return totals;
  }, [tasks]);

  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    for (const option of TASK_STATUS_OPTIONS) {
      statuses.add(String(option));
    }
    for (const task of tasks) {
      if (task.status.trim()) {
        statuses.add(task.status.trim());
      }
    }
    return Array.from(statuses).sort((leftStatus, rightStatus) =>
      leftStatus.localeCompare(rightStatus),
    );
  }, [tasks]);

  const availablePriorities = useMemo(() => {
    const priorities = new Set<string>();
    for (const option of TASK_PRIORITY_OPTIONS) {
      priorities.add(String(option));
    }
    for (const task of tasks) {
      if (task.priority.trim()) {
        priorities.add(task.priority.trim());
      }
    }
    return Array.from(priorities).sort((leftPriority, rightPriority) =>
      leftPriority.localeCompare(rightPriority),
    );
  }, [tasks]);

  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    for (const task of tasks) {
      if (task.category.trim()) {
        categories.add(task.category.trim());
      }
    }
    return Array.from(categories).sort((leftCategory, rightCategory) =>
      leftCategory.localeCompare(rightCategory),
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      if (categoryFilter !== "all" && task.category !== categoryFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.assigneeName,
        task.assigneeId,
        task.category,
        task.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [categoryFilter, priorityFilter, searchQuery, statusFilter, tasks]);

  const sortedTasks = useMemo(() => {
    return filteredTasks.slice().sort((leftTask, rightTask) => {
      const leftDue = parseTime(leftTask.dueDate);
      const rightDue = parseTime(rightTask.dueDate);

      if (leftDue === 0 && rightDue === 0) {
        return leftTask.title.localeCompare(rightTask.title);
      }

      if (leftDue === 0) {
        return 1;
      }

      if (rightDue === 0) {
        return -1;
      }

      return leftDue - rightDue;
    });
  }, [filteredTasks]);

  const openCreateModal = () => {
    setEditorMode("create");
    setSelectedTask(null);
    setEditorOpen(true);
  };

  const openEditModal = (task: AdminTask) => {
    setEditorMode("edit");
    setSelectedTask(task);
    setEditorOpen(true);
  };

  const closeEditor = (force = false) => {
    if (isSubmitting && !force) {
      return;
    }
    setEditorOpen(false);
    setSelectedTask(null);
  };

  const handleSaveTask = async (values: TaskFormState) => {
    const title = values.title.trim();
    if (!title) {
      return;
    }

    const payloadBase: CreateAdminTaskPayload = {
      title,
      description: values.description.trim() || undefined,
      status: normalizeTaskStatus(values.status),
      priority: values.priority,
      assigneeId: values.assigneeId.trim() || undefined,
      assigneeName: values.assigneeName.trim() || undefined,
      dueDate: toIsoStartOfDay(values.dueDate),
      tags: toTagList(values.tags),
      category: values.category.trim() || undefined,
    };

    setIsSubmitting(true);

    try {
      if (editorMode === "create") {
        const createdTask = await createAdminTask(payloadBase);
        toast({
          variant: "success",
          title: "Task created",
          description: createdTask?.title
            ? `Added "${createdTask.title}".`
            : "Task was added successfully.",
        });
      } else if (selectedTask) {
        const updatePayload: UpdateAdminTaskPayload = payloadBase;
        const updatedTask = await updateAdminTask(
          selectedTask.id,
          updatePayload,
        );
        toast({
          variant: "success",
          title: "Task updated",
          description: updatedTask?.title
            ? `Updated "${updatedTask.title}".`
            : "Task was updated successfully.",
        });
      }

      closeEditor(true);
      await loadTasks();
    } catch (error) {
      toast({
        variant: "error",
        title: "Task update failed",
        description: getApiErrorMessage(
          error,
          "Could not save the task changes.",
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAdminTask(deleteTarget.id);
      toast({
        variant: "success",
        title: "Task deleted",
        description: `Removed "${deleteTarget.title}".`,
      });
      setDeleteTarget(null);
      await loadTasks();
    } catch (error) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: getApiErrorMessage(error, "Could not delete the task."),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTaskLock = async (task: AdminTask) => {
    if (lockToggling[task.id]) {
      return;
    }

    setLockToggling((current) => ({
      ...current,
      [task.id]: true,
    }));

    try {
      const nextLockState = task.isLocked
        ? await unlockAdminTask(task.id)
        : await lockAdminTask(task.id);

      if (nextLockState) {
        setTasks((currentTasks) =>
          currentTasks.map((currentTask) =>
            currentTask.id === task.id
              ? {
                  ...currentTask,
                  isLocked: nextLockState.isLocked,
                  updatedAt: nextLockState.updatedAt || currentTask.updatedAt,
                }
              : currentTask,
          ),
        );
      } else {
        await loadTasks();
      }

      toast({
        variant: "success",
        title: task.isLocked ? "Task unlocked" : "Task locked",
        description: task.title
          ? `${task.isLocked ? "Unlocked" : "Locked"} "${task.title}".`
          : "Updated task lock status.",
      });
    } catch (error) {
      toast({
        variant: "error",
        title: "Update failed",
        description: getApiErrorMessage(
          error,
          "Could not update the task lock status.",
        ),
      });
    } finally {
      setLockToggling((current) => {
        if (!current[task.id]) {
          return current;
        }

        const next = { ...current };
        delete next[task.id];
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <section className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                Tasks unavailable
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadTasks(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Total Tasks
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {numberFormatter.format(summary.total)}
          </p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Todo</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-300">
            {numberFormatter.format(summary.todo)}
          </p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            In progress
          </p>
          <p className="mt-2 text-2xl font-semibold text-blue-600 dark:text-blue-300">
            {numberFormatter.format(summary.inProgress)}
          </p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Done</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
            {numberFormatter.format(summary.done)}
          </p>
        </article>
        <article className={surfaceCardClass}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
            {numberFormatter.format(summary.overdue)}
          </p>
        </article>
      </section>

      <section className={surfaceCardClass}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tasks
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Derived from <span className="font-mono">/api/admin/tasks</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New task
            </button>
            <button
              type="button"
              onClick={() => void loadTasks(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
              Refresh
            </button>
          </div>
        </header>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              type="text"
              placeholder="Search tasks, tags, categories..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
            <Filter className="h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            >
              <option value="all">All Statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
            <Tag className="h-4 w-4" />
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as PriorityFilter)
              }
              className="rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            >
              <option value="all">All Priorities</option>
              {availablePriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatLabel(priority)}
                </option>
              ))}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
            <CalendarDays className="h-4 w-4" />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isLoading ? "Loading tasks..." : "No tasks matched your filters."}
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {sortedTasks.map((task) => {
              const overdue = isTaskOverdue(task);
              const isTogglingLock = Boolean(lockToggling[task.id]);

              return (
                <li
                  key={task.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="space-y-2">
                    <p className="min-w-0 text-sm font-semibold text-slate-900 wrap-anywhere dark:text-slate-100">
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                          getStatusBadgeClasses(task.status),
                        )}
                      >
                        {formatLabel(task.status)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
                          getPriorityBadgeClasses(task.priority),
                        )}
                      >
                        {formatLabel(task.priority)}
                      </span>
                    </div>
                  </div>

                  {task.description ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 wrap-anywhere">
                      {task.description}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1">
                        <UserCircle2 className="h-3.5 w-3.5" />
                        Assignee
                      </span>
                      <span className="text-right text-slate-700 dark:text-slate-200">
                        {task.assigneeName || task.assigneeId || "Unassigned"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Due
                      </span>
                      <span
                        className={cn(
                          "text-right",
                          overdue &&
                            "font-semibold text-rose-600 dark:text-rose-300",
                          !overdue && "text-slate-700 dark:text-slate-200",
                        )}
                      >
                        {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        Category
                      </span>
                      <span className="text-right text-slate-700 dark:text-slate-200">
                        {task.category || "—"}
                      </span>
                    </div>
                  </div>

                  {task.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {task.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex max-w-full rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 wrap-anywhere dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {task.tags.length > 4 ? (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          +{numberFormatter.format(task.tags.length - 4)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleTaskLock(task)}
                      disabled={isTogglingLock}
                      aria-label={task.isLocked ? "Unlock task" : "Lock task"}
                      title={task.isLocked ? "Click to unlock" : "Click to lock"}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
                        task.isLocked
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/70"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
                      )}
                    >
                      {isTogglingLock ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : task.isLocked ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                      {task.isLocked ? "Locked" : "Unlocked"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        disabled={task.isLocked}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(task)}
                        disabled={task.isLocked}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editorOpen ? (
        <TaskEditorModal
          mode={editorMode}
          task={selectedTask}
          isSubmitting={isSubmitting}
          onClose={closeEditor}
          onSubmit={handleSaveTask}
        />
      ) : null}

      <ConfirmDeleteModal
        task={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
