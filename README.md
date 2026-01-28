<div align="center">

# json-to-adaptive-card

[![npm version](https://img.shields.io/npm/v/json-to-adaptive-card.svg)](https://www.npmjs.com/package/json-to-adaptive-card)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

**Convert any JSON data into Microsoft Adaptive Cards (v1.6)**

</div>

---

## Features

- **Zero runtime dependencies** -- pure conversion logic, nothing extra
- **Adaptive Card schema v1.6** -- latest schema version
- **Three themes** -- `default`, `compact`, and `detailed`
- **CLI + Library** -- use from the command line or import in your code
- **Stdin support** -- pipe data directly from other tools
- **Smart detection** -- tables, URLs, images, dates, and more

## Quick Start

### Install

```bash
npm install json-to-adaptive-card
```

### CLI Usage

```bash
# Convert a JSON file
json2card data.json

# Pipe from stdin
cat data.json | json2card --pretty

# With options
json2card --title "Users Report" --theme compact data.json

# Output to file
json2card -o card.json data.json
```

### Library Usage

```typescript
import { jsonToAdaptiveCard } from "json-to-adaptive-card";

const data = [
  { name: "Alice", age: 30, city: "Paris" },
  { name: "Bob", age: 25, city: "London" },
];

const card = jsonToAdaptiveCard(data, {
  title: "Team Members",
  theme: "default",
});

console.log(JSON.stringify(card, null, 2));
```

## Themes

| Theme | Description |
|-------|-------------|
| `default` | Balanced layout with FactSets and table ColumnSets |
| `compact` | Minimal spacing, FactSets for everything |
| `detailed` | Full containers with separators and labels |

## API Reference

### `jsonToAdaptiveCard(data, options?)`

Converts any JSON value into an Adaptive Card.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `unknown` | Any JSON-serializable value |
| `options.title` | `string` | Optional card title |
| `options.maxDepth` | `number` | Max nesting depth (default: 5) |
| `options.theme` | `"default" \| "compact" \| "detailed"` | Visual theme |
| `options.includeNulls` | `boolean` | Include null values (default: false) |
| `options.columnWidth` | `"auto" \| "stretch"` | Column width strategy |

**Returns:** `AdaptiveCard` -- a valid Adaptive Card v1.6 object.

## License

MIT
