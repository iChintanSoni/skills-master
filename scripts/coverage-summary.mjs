#!/usr/bin/env node
/**
 * Render the v8 coverage summary as Markdown for a GitHub job summary.
 *
 * Reported, never gated. A coverage threshold that fails the build tends to get
 * met with tests written for the number rather than for the behavior; a table on
 * every PR keeps the gaps visible without creating that incentive.
 *
 * Usage: node scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SUMMARY = resolve("packages/cli/coverage/coverage-summary.json");

let data;
try {
  data = JSON.parse(readFileSync(SUMMARY, "utf8"));
} catch {
  process.stdout.write(
    `### Coverage\n\nNo coverage report found at \`${SUMMARY}\` — did \`test:coverage\` run?\n`,
  );
  process.exit(0);
}

const { total, ...files } = data;
const pct = (m) => `${m.pct.toFixed(2)}%`;
const cell = (m) => `${pct(m)} <sub>(${m.covered}/${m.total})</sub>`;

const lines = [
  "### Coverage",
  "",
  "| | Statements | Branches | Functions | Lines |",
  "|---|---|---|---|---|",
  `| **Total** | ${cell(total.statements)} | ${cell(total.branches)} | ${cell(total.functions)} | ${cell(total.lines)} |`,
  "",
];

// Surface only what is worth acting on: the files furthest from covered.
const weakest = Object.entries(files)
  .map(([path, m]) => ({
    path: path.replace(/^.*\/packages\/cli\//, ""),
    stmts: m.statements.pct,
    branches: m.branches.pct,
    uncovered: m.statements.total - m.statements.covered,
  }))
  .filter((f) => f.stmts < 100 || f.branches < 100)
  .sort((a, b) => b.uncovered - a.uncovered || a.stmts - b.stmts)
  .slice(0, 10);

if (weakest.length === 0) {
  lines.push("Every file is fully covered.");
} else {
  lines.push(
    "<details><summary>Least-covered files</summary>",
    "",
    "| File | Statements | Branches | Uncovered stmts |",
    "|---|---|---|---|",
    ...weakest.map(
      (f) =>
        `| \`${f.path}\` | ${f.stmts.toFixed(2)}% | ${f.branches.toFixed(2)}% | ${f.uncovered} |`,
    ),
    "",
    "</details>",
  );
}

process.stdout.write(`${lines.join("\n")}\n`);
