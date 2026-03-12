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

export function stripMarkdown(value: string) {
  if (!value) {
    return "";
  }

  return (
    value
      // Images: ![alt](url)
      .replace(/!\[[^\]]*]\([^)]*\)/g, "")
      // Links: [text](url) -> text
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      // Blockquotes / headings markers
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      // Inline formatting characters
      .replace(/[*_~`]+/g, "")
      // Extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
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

