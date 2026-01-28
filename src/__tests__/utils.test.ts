import { describe, it, expect } from "vitest";
import {
  isUrl,
  isImageUrl,
  isIsoDate,
  formatValue,
  truncate,
  isHomogeneousArray,
  inferColumnWidths,
} from "../utils";

describe("isUrl", () => {
  it("should return true for valid HTTP URLs", () => {
    expect(isUrl("http://example.com")).toBe(true);
    expect(isUrl("https://example.com/path?q=1")).toBe(true);
    expect(isUrl("https://sub.domain.co.uk/page")).toBe(true);
  });

  it("should return false for non-URLs", () => {
    expect(isUrl("hello world")).toBe(false);
    expect(isUrl("not a url")).toBe(false);
    expect(isUrl("ftp://files.example.com")).toBe(false);
    expect(isUrl("")).toBe(false);
    expect(isUrl("example.com")).toBe(false);
  });
});

describe("isImageUrl", () => {
  it("should return true for image URLs", () => {
    expect(isImageUrl("https://example.com/photo.png")).toBe(true);
    expect(isImageUrl("https://example.com/image.jpg")).toBe(true);
    expect(isImageUrl("https://example.com/pic.jpeg")).toBe(true);
    expect(isImageUrl("https://example.com/anim.gif")).toBe(true);
    expect(isImageUrl("https://example.com/icon.svg")).toBe(true);
    expect(isImageUrl("https://example.com/hero.webp")).toBe(true);
  });

  it("should return false for non-image URLs", () => {
    expect(isImageUrl("https://example.com/page")).toBe(false);
    expect(isImageUrl("https://example.com/doc.pdf")).toBe(false);
    expect(isImageUrl("not a url")).toBe(false);
  });
});

describe("isIsoDate", () => {
  it("should return true for valid ISO dates", () => {
    expect(isIsoDate("2024-01-15")).toBe(true);
    expect(isIsoDate("2024-06-15T10:30:00Z")).toBe(true);
    expect(isIsoDate("2024-06-15T10:30:00+05:30")).toBe(true);
    expect(isIsoDate("2024-12-31T23:59:59.999Z")).toBe(true);
  });

  it("should return false for non-dates", () => {
    expect(isIsoDate("hello")).toBe(false);
    expect(isIsoDate("2024-13-01")).toBe(false);
    expect(isIsoDate("not-a-date")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate("12345")).toBe(false);
  });
});

describe("formatValue", () => {
  it("should format numbers", () => {
    expect(formatValue(42)).toBe("42");
    expect(formatValue(0)).toBe("0");
  });

  it("should format strings as-is", () => {
    expect(formatValue("hello")).toBe("hello");
  });

  it("should format booleans as Yes/No", () => {
    expect(formatValue(true)).toBe("Yes");
    expect(formatValue(false)).toBe("No");
  });

  it("should format null", () => {
    expect(formatValue(null)).toBe("(null)");
  });

  it("should format undefined", () => {
    expect(formatValue(undefined)).toBe("(undefined)");
  });
});

describe("truncate", () => {
  it("should return the string when within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hi", 2)).toBe("hi");
  });

  it("should truncate and add ellipsis when exceeding limit", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
    expect(truncate("abcdefghij", 7)).toBe("abcd...");
  });
});

describe("isHomogeneousArray", () => {
  it("should return true for objects with same keys", () => {
    expect(
      isHomogeneousArray([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ])
    ).toBe(true);
  });

  it("should return false for objects with different keys", () => {
    expect(
      isHomogeneousArray([
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ])
    ).toBe(false);
  });

  it("should return false for empty arrays", () => {
    expect(isHomogeneousArray([])).toBe(false);
  });

  it("should return true for a single object", () => {
    expect(isHomogeneousArray([{ a: 1 }])).toBe(true);
  });

  it("should return false for mixed types", () => {
    expect(isHomogeneousArray([{ a: 1 }, "string", 42])).toBe(false);
  });
});

describe("inferColumnWidths", () => {
  it("should return widths based on content length", () => {
    const rows = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ];
    const widths = inferColumnWidths(rows, ["name", "age"]);
    expect(widths).toHaveLength(2);
    // "name" and "Alice" are longer, so first width should be larger
    expect(Number(widths[0])).toBeGreaterThan(Number(widths[1]));
  });

  it("should handle empty keys", () => {
    expect(inferColumnWidths([], [])).toEqual([]);
  });
});
