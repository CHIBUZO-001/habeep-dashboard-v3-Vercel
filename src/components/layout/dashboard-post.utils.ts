export type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

export function formatFullTimestamp(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateLabel(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function truncateText(value: string, maxLength = 160) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function shortenId(value: string, head = 6, tail = 4) {
  const normalized = value.trim();
  if (!normalized) {
    return "Unknown";
  }

  if (normalized.length <= head + tail + 1) {
    return normalized;
  }

  return `${normalized.slice(0, head)}…${normalized.slice(-tail)}`;
}

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  maxVisible = 7,
): PaginationItem[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (maxVisible <= 5) {
    if (currentPage <= 3) {
      return [1, 2, 3, "end-ellipsis", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "start-ellipsis", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "start-ellipsis", currentPage, "end-ellipsis", totalPages];
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

