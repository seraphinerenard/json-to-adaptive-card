#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { jsonToAdaptiveCard } from "./converter";
import type { AdaptiveCardOptions } from "./types";

const VERSION = "1.0.0";

const HELP = `
json2card - Convert JSON data into Microsoft Adaptive Cards (v1.6)

Usage:
  json2card [options] [file]

Arguments:
  file                   JSON file to convert (reads from stdin if omitted)

Options:
  --title <text>         Add a title to the card
  --theme <name>         Theme: default, compact, or detailed (default: default)
  --max-depth <n>        Maximum nesting depth (default: 5)
  --include-nulls        Include null values in output
  --pretty               Pretty-print output JSON
  -o, --output <file>    Write output to a file
  --help                 Show this help message
  --version              Show version number

Examples:
  json2card data.json
  json2card --title "Report" --theme compact data.json
  cat data.json | json2card --pretty
  json2card -o card.json data.json
`.trim();

interface CliArgs {
  file?: string;
  title?: string;
  theme?: "default" | "compact" | "detailed";
  maxDepth?: number;
  includeNulls?: boolean;
  pretty?: boolean;
  output?: string;
  help?: boolean;
  version?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  const rest = argv.slice(2);
  let i = 0;

  while (i < rest.length) {
    const arg = rest[i];

    switch (arg) {
      case "--help":
        args.help = true;
        break;
      case "--version":
        args.version = true;
        break;
      case "--title":
        args.title = rest[++i];
        break;
      case "--theme":
        args.theme = rest[++i] as CliArgs["theme"];
        break;
      case "--max-depth":
        args.maxDepth = parseInt(rest[++i], 10);
        break;
      case "--include-nulls":
        args.includeNulls = true;
        break;
      case "--pretty":
        args.pretty = true;
        break;
      case "-o":
      case "--output":
        args.output = rest[++i];
        break;
      default:
        if (!arg.startsWith("-")) {
          args.file = arg;
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }

    i++;
  }

  return args;
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.version) {
    console.log(VERSION);
    process.exit(0);
  }

  let input: string;

  if (args.file) {
    const filePath = path.resolve(args.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    input = fs.readFileSync(filePath, "utf-8");
  } else {
    if (process.stdin.isTTY) {
      console.error("Error: No input file specified and no data on stdin.");
      console.error("Run 'json2card --help' for usage information.");
      process.exit(1);
    }
    input = await readStdin();
  }

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    console.error(`Error: Invalid JSON input - ${(e as Error).message}`);
    process.exit(1);
  }

  const options: AdaptiveCardOptions = {};
  if (args.title) options.title = args.title;
  if (args.theme) options.theme = args.theme;
  if (args.maxDepth !== undefined) options.maxDepth = args.maxDepth;
  if (args.includeNulls) options.includeNulls = true;

  const card = jsonToAdaptiveCard(data, options);
  const indent = args.pretty ? 2 : undefined;
  const output = JSON.stringify(card, null, indent);

  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.writeFileSync(outputPath, output + "\n", "utf-8");
    console.error(`Card written to ${outputPath}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
