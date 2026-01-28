import type { AdaptiveCardOptions } from "./types";

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Check if a string is a valid URL.
 */
export function isUrl(str: string): boolean {
  return URL_REGEX.test(str);
}

/**
 * Check if a string is an image URL based on file extension.
 */
export function isImageUrl(str: string): boolean {
  if (!isUrl(str)) return false;
  try {
    const pathname = new URL(str).pathname;
    return IMAGE_EXTENSIONS.test(pathname);
  } catch {
    return IMAGE_EXTENSIONS.test(str);
  }
}

/**
 * Check if a string is an ISO 8601 date.
 */
export function isIsoDate(str: string): boolean {
  if (!ISO_DATE_REGEX.test(str)) return false;
  const date = new Date(str);
  return !isNaN(date.getTime());
}

/**
 * Format a value for display as a string.
 */
export function formatValue(val: unknown, options?: AdaptiveCardOptions): string {
  if (val === null) return "(null)";
  if (val === undefined) return "(undefined)";

  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  if (typeof val === "number") {
    if (Number.isInteger(val)) return val.toString();
    return val.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }

  if (typeof val === "string") {
    if (isIsoDate(val)) {
      try {
        const date = new Date(val);
        return date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          ...(val.includes("T")
            ? { hour: "2-digit", minute: "2-digit" }
            : {}),
        });
      } catch {
        return val;
      }
    }
    return val;
  }

  if (typeof val === "object") {
    return JSON.stringify(val);
  }

  return String(val);
}

/**
 * Truncate a string to a maximum length, appending ellipsis if needed.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

/**
 * Infer column widths based on content for table layout.
 */
export function inferColumnWidths(
  rows: Record<string, unknown>[],
  keys: string[]
): string[] {
  if (keys.length === 0) return [];

  const maxLengths = keys.map((key) => {
    let max = key.length;
    for (const row of rows) {
      const val = String(row[key] ?? "");
      if (val.length > max) max = val.length;
    }
    return max;
  });

  const total = maxLengths.reduce((sum, l) => sum + l, 0);
  if (total === 0) return keys.map(() => "stretch");

  return maxLengths.map((len) => {
    const weight = Math.max(1, Math.round((len / total) * 100));
    return String(weight);
  });
}

/**
 * Check if an array of objects is homogeneous (all have the same keys).
 */
export function isHomogeneousArray(arr: unknown[]): boolean {
  if (arr.length === 0) return false;

  const objects = arr.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  );

  if (objects.length !== arr.length) return false;
  if (objects.length < 2) return objects.length === 1;

  const referenceKeys = Object.keys(objects[0]).sort().join(",");
  return objects.every(
    (obj) => Object.keys(obj).sort().join(",") === referenceKeys
  );
}
