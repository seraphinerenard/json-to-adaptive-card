import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CLI_PATH = path.resolve(__dirname, "../../dist/cli.cjs");
const FIXTURE_DIR = path.join(os.tmpdir(), "json2card-test-" + Date.now());

beforeAll(() => {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
});

afterAll(() => {
  fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

function runCli(args: string, input?: string): string {
  const cmd = `node ${CLI_PATH} ${args}`;
  const opts: Record<string, unknown> = {
    encoding: "utf-8" as BufferEncoding,
    timeout: 10000,
  };
  if (input !== undefined) {
    opts.input = input;
  }
  return execSync(cmd, opts) as string;
}

describe("CLI", () => {
  it("should show help with --help", () => {
    const output = runCli("--help");
    expect(output).toContain("json2card");
    expect(output).toContain("Usage");
    expect(output).toContain("--title");
    expect(output).toContain("--theme");
  });

  it("should show version with --version", () => {
    const output = runCli("--version");
    expect(output.trim()).toBe("1.0.0");
  });

  it("should convert a JSON file", () => {
    const inputFile = path.join(FIXTURE_DIR, "input.json");
    fs.writeFileSync(inputFile, JSON.stringify({ name: "Alice", age: 30 }));
    const output = runCli(inputFile);
    const card = JSON.parse(output);
    expect(card.type).toBe("AdaptiveCard");
    expect(card.version).toBe("1.6");
    expect(card.body.length).toBeGreaterThan(0);
  });

  it("should write output to file with -o flag", () => {
    const inputFile = path.join(FIXTURE_DIR, "input2.json");
    const outputFile = path.join(FIXTURE_DIR, "output.json");
    fs.writeFileSync(inputFile, JSON.stringify({ key: "value" }));
    runCli(`-o ${outputFile} ${inputFile}`);
    expect(fs.existsSync(outputFile)).toBe(true);
    const card = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
    expect(card.type).toBe("AdaptiveCard");
  });

  it("should convert JSON from stdin", () => {
    const output = runCli("", '{"hello":"world"}');
    const card = JSON.parse(output);
    expect(card.type).toBe("AdaptiveCard");
    expect(card.body.length).toBeGreaterThan(0);
  });

  it("should support --title flag", () => {
    const output = runCli('--title "Test Title"', '{"a":1}');
    const card = JSON.parse(output);
    expect(card.body[0].text).toBe("Test Title");
  });
});
