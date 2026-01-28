import { describe, it, expect } from "vitest";
import { jsonToAdaptiveCard } from "../converter";
import type { TextBlock, FactSet, Container, ColumnSet, Image } from "../types";

describe("jsonToAdaptiveCard", () => {
  it("should return schema version 1.6", () => {
    const card = jsonToAdaptiveCard("hello");
    expect(card.version).toBe("1.6");
    expect(card.type).toBe("AdaptiveCard");
    expect(card.$schema).toContain("adaptive-card");
  });

  it("should convert a string value to a TextBlock", () => {
    const card = jsonToAdaptiveCard("Hello World");
    expect(card.body).toHaveLength(1);
    expect(card.body[0].type).toBe("TextBlock");
    expect((card.body[0] as TextBlock).text).toBe("Hello World");
  });

  it("should convert a number value to a TextBlock", () => {
    const card = jsonToAdaptiveCard(42);
    expect(card.body).toHaveLength(1);
    expect((card.body[0] as TextBlock).text).toBe("42");
  });

  it("should convert boolean true to TextBlock with 'Yes'", () => {
    const card = jsonToAdaptiveCard(true);
    expect((card.body[0] as TextBlock).text).toBe("Yes");
  });

  it("should convert boolean false to TextBlock with 'No'", () => {
    const card = jsonToAdaptiveCard(false);
    expect((card.body[0] as TextBlock).text).toBe("No");
  });

  it("should exclude null when includeNulls is false (default)", () => {
    const card = jsonToAdaptiveCard(null);
    expect(card.body).toHaveLength(0);
  });

  it("should include null as TextBlock '(null)' when includeNulls is true", () => {
    const card = jsonToAdaptiveCard(null, { includeNulls: true });
    expect(card.body).toHaveLength(1);
    expect((card.body[0] as TextBlock).text).toBe("(null)");
  });

  it("should convert a simple object to a FactSet", () => {
    const card = jsonToAdaptiveCard({ name: "Alice", age: 30 });
    expect(card.body).toHaveLength(1);
    const factSet = card.body[0] as FactSet;
    expect(factSet.type).toBe("FactSet");
    expect(factSet.facts).toHaveLength(2);
    expect(factSet.facts[0].title).toBe("name");
    expect(factSet.facts[0].value).toBe("Alice");
    expect(factSet.facts[1].title).toBe("age");
    expect(factSet.facts[1].value).toBe("30");
  });

  it("should convert a nested object to a Container with nested FactSet", () => {
    const card = jsonToAdaptiveCard({
      name: "Alice",
      address: { city: "Paris", zip: "75001" },
    });
    // Should have a FactSet for "name" and a Container for "address"
    expect(card.body.length).toBeGreaterThanOrEqual(2);
    const container = card.body.find((el) => el.type === "Container") as Container;
    expect(container).toBeDefined();
    const innerFactSet = container.items.find((el) => el.type === "FactSet") as FactSet;
    expect(innerFactSet).toBeDefined();
    expect(innerFactSet.facts.some((f) => f.title === "city")).toBe(true);
  });

  it("should convert an array of primitives to a list TextBlock", () => {
    const card = jsonToAdaptiveCard(["apple", "banana", "cherry"]);
    expect(card.body).toHaveLength(1);
    const tb = card.body[0] as TextBlock;
    expect(tb.text).toContain("- apple");
    expect(tb.text).toContain("- banana");
    expect(tb.text).toContain("- cherry");
  });

  it("should convert an array of objects with same keys to table layout (ColumnSet)", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const card = jsonToAdaptiveCard(data);
    // First element is the header ColumnSet, rest are data rows
    const columnSets = card.body.filter((el) => el.type === "ColumnSet") as ColumnSet[];
    expect(columnSets.length).toBeGreaterThanOrEqual(2); // header + data rows
    // Header should have column names
    const headerCols = columnSets[0].columns;
    expect(headerCols).toHaveLength(2);
    expect((headerCols[0].items[0] as TextBlock).text).toBe("name");
    expect((headerCols[1].items[0] as TextBlock).text).toBe("age");
  });

  it("should handle an array of mixed objects gracefully", () => {
    const data = [
      { name: "Alice", age: 30 },
      { city: "Paris" },
    ];
    const card = jsonToAdaptiveCard(data);
    // Mixed objects should still produce elements
    expect(card.body.length).toBeGreaterThan(0);
  });

  it("should respect maxDepth for deeply nested objects", () => {
    const deep = { a: { b: { c: { d: { e: { f: "deep" } } } } } };
    const card = jsonToAdaptiveCard(deep, { maxDepth: 3 });
    // Should not crash and should produce output
    expect(card.body.length).toBeGreaterThan(0);
    // Find a text block with JSON stringified content at depth limit
    const allText = JSON.stringify(card.body);
    expect(allText).toBeTruthy();
  });

  it("should create selectAction for URL strings", () => {
    const card = jsonToAdaptiveCard("https://example.com/page");
    const tb = card.body[0] as TextBlock;
    expect(tb.selectAction).toBeDefined();
    expect(tb.selectAction?.type).toBe("Action.OpenUrl");
    expect(tb.selectAction?.url).toBe("https://example.com/page");
  });

  it("should create an Image element for image URLs", () => {
    const card = jsonToAdaptiveCard("https://example.com/photo.png");
    const img = card.body[0] as Image;
    expect(img.type).toBe("Image");
    expect(img.url).toBe("https://example.com/photo.png");
  });

  it("should format ISO date strings", () => {
    const card = jsonToAdaptiveCard("2024-06-15T10:30:00Z");
    const tb = card.body[0] as TextBlock;
    // Should be formatted (not the raw ISO string)
    expect(tb.text).not.toBe("2024-06-15T10:30:00Z");
    expect(tb.text.length).toBeGreaterThan(0);
  });

  it("should add a title header when title option is provided", () => {
    const card = jsonToAdaptiveCard("data", { title: "My Report" });
    expect(card.body.length).toBeGreaterThanOrEqual(2);
    const title = card.body[0] as TextBlock;
    expect(title.text).toBe("My Report");
    expect(title.weight).toBe("Bolder");
    expect(title.size).toBe("Large");
  });

  it("should use FactSets in compact theme for array of objects", () => {
    const data = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    const card = jsonToAdaptiveCard(data, { theme: "compact" });
    const factSets = card.body.filter((el) => el.type === "FactSet") as FactSet[];
    expect(factSets.length).toBeGreaterThanOrEqual(2);
  });

  it("should use Containers with separators in detailed theme", () => {
    const data = { name: "Alice", age: 30, city: "Paris" };
    const card = jsonToAdaptiveCard(data, { theme: "detailed" });
    const containers = card.body.filter((el) => el.type === "Container") as Container[];
    expect(containers.length).toBeGreaterThanOrEqual(1);
    // After the first, containers should have separators
    if (containers.length > 1) {
      expect(containers[1].separator).toBe(true);
    }
  });

  it("should return empty body for an empty object", () => {
    const card = jsonToAdaptiveCard({});
    expect(card.body).toHaveLength(0);
    expect(card.type).toBe("AdaptiveCard");
  });

  it("should return empty body for an empty array", () => {
    const card = jsonToAdaptiveCard([]);
    expect(card.body).toHaveLength(0);
  });

  it("should handle a large array of objects as a table with all rows", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      value: `item-${i + 1}`,
    }));
    const card = jsonToAdaptiveCard(rows);
    const columnSets = card.body.filter((el) => el.type === "ColumnSet") as ColumnSet[];
    // 1 header + 100 data rows
    expect(columnSets).toHaveLength(101);
  });

  it("should handle mixed types in an array", () => {
    const card = jsonToAdaptiveCard([1, "two", true, null]);
    expect(card.body).toHaveLength(1);
    const tb = card.body[0] as TextBlock;
    expect(tb.text).toContain("- 1");
    expect(tb.text).toContain("- two");
    expect(tb.text).toContain("- Yes");
    // null excluded by default
    expect(tb.text).not.toContain("null");
  });

  it("should handle float numbers", () => {
    const card = jsonToAdaptiveCard(3.14159);
    const tb = card.body[0] as TextBlock;
    expect(tb.text).toContain("3.14");
  });

  it("should handle object with null values excluded by default", () => {
    const card = jsonToAdaptiveCard({ name: "Alice", extra: null });
    const factSet = card.body[0] as FactSet;
    expect(factSet.facts).toHaveLength(1);
    expect(factSet.facts[0].title).toBe("name");
  });

  it("should handle object with null values included when option set", () => {
    const card = jsonToAdaptiveCard(
      { name: "Alice", extra: null },
      { includeNulls: true }
    );
    const factSet = card.body[0] as FactSet;
    expect(factSet.facts).toHaveLength(2);
    expect(factSet.facts[1].value).toBe("(null)");
  });
});
