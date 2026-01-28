import type {
  AdaptiveCard,
  AdaptiveCardOptions,
  CardElement,
  TextBlock,
  Image,
  Container,
  FactSet,
  Fact,
  ColumnSet,
  Column,
  Spacing,
} from "./types";
import {
  isUrl,
  isImageUrl,
  isIsoDate,
  formatValue,
  isHomogeneousArray,
  inferColumnWidths,
} from "./utils";

const ADAPTIVE_CARD_SCHEMA = "http://adaptivecards.io/schemas/adaptive-card.json";

const DEFAULT_OPTIONS: Required<AdaptiveCardOptions> = {
  title: "",
  maxDepth: 5,
  theme: "default",
  includeNulls: false,
  dateFormat: "",
  columnWidth: "auto",
};

/**
 * Convert any JSON data into a Microsoft Adaptive Card (v1.6).
 */
export function jsonToAdaptiveCard(
  data: unknown,
  options?: AdaptiveCardOptions
): AdaptiveCard {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const body: CardElement[] = [];

  if (opts.title) {
    body.push(createTitleBlock(opts.title));
  }

  const elements = convertValue(data, opts, 0);
  body.push(...elements);

  return {
    type: "AdaptiveCard",
    version: "1.6",
    $schema: ADAPTIVE_CARD_SCHEMA,
    body,
  };
}

function createTitleBlock(title: string): TextBlock {
  return {
    type: "TextBlock",
    text: title,
    weight: "Bolder",
    size: "Large",
    wrap: true,
  };
}

function convertValue(
  value: unknown,
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  if (depth >= opts.maxDepth) {
    return [
      {
        type: "TextBlock",
        text: typeof value === "object" ? JSON.stringify(value) : String(value),
        wrap: true,
        fontType: "Monospace",
        isSubtle: true,
      },
    ];
  }

  if (value === null) {
    if (!opts.includeNulls) return [];
    return [createTextBlock("(null)", { isSubtle: true })];
  }

  if (value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return convertString(value, opts);
  }

  if (typeof value === "number") {
    return [createTextBlock(formatValue(value, opts))];
  }

  if (typeof value === "boolean") {
    return [createTextBlock(formatValue(value, opts))];
  }

  if (Array.isArray(value)) {
    return convertArray(value, opts, depth);
  }

  if (typeof value === "object") {
    return convertObject(value as Record<string, unknown>, opts, depth);
  }

  return [createTextBlock(String(value))];
}

function convertString(
  value: string,
  opts: Required<AdaptiveCardOptions>
): CardElement[] {
  if (isImageUrl(value)) {
    const img: Image = {
      type: "Image",
      url: value,
      size: "Medium",
      altText: "Image",
    };
    return [img];
  }

  if (isUrl(value)) {
    const block: TextBlock = {
      type: "TextBlock",
      text: value,
      wrap: true,
      color: "Accent",
      selectAction: {
        type: "Action.OpenUrl",
        url: value,
      },
    };
    return [block];
  }

  if (isIsoDate(value)) {
    return [createTextBlock(formatValue(value, opts))];
  }

  return [createTextBlock(value)];
}

function convertArray(
  arr: unknown[],
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  if (arr.length === 0) return [];

  // Check if all items are objects with the same keys (table layout)
  if (isHomogeneousArray(arr)) {
    const objects = arr as Record<string, unknown>[];
    const keys = Object.keys(objects[0]);

    if (opts.theme === "compact") {
      return convertArrayAsFactSets(objects, keys, opts);
    }

    return convertArrayAsTable(objects, keys, opts, depth);
  }

  // Check if all items are primitives (bullet list)
  const allPrimitives = arr.every(
    (item) => typeof item !== "object" || item === null
  );

  if (allPrimitives) {
    return convertPrimitiveArray(arr, opts);
  }

  // Mixed array: convert each item individually
  const elements: CardElement[] = [];
  for (const item of arr) {
    const converted = convertValue(item, opts, depth + 1);
    if (converted.length > 0) {
      if (opts.theme === "detailed" && elements.length > 0) {
        const first = converted[0];
        if ("separator" in first || first.type === "TextBlock" || first.type === "Container" || first.type === "FactSet") {
          (first as TextBlock).separator = true;
        }
      }
      elements.push(...converted);
    }
  }
  return elements;
}

function convertPrimitiveArray(
  arr: unknown[],
  opts: Required<AdaptiveCardOptions>
): CardElement[] {
  const lines = arr
    .filter((item) => item !== null || opts.includeNulls)
    .map((item) => `- ${formatValue(item, opts)}`);

  if (lines.length === 0) return [];

  return [createTextBlock(lines.join("\n"))];
}

function convertArrayAsTable(
  objects: Record<string, unknown>[],
  keys: string[],
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  const widths = opts.columnWidth === "stretch"
    ? keys.map(() => "stretch")
    : inferColumnWidths(objects, keys);

  // Header row
  const headerColumns: Column[] = keys.map((key, i) => ({
    type: "Column" as const,
    width: widths[i],
    items: [
      {
        type: "TextBlock" as const,
        text: key,
        weight: "Bolder" as const,
        wrap: true,
      },
    ],
  }));

  const headerRow: ColumnSet = {
    type: "ColumnSet",
    columns: headerColumns,
  };

  // Data rows
  const dataRows: ColumnSet[] = objects.map((obj) => ({
    type: "ColumnSet" as const,
    columns: keys.map((key, i) => {
      const val = obj[key];
      const items = convertCellValue(val, opts, depth);
      return {
        type: "Column" as const,
        width: widths[i],
        items,
      } satisfies Column;
    }),
    separator: true as const,
    spacing: "Small" as Spacing,
  }));

  return [headerRow, ...dataRows];
}

function convertCellValue(
  val: unknown,
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  if (val === null) {
    if (!opts.includeNulls) return [createTextBlock("")];
    return [createTextBlock("(null)", { isSubtle: true })];
  }

  if (typeof val === "object" && val !== null) {
    return [createTextBlock(JSON.stringify(val), { fontType: "Monospace" as const })];
  }

  if (typeof val === "string" && isImageUrl(val)) {
    return [{ type: "Image", url: val, size: "Small", altText: "Image" }];
  }

  return [createTextBlock(formatValue(val, opts))];
}

function convertArrayAsFactSets(
  objects: Record<string, unknown>[],
  keys: string[],
  opts: Required<AdaptiveCardOptions>
): CardElement[] {
  return objects.map((obj, index) => {
    const facts: Fact[] = keys
      .filter((key) => obj[key] !== null || opts.includeNulls)
      .map((key) => ({
        title: key,
        value: formatValue(obj[key], opts),
      }));

    const factSet: FactSet = {
      type: "FactSet",
      facts,
    };

    if (index > 0) {
      factSet.separator = true;
      factSet.spacing = "Medium";
    }

    return factSet;
  });
}

function convertObject(
  obj: Record<string, unknown>,
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  const entries = Object.entries(obj).filter(
    ([, v]) => v !== null || opts.includeNulls
  );

  if (entries.length === 0) return [];

  // Check if any values are complex (objects/arrays)
  const hasComplexValues = entries.some(
    ([, v]) => typeof v === "object" && v !== null
  );

  // Simple object with only primitive values -> FactSet
  if (!hasComplexValues && opts.theme !== "detailed") {
    return [createFactSet(entries, opts)];
  }

  // Use FactSet for compact theme even with some complex values
  if (opts.theme === "compact" && !hasComplexValues) {
    return [createFactSet(entries, opts)];
  }

  // For detailed theme or complex objects -> Container with nested elements
  if (opts.theme === "detailed") {
    return convertObjectDetailed(entries, opts, depth);
  }

  // Default theme: split into simple (FactSet) and complex (Containers)
  return convertObjectDefault(entries, opts, depth);
}

function createFactSet(
  entries: [string, unknown][],
  opts: Required<AdaptiveCardOptions>
): FactSet {
  const facts: Fact[] = entries.map(([key, value]) => ({
    title: key,
    value: formatValue(value, opts),
  }));

  return {
    type: "FactSet",
    facts,
  };
}

function convertObjectDefault(
  entries: [string, unknown][],
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  const simpleEntries: [string, unknown][] = [];
  const complexEntries: [string, unknown][] = [];

  for (const [key, value] of entries) {
    if (typeof value === "object" && value !== null) {
      complexEntries.push([key, value]);
    } else {
      simpleEntries.push([key, value]);
    }
  }

  const elements: CardElement[] = [];

  if (simpleEntries.length > 0) {
    elements.push(createFactSet(simpleEntries, opts));
  }

  for (const [key, value] of complexEntries) {
    const label: TextBlock = {
      type: "TextBlock",
      text: key,
      weight: "Bolder",
      wrap: true,
      separator: elements.length > 0,
      spacing: "Medium",
    };

    const childElements = convertValue(value, opts, depth + 1);

    const container: Container = {
      type: "Container",
      items: [label, ...childElements],
    };

    if (elements.length > 0) {
      container.separator = true;
      container.spacing = "Medium";
    }

    elements.push(container);
  }

  return elements;
}

function convertObjectDetailed(
  entries: [string, unknown][],
  opts: Required<AdaptiveCardOptions>,
  depth: number
): CardElement[] {
  const elements: CardElement[] = [];

  for (const [key, value] of entries) {
    const label: TextBlock = {
      type: "TextBlock",
      text: key,
      weight: "Bolder",
      size: "Small",
      isSubtle: true,
      wrap: true,
    };

    const valueElements = convertValue(value, opts, depth + 1);

    const container: Container = {
      type: "Container",
      items: [label, ...valueElements],
      spacing: "Medium",
    };

    if (elements.length > 0) {
      container.separator = true;
    }

    elements.push(container);
  }

  return elements;
}

function createTextBlock(
  text: string,
  extra?: Partial<TextBlock>
): TextBlock {
  return {
    type: "TextBlock",
    text,
    wrap: true,
    ...extra,
  };
}
