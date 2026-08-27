#!/usr/bin/env node
/**
 * Output evals: does having the skill beat the model's own knowledge?
 *
 *   node scripts/output-eval/bin.mjs <skill> [options]
 *
 * The trigger evals (scripts/trigger-eval) ask whether a skill *fires*. This
 * asks the harder question the library's mission rests on: when it does fire,
 * is the answer better than the one the model would have given anyway?
 *
 * Same prompt, same model, two scratch projects — one with the skill installed,
 * one bare. Each answer is graded against assertions that encode *correct
 * practice*, not the skill's vocabulary: "gates on availability before use",
 * "exposes read-only state", "does not recommend the deprecated API". An
 * assertion that only matches a phrase the skill happens to use would measure
 * copying, not quality.
 *
 * Options:
 *   --runs=<n>     repeats per task per arm (default 1 — these are expensive)
 *   --model=<name> model under test (default: whatever `claude` uses)
 *   --json=<path>  write the full result set, answers included
 *   --keep         leave the scratch projects and answers on disk
 *   --dry-run      print the plan and exit without spending anything
 *
 * COST: each task costs two sessions, and these sessions write code, so they
 * are dearer than trigger evals. Check the printed cost after one skill before
 * scaling to the full sample.
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
  console.error("usage: node scripts/output-eval/bin.mjs <skill> [--runs=1] [--dry-run]");
  process.exit(2);
}

const runs = Number(flag("runs", "1"));
const model = flag("model");
const jsonOut = flag("json");

let spec;
try {
  spec = JSON.parse(readFileSync(join(HERE, skillName, "eval.json"), "utf8"));
} catch {
  console.error(`No task set at scripts/output-eval/${skillName}/eval.json`);
  process.exit(2);
}

console.log(`Skill under test : ${spec.skill}`);
console.log(`Tasks            : ${spec.tasks.length}`);
console.log(
  `Runs per arm     : ${runs}  →  ${spec.tasks.length * runs * 2} sessions (with + without)`,
);

if (has("dry-run")) {
  console.log("\n--dry-run: nothing was spent.");
  for (const t of spec.tasks) {
    console.log(`\n  ${t.prompt}`);
    for (const e of t.expect) console.log(`    expect  ${e.label}`);
    for (const a of t.avoid ?? []) console.log(`    avoid   ${a.label}`);
  }
  process.exit(0);
}

// ── two projects, identical but for the skill ───────────────────────────────
const withDir = mkdtempSync(join(tmpdir(), "output-eval-with-"));
const withoutDir = mkdtempSync(join(tmpdir(), "output-eval-without-"));
execFileSync("node", [TSX, CLI, "add", ...(spec.install ?? [spec.skill]), "--target", "claude"], {
  cwd: withDir,
  env: { ...process.env, SKILLS_MASTER_CONTENT: CONTENT },
  stdio: "pipe",
});

function ask(prompt, cwd) {
  const argv = [
    "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--max-turns",
    "3",
    // Skill is offered in both arms; the control simply has none installed, so
    // the difference is the skill's presence and nothing else.
    "--allowed-tools",
    "Skill",
    ...(model ? ["--model", model] : []),
  ];
  const res = spawnSync("claude", argv, { cwd, encoding: "utf8", maxBuffer: 64e6 });
  let answer = "";
  let cost = 0;
  let usedSkill = false;
  for (const line of (res.stdout ?? "").split("\n")) {
    if (!line.trim()) continue;
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type === "result") {
      if (typeof ev.result === "string") answer = ev.result;
      if (typeof ev.total_cost_usd === "number") cost += ev.total_cost_usd;
    }
    const content = ev.message?.content;
    if (Array.isArray(content)) {
      for (const b of content) {
        if (b?.type === "tool_use" && b.name === "Skill") usedSkill = true;
      }
    }
  }
  return { answer, cost, usedSkill };
}

/**
 * A bad practice named in order to warn against it is not a bad practice.
 *
 * The first run graded a with-skill answer as violating "reaches for an
 * Activity-scoped ViewModel" because it contained the sentence *"Don't fall back
 * to viewModel(LocalContext.current as ComponentActivity)"*. A regex cannot tell
 * an endorsement from a warning, so look back a short window for a negation
 * before counting a hit. Still a heuristic — read the answers before trusting a
 * violation count.
 */
const NEGATED =
  /\b(don'?t|do not|never|avoid|instead of|rather than|not\b[^.]{0,20}\buse)\b[^.]{0,80}$/i;
function isEndorsed(answer, pattern) {
  const m = new RegExp(pattern, "i").exec(answer);
  if (!m) return false;
  const before = answer.slice(Math.max(0, m.index - 90), m.index);
  return !NEGATED.test(before);
}

/** Assertions are regexes over the answer text; `avoid` matches count against it. */
function grade(answer, task) {
  const hit = (a) => new RegExp(a.pattern, "i").test(answer);
  const met = task.expect.filter(hit);
  const violated = (task.avoid ?? []).filter((a) => isEndorsed(answer, a.pattern));
  return {
    met: met.map((a) => a.label),
    missed: task.expect.filter((a) => !hit(a)).map((a) => a.label),
    violated: violated.map((a) => a.label),
    score: met.length / task.expect.length,
  };
}

const rows = [];
let totalCost = 0;
for (const [i, task] of spec.tasks.entries()) {
  for (let run = 0; run < runs; run++) {
    for (const [arm, cwd] of [
      ["with", withDir],
      ["without", withoutDir],
    ]) {
      const r = ask(task.prompt, cwd);
      totalCost += r.cost;
      const g = grade(r.answer, task);
      rows.push({ task: i, run, arm, ...g, usedSkill: r.usedSkill, answer: r.answer });
      console.log(
        `  task ${i + 1} run ${run + 1} ${arm.padEnd(7)} ` +
          `${(g.score * 100).toFixed(0).padStart(3)}%  ` +
          `${g.violated.length ? `⚠ ${g.violated.length} avoided-practice hit(s)  ` : ""}` +
          `${arm === "with" ? (r.usedSkill ? "(skill fired)" : "(skill did NOT fire)") : ""}`,
      );
    }
  }
}

const mean = (arm) => {
  const xs = rows.filter((r) => r.arm === arm);
  return xs.reduce((n, r) => n + r.score, 0) / xs.length;
};
const violations = (arm) =>
  rows.filter((r) => r.arm === arm).reduce((n, r) => n + r.violated.length, 0);

const w = mean("with");
const wo = mean("without");
console.log(`\n${spec.skill}`);
console.log(
  `  with skill    : ${(w * 100).toFixed(0)}% of assertions met, ${violations("with")} bad-practice hit(s)`,
);
console.log(
  `  without skill : ${(wo * 100).toFixed(0)}% of assertions met, ${violations("without")} bad-practice hit(s)`,
);
console.log(`  delta         : ${((w - wo) * 100).toFixed(0)} points`);
console.log(`  cost          : $${totalCost.toFixed(2)}`);

const missedWith = [...new Set(rows.filter((r) => r.arm === "with").flatMap((r) => r.missed))];
if (missedWith.length) {
  console.log("\n  assertions the skill did NOT secure:");
  for (const m of missedWith) console.log(`    - ${m}`);
}

if (jsonOut) {
  writeFileSync(
    resolve(jsonOut),
    `${JSON.stringify({ skill: spec.skill, runs, rows }, null, 2)}\n`,
  );
  console.log(`\nWrote ${jsonOut}`);
}

if (has("keep")) console.log(`\nProjects kept: ${withDir} | ${withoutDir}`);
else for (const d of [withDir, withoutDir]) rmSync(d, { recursive: true, force: true });
