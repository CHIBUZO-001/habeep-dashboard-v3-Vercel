import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { cn } from "../../lib/cn";
import { getApiErrorMessage } from "../../lib/http-client";
import {
  createAdminCalendarEvent,
  deleteAdminCalendarEvent,
  getAdminCalendarEvents,
  updateAdminCalendarEvent,
  type AdminCalendarEvent,
  type CreateAdminCalendarEventPayload,
  type UpdateAdminCalendarEventPayload,
} from "../../services";
import { useToast } from "../ui/toast-provider";

const surfaceCardClass =
  "rounded-2xl border border-slate-200/85 bg-white/90 p-4 shadow-sm shadow-slate-900/5 ring-1 ring-white/70 transition-colors dark:border-slate-800/80 dark:bg-slate-900/90 dark:ring-slate-800/80";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const timeFormatter = new Intl.DateTimeFormat("en-NG", {
  hour: "numeric",
  minute: "2-digit",
});

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function formatMonthLabel(value: Date) {
  return value.toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

function getMonthRangeUtcIso(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();

  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)).toISOString();
  const endDate = new Date(
    Date.UTC(year, month + 1, 0, 23, 59, 59, 999),
  ).toISOString();

  return { startDate, endDate };
}

function toDateKey(value: Date) {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
}

function isSameMonth(left: Date, month: Date) {
  return (
    left.getFullYear() === month.getFullYear() && left.getMonth() === month.getMonth()
  );
}

function createMonthGrid(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstOfMonth = new Date(year, monthIndex, 1);
  const weekday = firstOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const offset = (weekday + 6) % 7; // Monday = 0
  const gridStart = new Date(year, monthIndex, 1 - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(gridStart);
    next.setDate(gridStart.getDate() + index);
    return next;
  });
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoFromDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function formatEventTimeRange(event: AdminCalendarEvent) {
  if (event.allDay) {
    return "All day";
  }

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Time unavailable";
  }

  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
}

type CalendarEventFormState = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: string;
  color: string;
  attendees: string;
  location: string;
  taskId: string;
};

function buildDefaultCreateFormState(anchorDate: Date): CalendarEventFormState {
  const today = new Date();
  const isToday =
    anchorDate.getFullYear() === today.getFullYear() &&
    anchorDate.getMonth() === today.getMonth() &&
    anchorDate.getDate() === today.getDate();

  const start = isToday
    ? (() => {
        const next = new Date(today);
        const roundedMinutes = Math.ceil(next.getMinutes() / 15) * 15;
        next.setMinutes(roundedMinutes, 0, 0);

        // Ensure the suggested time is always in the future.
        if (next.getTime() <= today.getTime()) {
          next.setMinutes(next.getMinutes() + 15);
        }

        return next;
      })()
    : new Date(
        anchorDate.getFullYear(),
        anchorDate.getMonth(),
        anchorDate.getDate(),
        9,
        0,
        0,
        0,
      );

  const end = new Date(start);
  end.setHours(start.getHours() + 1);

  return {
    title: "",
    description: "",
    startDate: toDateTimeLocalValue(start.toISOString()),
    endDate: toDateTimeLocalValue(end.toISOString()),
    allDay: false,
    type: "meeting",
    color: "#3b82f6",
    attendees: "",
    location: "",
    taskId: "",
  };
}

function buildInitialEventFormState(event: AdminCalendarEvent): CalendarEventFormState {
  return {
    title: event.title ?? "",
    description: event.description ?? "",
    startDate: event.startDate ? toDateTimeLocalValue(event.startDate) : "",
    endDate: event.endDate ? toDateTimeLocalValue(event.endDate) : "",
    allDay: Boolean(event.allDay),
    type: event.type ?? "meeting",
    color: event.color ?? "#3b82f6",
    attendees: Array.isArray(event.attendees) ? event.attendees.join(", ") : "",
    location: event.location ?? "",
    taskId: event.taskId ?? "",
  };
}

function toAttendeeList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

type EventEditorMode = "create" | "edit";

type EventEditorModalProps = {
  mode: EventEditorMode;
  event: AdminCalendarEvent | null;
  anchorDate: Date;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CalendarEventFormState) => Promise<void>;
  onRequestDelete: (event: AdminCalendarEvent) => void;
};

function EventEditorModal({
  mode,
  event,
  anchorDate,
  isSubmitting,
  onClose,
  onSubmit,
  onRequestDelete,
}: EventEditorModalProps) {
  const [formState, setFormState] = useState<CalendarEventFormState | null>(() =>
    event ? buildInitialEventFormState(event) : buildDefaultCreateFormState(anchorDate),
  );

  if (!formState || typeof document === "undefined") {
    return null;
  }

  if (mode === "edit" && !event) {
    return null;
  }

  const heading = mode === "create" ? "Create event" : "Edit event";
  const submitLabel = mode === "create" ? "Create" : "Save changes";

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
            {mode === "edit" && event ? (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                ID: <span className="font-mono">{event.id}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Schedule a new calendar event.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close event editor"
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
                setFormState((previousState) =>
                  previousState
                    ? { ...previousState, title: event.target.value }
                    : previousState,
                )
              }
              required
              type="text"
              placeholder="Event title"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Type
              </span>
              <input
                value={formState.type}
                onChange={(event) =>
                  setFormState((previousState) =>
                    previousState
                      ? { ...previousState, type: event.target.value }
                      : previousState,
                  )
                }
                type="text"
                placeholder="meeting"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Location
              </span>
              <input
                value={formState.location}
                onChange={(event) =>
                  setFormState((previousState) =>
                    previousState
                      ? { ...previousState, location: event.target.value }
                      : previousState,
                  )
                }
                required
                type="text"
                placeholder="HQ Board Room"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Start
              </span>
              <input
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((previousState) =>
                    previousState
                      ? { ...previousState, startDate: event.target.value }
                      : previousState,
                  )
                }
                required
                type="datetime-local"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                End
              </span>
              <input
                value={formState.endDate}
                onChange={(event) =>
                  setFormState((previousState) =>
                    previousState
                      ? { ...previousState, endDate: event.target.value }
                      : previousState,
                  )
                }
                required
                type="datetime-local"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
            <label className="inline-flex items-center gap-2">
              <input
                checked={formState.allDay}
                onChange={(event) =>
                  setFormState((previousState) =>
                    previousState
                      ? { ...previousState, allDay: event.target.checked }
                      : previousState,
                  )
                }
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
              />
              All day
            </label>

            <label className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Color
              </span>
              <input
                value={formState.color}
                onChange={(event) =>
                  setFormState((previousState) =>
                    previousState
                      ? { ...previousState, color: event.target.value }
                      : previousState,
                  )
                }
                type="color"
                className="h-9 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Attendees
            </span>
            <input
              value={formState.attendees}
              onChange={(event) =>
                setFormState((previousState) =>
                  previousState
                    ? { ...previousState, attendees: event.target.value }
                    : previousState,
                )
              }
              required
              type="text"
              placeholder="admin1, admin2"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Task ID
            </span>
            <input
              value={formState.taskId}
              onChange={(event) =>
                setFormState((previousState) =>
                  previousState
                    ? { ...previousState, taskId: event.target.value }
                    : previousState,
                )
              }
              required
              type="text"
              placeholder="task_123"
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
                setFormState((previousState) =>
                  previousState
                    ? { ...previousState, description: event.target.value }
                    : previousState,
                )
              }
              required
              rows={3}
              placeholder="Monthly financial report review"
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            {mode === "edit" && event ? (
              <button
                type="button"
                onClick={() => onRequestDelete(event)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tip: Choose a color to organize by category.
              </span>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
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
                disabled={
                  isSubmitting ||
                  !formState.title.trim() ||
                  !formState.startDate.trim() ||
                  !formState.endDate.trim()
                }
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Saving..." : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDeleteEventModalProps = {
  event: AdminCalendarEvent | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

function ConfirmDeleteEventModal({
  event,
  isDeleting,
  onClose,
  onConfirm,
}: ConfirmDeleteEventModalProps) {
  if (!event || typeof document === "undefined") {
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
        aria-label="Delete event"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Delete event
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
              {event.title}
            </span>
            .
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

export function DashboardCalendar() {
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState(() => new Date());
  const [typeFilter, setTypeFilter] = useState("meeting");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EventEditorMode>("edit");
  const [createAnchorDate, setCreateAnchorDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<AdminCalendarEvent | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminCalendarEvent | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const loadEvents = useCallback(
    async (showErrorToast = false) => {
      const { startDate, endDate } = getMonthRangeUtcIso(activeMonth);
      const normalizedType = typeFilter.trim();

      setIsLoading(true);
      try {
        const nextEvents = await getAdminCalendarEvents({
          type: normalizedType && normalizedType !== "all" ? normalizedType : undefined,
          startDate,
          endDate,
          page,
          limit,
        });
        setEvents(nextEvents);
        setErrorMessage(null);
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          "Failed to load calendar events.",
        );
        setErrorMessage(message);
        if (showErrorToast) {
          toast({
            variant: "error",
            title: "Calendar unavailable",
            description: message,
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [activeMonth, limit, page, toast, typeFilter],
  );

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const monthGrid = useMemo(() => createMonthGrid(activeMonth), [activeMonth]);
  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return events;
    }

    return events.filter((event) => {
      const searchable = [
        event.title,
        event.description,
        event.type,
        event.location,
        event.taskId,
        (event.attendees ?? []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [events, searchQuery]);

  const sortedEvents = useMemo(() => {
    return filteredEvents.slice().sort((leftEvent, rightEvent) => {
      const leftTime = new Date(leftEvent.startDate).getTime();
      const rightTime = new Date(rightEvent.startDate).getTime();

      if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
        return leftEvent.title.localeCompare(rightEvent.title);
      }

      return leftTime - rightTime;
    });
  }, [filteredEvents]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, AdminCalendarEvent[]>();

    for (const event of sortedEvents) {
      const start = new Date(event.startDate);
      if (Number.isNaN(start.getTime())) {
        continue;
      }
      const key = toDateKey(start);
      const bucket = map.get(key) ?? [];
      bucket.push(event);
      map.set(key, bucket);
    }

    return map;
  }, [sortedEvents]);

  const openCreateModal = (anchorDate?: Date) => {
    const today = new Date();
    const fallbackAnchorDate =
      today.getFullYear() === activeMonth.getFullYear() &&
      today.getMonth() === activeMonth.getMonth()
        ? today
        : new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);

    setEditorMode("create");
    setSelectedEvent(null);
    setCreateAnchorDate(anchorDate ?? fallbackAnchorDate);
    setEditorOpen(true);
  };

  const openEditor = (event: AdminCalendarEvent) => {
    setEditorMode("edit");
    setSelectedEvent(event);
    setEditorOpen(true);
  };

  const closeEditor = (force = false) => {
    if (isSubmitting && !force) {
      return;
    }
    setEditorOpen(false);
    setSelectedEvent(null);
  };

  const buildEventPayload = (values: CalendarEventFormState) => {
    const title = values.title.trim();
    if (!title) {
      return { error: "Title is required." } as const;
    }

    const description = values.description.trim();
    if (!description) {
      return { error: "Description is required." } as const;
    }

    const location = values.location.trim();
    if (!location) {
      return { error: "Location is required." } as const;
    }

    const taskId = values.taskId.trim();
    if (!taskId) {
      return { error: "Task ID is required." } as const;
    }

    const attendees = toAttendeeList(values.attendees);
    if (attendees.length === 0) {
      return { error: "Add at least one attendee." } as const;
    }

    const startDate = toIsoFromDateTimeLocal(values.startDate);
    const endDate = toIsoFromDateTimeLocal(values.endDate);

    if (!startDate || !endDate) {
      return { error: "Start and end dates are required." } as const;
    }

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();
    if (
      Number.isNaN(startTimestamp) ||
      Number.isNaN(endTimestamp) ||
      endTimestamp <= startTimestamp
    ) {
      return { error: "End time must be after start time." } as const;
    }

    const payload: CreateAdminCalendarEventPayload = {
      title,
      description,
      location,
      taskId,
      attendees,
      type: values.type.trim() || "meeting",
      color: values.color.trim() || "#3b82f6",
      allDay: Boolean(values.allDay),
      startDate,
      endDate,
    };

    return { payload } as const;
  };

  const handleSaveEvent = async (values: CalendarEventFormState) => {
    const buildResult = buildEventPayload(values);
    if ("error" in buildResult) {
      toast({
        variant: "error",
        title: "Invalid event",
        description: buildResult.error,
      });
      return;
    }

    const payload = buildResult.payload;

    setIsSubmitting(true);

    try {
      if (editorMode === "create") {
        const created = await createAdminCalendarEvent(payload);
        if (!created) {
          throw new Error("Create did not return the created event.");
        }

        setEvents((currentEvents) => [...currentEvents, created]);
        toast({
          variant: "success",
          title: "Event created",
          description: created.title
            ? `Created "${created.title}".`
            : "Event created successfully.",
        });
        closeEditor(true);
      } else if (selectedEvent) {
        const updated = await updateAdminCalendarEvent(
          selectedEvent.id,
          payload as UpdateAdminCalendarEventPayload,
        );
        if (!updated) {
          throw new Error("Update did not return the updated event.");
        }

        setEvents((currentEvents) =>
          currentEvents.map((currentEvent) =>
            currentEvent.id === updated.id ? updated : currentEvent,
          ),
        );

        toast({
          variant: "success",
          title: "Event updated",
          description: updated.title
            ? `Saved "${updated.title}".`
            : "Event updated successfully.",
        });
        closeEditor(true);
      }
    } catch (error) {
      toast({
        variant: "error",
        title: editorMode === "create" ? "Create failed" : "Update failed",
        description: getApiErrorMessage(
          error,
          editorMode === "create"
            ? "Could not create the event."
            : "Could not update the event.",
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
      await deleteAdminCalendarEvent(deleteTarget.id);
      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== deleteTarget.id),
      );
      toast({
        variant: "success",
        title: "Event deleted",
        description: deleteTarget.title
          ? `Deleted "${deleteTarget.title}".`
          : "Event deleted successfully.",
      });
      setDeleteTarget(null);
      closeEditor(true);
    } catch (error) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: getApiErrorMessage(error, "Could not delete the event."),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <section className={surfaceCardClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                Calendar unavailable
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadEvents(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Retry
            </button>
          </div>
        </section>
      ) : null}

      <section className={cn(surfaceCardClass, "relative overflow-hidden")}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/15" />
        <div className="pointer-events-none absolute -left-24 -bottom-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/15" />

        <div className="relative z-10">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Calendar
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Derived from{" "}
                <span className="font-mono">/api/admin/calendar/events</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-900/25 transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                New event
              </button>

              <button
                type="button"
                onClick={() => void loadEvents(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
                Refresh
              </button>
            </div>
          </header>

          <div className="mt-4 grid gap-3 lg:grid-cols-[auto_1fr_auto_auto]">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setActiveMonth(
                    (previous) =>
                      new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
                  );
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                {formatMonthLabel(activeMonth)}
              </span>

              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setActiveMonth(
                    (previous) =>
                      new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
                  );
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                type="text"
                placeholder="Search events, attendees, locations..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500"
              />
            </label>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
              <Filter className="h-4 w-4" />
              <input
                value={typeFilter}
                onChange={(event) => {
                  setPage(1);
                  setTypeFilter(event.target.value);
                }}
                type="text"
                placeholder="meeting"
                className="w-28 rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
              />
            </label>

            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors focus-within:border-blue-400 focus-within:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus-within:border-blue-500 dark:focus-within:bg-blue-950/20">
              <span className="text-xs font-semibold uppercase tracking-wide">
                Limit
              </span>
              <select
                value={limit}
                onChange={(event) => {
                  setPage(1);
                  setLimit(Number(event.target.value));
                }}
                className="rounded-md bg-slate-50 px-2 py-1 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus:bg-white dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>

	          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white/95 via-white/90 to-slate-50/80 p-3 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:from-slate-950/60 dark:via-slate-950/50 dark:to-slate-950/30">
	            <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:gap-2">
	              {weekdayLabels.map((label) => (
	                <div
	                  key={label}
	                  className="rounded-lg bg-slate-50/80 px-1.5 py-1 text-center text-[10px] font-semibold text-slate-500 shadow-inner dark:bg-slate-900/70 dark:text-slate-300 sm:px-2 sm:text-[11px]"
	                >
	                  {label}
	                </div>
	              ))}
	            </div>

	            <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
	              {monthGrid.map((day) => {
	                const dateKey = toDateKey(day);
	                const dayEvents = eventsByDate.get(dateKey) ?? [];
	                const currentMonth = isSameMonth(day, activeMonth);
	                const isToday = dateKey === todayKey;
	                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

	                return (
	                  <div
	                    key={dateKey}
	                    className={cn(
	                      "aspect-square min-h-0 rounded-xl border border-slate-200/80 bg-white/80 p-1 shadow-sm shadow-slate-900/5 transition-colors dark:border-slate-800/70 dark:bg-slate-950/40 sm:aspect-auto sm:min-h-[6.75rem] sm:rounded-2xl sm:p-2",
	                      !currentMonth &&
	                        "border-slate-200/60 bg-slate-50/40 text-slate-500 dark:border-slate-800/50 dark:bg-slate-950/25",
	                      currentMonth &&
	                        isWeekend &&
	                        "bg-amber-50/40 dark:bg-amber-950/10",
                      isToday &&
                        "ring-2 ring-blue-500/40 ring-offset-1 ring-offset-white dark:ring-blue-400/40 dark:ring-offset-slate-950",
                    )}
                  >
		                    <div className="grid grid-cols-3 items-center gap-1 md:mt-0 mt-2 sm:gap-2">
		                      <div className="col-start-2 flex items-center justify-center gap-1 sm:col-start-1 sm:justify-start sm:gap-2">
		                        <span
		                          className={cn(
		                            "text-xs font-semibold",
	                            isToday
	                              ? "text-blue-600 dark:text-blue-400"
	                              : "text-slate-700 dark:text-slate-200",
	                          )}
	                        >
	                          {day.getDate()}
	                        </span>
	                        {isToday ? (
	                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
	                        ) : null}
	                      </div>
		                      {dayEvents.length > 0 ? (
		                        <span className="col-start-3 justify-self-end rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
		                          {dayEvents.length}
		                        </span>
		                      ) : null}
		                      {dayEvents.length > 0 ? (
		                        <div className="col-start-2 row-start-2 flex flex-wrap items-center justify-center gap-1 sm:hidden">
		                          {dayEvents.slice(0, 6).map((event) => (
		                            <span
		                              key={event.id}
		                              className="inline-flex h-[5px] w-[5px] rounded-full"
		                              style={{
		                                backgroundColor: event.color || "#3b82f6",
		                              }}
		                            />
		                          ))}
		                          {dayEvents.length > 6 ? (
		                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300">
		                              +{dayEvents.length - 6}
		                            </span>
		                          ) : null}
		                        </div>
		                      ) : null}
		                    </div>

		                    <div className="mt-2 hidden space-y-1 sm:block">
		                      {dayEvents.slice(0, 3).map((event) => (
		                        <button
		                          key={event.id}
		                          type="button"
		                          onClick={() => openEditor(event)}
		                          className="group w-full rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-left text-[11px] font-medium text-slate-700 shadow-sm shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
		                          style={{
		                            borderLeftWidth: 4,
		                            borderLeftColor: event.color || "#3b82f6",
		                          }}
		                          title={event.title}
		                        >
		                          <span className="flex items-center gap-2">
		                            <span
		                              className="inline-flex h-2 w-2 rounded-full"
		                              style={{
		                                backgroundColor: event.color || "#3b82f6",
		                              }}
		                            />
		                            <span className="block truncate">{event.title}</span>
		                          </span>
		                          <span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-300">
		                            {formatEventTimeRange(event)}
		                          </span>
		                        </button>
		                      ))}

		                      {dayEvents.length > 3 ? (
		                        <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
		                          +{dayEvents.length - 3} more
		                        </span>
		                      ) : null}
		                    </div>
		                  </div>
		                );
		              })}
	            </div>
	          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span>
              Showing {filteredEvents.length} event
              {filteredEvents.length === 1 ? "" : "s"}
              {searchQuery.trim() ? " (filtered)" : ""}.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Prev
              </button>
              <span className="text-xs font-semibold">Page {page}</span>
              <button
                type="button"
                onClick={() => setPage((previous) => previous + 1)}
                disabled={isLoading || events.length < limit}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                title={
                  events.length < limit
                    ? "No more events on the next page."
                    : "Load next page."
                }
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {editorOpen ? (
        <EventEditorModal
          key={`${editorMode}:${selectedEvent?.id ?? createAnchorDate.getTime()}`}
          mode={editorMode}
          event={selectedEvent}
          anchorDate={createAnchorDate}
          isSubmitting={isSubmitting}
          onClose={closeEditor}
          onSubmit={handleSaveEvent}
          onRequestDelete={(event) => {
            if (!isSubmitting) {
              setDeleteTarget(event);
            }
          }}
        />
      ) : null}

      <ConfirmDeleteEventModal
        event={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      {sortedEvents.length > 0 ? (
        <section className={cn(surfaceCardClass, "bg-gradient-to-b from-white/95 via-white/90 to-slate-50/80 dark:from-slate-950/60 dark:via-slate-950/50 dark:to-slate-950/30")}>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Events
          </h3>
          <ul className="mt-3 space-y-2">
            {sortedEvents.slice(0, 10).map((event) => (
              <li
                key={event.id}
                className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-900/5 dark:border-slate-800/70 dark:bg-slate-950/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: event.color || "#3b82f6" }}
                      />
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {event.title}
                      </p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {event.type || "event"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatEventTimeRange(event)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditor(event)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: event.color || "#3b82f6",
                    }}
                  >
                    View / Edit
                  </button>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-slate-500 dark:text-slate-300 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{event.location || "No location"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {event.attendees?.length
                        ? event.attendees.join(", ")
                        : "No attendees"}
                    </span>
                  </div>
                </div>

                {event.description ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-300 wrap-anywhere">
                    {event.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
          {sortedEvents.length > 10 ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Showing 10 of {sortedEvents.length} events. Use search or pagination to
              narrow results.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
