#!/usr/bin/env node
/**
 * Trigger evals: does a skill actually activate on prompts a real user would write?
 *
 *   node scripts/trigger-eval/bin.mjs <skill> [options]
 *
 * The library asserts description quality (every one carries a "Use when …"
 * clause, and the linter checks it) but has never measured it. This measures it:
 * it installs a skill and its near-miss siblings into a scratch project, runs
 * labelled prompts through headless Claude Code, and records which skill — if
 * any — the model actually reached for.
 *
 * Why siblings matter: `swiftui-sheets` triggering on "how do I show a sheet in
 * SwiftUI" proves little if `hig-sheets` triggers on it too. The hard case is
 * discrimination between our own overlapping skills, so a query set names the
 * whole neighbourhood and the run installs all of it.
 *
 * Options:
 *   --runs=<n>        repeats per query (default 3 — model choice is stochastic)
 *   --limit=<n>       use only the first n should-trigger and n should-not queries,
 *                     for proving the wiring works before paying for a full set
 *   --model=<name>    model to evaluate against (default: whatever `claude` uses)
 *   --concurrency=<n> parallel invocations (default 1; raise carefully, hosts rate-limit)
 *   --json=<path>     write the full result set
 *   --keep            leave the scratch project on disk for inspection
 *   --dry-run         print the plan and exit without spending anything
 *
 * COST: every query is a real headless Claude Code session — a pilot of 10
 * skills x 20 queries x 3 runs is 600 sessions. Start with --dry-run, then one
 * skill, and read the per-run cost the summary prints before scaling up.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../..");
const CONTENT = join(REPO_ROOT, "skills");
const CLI = join(REPO_ROOT, "packages/cli/src/bin.ts");
const TSX = join(REPO_ROOT, "node_modules/tsx/dist/cli.mjs");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = (name) => args.includes(`--${name}`);

const skillName = args.find((a) => !a.startsWith("--"));
if (!skillName) {
  console.error("usage: node scripts/trigger-eval/bin.mjs <skill> [--runs=3] [--dry-run]");
  process.exit(2);
}

const runs = Number(flag("runs", "3"));
const concurrency = Number(flag("concurrency", "1"));
const model = flag("model");
const jsonOut = flag("json");
const dryRun = has("dry-run");

const specPath = join(HERE, skillName, "eval.json");
let spec;
try {
  spec = JSON.parse(readFileSync(specPath, "utf8"));
} catch {
  console.error(`No query set at ${specPath.replace(`${REPO_ROOT}/`, "")}`);
  process.exit(2);
}

/** Every query, flattened with the verdict it is supposed to produce. */
const limit = Number(flag("limit", "0")) || Number.POSITIVE_INFINITY;
const cases = [
  ...spec.shouldTrigger.slice(0, limit).map((prompt) => ({ prompt, expect: true })),
  ...spec.shouldNotTrigger.slice(0, limit).map((prompt) => ({ prompt, expect: false })),
];

console.log(`Skill under test : ${spec.skill}`);
console.log(`Neighbourhood    : ${spec.install.join(", ")}`);
const nShould = cases.filter((c) => c.expect).length;
console.log(
  `Queries          : ${cases.length} (${nShould} should trigger, ${cases.length - nShould} should not)` +
    (Number.isFinite(limit) ? `  [--limit=${limit}]` : ""),
);
console.log(`Runs per query   : ${runs}  →  ${cases.length * runs} headless sessions`);
if (model) console.log(`Model            : ${model}`);

if (dryRun) {
  console.log("\n--dry-run: nothing was spent. Queries:");
  for (const c of cases) console.log(`  ${c.expect ? "TRIGGER    " : "NO-TRIGGER "} ${c.prompt}`);
  process.exit(0);
}

// ── scratch project ─────────────────────────────────────────────────────────
const project = mkdtempSync(join(tmpdir(), "trigger-eval-"));
try {
  execFileSync("node", [TSX, CLI, "add", ...spec.install, "--target", "claude"], {
    cwd: project,
    env: { ...process.env, SKILLS_MASTER_CONTENT: CONTENT },
    stdio: "pipe",
  });
} catch (err) {
  console.error(`Failed to install skills into the scratch project: ${err}`);
  rmSync(project, { recursive: true, force: true });
  process.exit(1);
}

/** Which skills the model reached for, plus what the session cost. */
function runQuery(prompt) {
  const argv = [
    "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--max-turns",
    "2",
    // Skill is the only tool on offer: this measures what the model *chooses*
    // to load, not whether it can complete the task some other way.
    "--allowed-tools",
    "Skill",
    ...(model ? ["--model", model] : []),
  ];
  const res = spawnSync("claude", argv, { cwd: project, encoding: "utf8", maxBuffer: 64e6 });
  const invoked = new Set();
  let cost = 0;
  for (const line of (res.stdout ?? "").split("\n")) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type === "result" && typeof ev.total_cost_usd === "number") cost = ev.total_cost_usd;
    const content = ev.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type === "tool_use" && block.name === "Skill" && block.input?.skill) {
        invoked.add(String(block.input.skill).replace(/^\//, ""));
      }
    }
  }
  return { invoked: [...invoked], cost, failed: res.status !== 0 && invoked.length === 0 };
}

async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, limit) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

const jobs = cases.flatMap((c) => Array.from({ length: runs }, () => c));
console.log("");
const results = await mapWithConcurrency(jobs, concurrency, (job, i) => {
  const r = runQuery(job.prompt);
  const hit = r.invoked.includes(spec.skill);
  const pass = hit === job.expect;
  process.stdout.write(
    `  [${String(i + 1).padStart(3)}/${jobs.length}] ${pass ? "pass" : "FAIL"}  ` +
      `${job.expect ? "→" : "↛"} ${r.invoked.length ? r.invoked.join(",") : "(none)"}  ${job.prompt.slice(0, 60)}\n`,
  );
  return { ...job, ...r, hit, pass };
});

// ── summary ─────────────────────────────────────────────────────────────────
const byPrompt = new Map();
for (const r of results) {
  const row = byPrompt.get(r.prompt) ?? { prompt: r.prompt, expect: r.expect, hits: 0, n: 0 };
  row.hits += r.hit ? 1 : 0;
  row.n += 1;
  byPrompt.set(r.prompt, row);
}

const should = [...byPrompt.values()].filter((r) => r.expect);
const shouldNot = [...byPrompt.values()].filter((r) => !r.expect);
const rate = (rows) =>
  rows.length ? rows.reduce((n, r) => n + r.hits / r.n, 0) / rows.length : Number.NaN;
const totalCost = results.reduce((n, r) => n + r.cost, 0);

console.log(`\n${spec.skill}`);
console.log(`  trigger rate on should-trigger  : ${(rate(should) * 100).toFixed(0)}%`);
console.log(`  false-fire rate on should-not   : ${(rate(shouldNot) * 100).toFixed(0)}%`);
console.log(
  `  cost                            : $${totalCost.toFixed(2)} (${jobs.length} sessions)`,
);

const weak = [...byPrompt.values()].filter((r) => (r.expect ? r.hits < r.n : r.hits > 0));
if (weak.length) {
  console.log("\n  queries that did not behave:");
  for (const r of weak) {
    console.log(`    ${r.hits}/${r.n} ${r.expect ? "triggered" : "false-fired"} — ${r.prompt}`);
  }
}

if (jsonOut) {
  writeFileSync(
    resolve(jsonOut),
    `${JSON.stringify({ skill: spec.skill, runs, model: model ?? null, results: [...byPrompt.values()], totalCost }, null, 2)}\n`,
  );
  console.log(`\nWrote ${jsonOut}`);
}

if (has("keep")) console.log(`\nScratch project kept at ${project}`);
else rmSync(project, { recursive: true, force: true });
