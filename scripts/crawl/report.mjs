#!/usr/bin/env node
/**
 * Render the crawl's JSON reports as Markdown.
 *
 * The crawl has always produced good data and then buried it in an artifact
 * nobody downloads. This turns it into something that shows up where people
 * already look: the workflow job summary, and a pinned issue.
 *
 *   node scripts/crawl/report.mjs                     # Markdown to stdout
 *   node scripts/crawl/report.mjs >> "$GITHUB_STEP_SUMMARY"
 *
 * Options:
 *   --top=<n>      how many stale skills to list (default 15)
 *   --title-only   print just the issue title (used to find the issue to update)
 *
 * Reads whatever exists under scripts/crawl/reports/ and degrades gracefully:
 * a missing link report just omits that section, so an offline crawl still
 * produces a useful summary.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPORTS = join(HERE, "reports");
const REPO_ROOT = resolve(HERE, "../..");

export const ISSUE_TITLE = "Weekly library health: staleness, coverage, dead links";

const args = process.argv.slice(2);
if (args.includes("--title-only")) {
  process.stdout.write(`${ISSUE_TITLE}\n`);
  process.exit(0);
}
const top = Number(args.find((a) => a.startsWith("--top="))?.slice(6) ?? 15);

function readJson(name) {
  try {
    return JSON.parse(readFileSync(join(REPORTS, name), "utf8"));
  } catch {
    return null;
  }
}

const coverage = readJson("coverage.json");
const staleness = readJson("staleness.json");
const links = readJson("links.json");
const upstream = readJson("upstream.json");
const footprint = readJson("footprint.json");
const currency = readJson("currency.json");

const out = [];
const say = (...lines) => out.push(...lines);

/** Repo-relative path → a link a reader can click straight through to. */
function skillLink(row) {
  return `[\`${row.name}\`](../blob/main/skills/${row.path}/SKILL.md)`;
}

say(`## ${ISSUE_TITLE}`, "");

if (!coverage && !staleness && !links) {
  say(
    "No crawl reports found — did `scripts/crawl/bin.ts` run?",
    "",
    `Looked in \`${REPORTS.replace(`${REPO_ROOT}/`, "")}\`.`,
  );
  process.stdout.write(`${out.join("\n")}\n`);
  process.exit(0);
}

// ── Headline ────────────────────────────────────────────────────────────────
const buckets = { fresh: 0, aging: 0, stale: 0, unknown: 0 };
if (staleness) {
  for (const r of staleness) {
    if (r.ageDays == null) buckets.unknown++;
    else if (r.ageDays < 90) buckets.fresh++;
    else if (r.ageDays < 180) buckets.aging++;
    else buckets.stale++;
  }
}

const headline = [
  coverage ? `**${coverage.total}** skills` : null,
  staleness ? `**${buckets.stale}** stale (>180d)` : null,
  links ? `**${links.dead.length}** dead link(s) of ${links.checked}` : null,
  footprint
    ? `listing **${footprint.library.overBudget["200000"]}×** the 200k-context budget`
    : null,
].filter(Boolean);
say(headline.join(" · "), "");

// ── Dead links: the only section that is ever actionable-urgent ─────────────
if (links) {
  if (links.dead.length === 0) {
    say(`### Links`, "", `All ${links.checked} documentation links resolve.`, "");
  } else {
    say(
      `### Dead links (${links.dead.length})`,
      "",
      "| Status | URL | Used by |",
      "|---|---|---|",
      ...links.dead
        .slice(0, 30)
        .map(
          (d) =>
            `| \`${d.status}\` | ${d.url} | ${(d.files ?? [])
              .map((f) => `\`${f.replace(/^skills\//, "")}\``)
              .join("<br>")} |`,
        ),
      "",
    );
    if (links.dead.length > 30) say(`…and ${links.dead.length - 30} more.`, "");
    say(
      "Re-check by hand before editing: the scan runs concurrently and vendor hosts " +
        "(support.google.com especially) rate-limit, which surfaces as a one-off 404 " +
        "against a URL that is perfectly alive.",
      "",
    );
  }
}

// ── Currency ────────────────────────────────────────────────────────────────
// Staleness by date says when a batch ran. This says whether the thing a skill
// documents has moved since — the only version of "stale" worth acting on.
if (currency) {
  say("### Upstream currency", "");
  // Apple has no dated source yet (PLAN.md 0.3), so silence about an Apple
  // skill means "unmeasured", not "current". Say so rather than let an empty
  // table read as a clean bill of health.
  const unresolved = upstream?.["apple-updates"]?.unresolved ?? [];
  say(
    "> Apple is dated by month (its `updates` pages say “June 2026”, not a day), so a " +
      "row can say *whether* an Apple skill is behind but not by how much." +
      (unresolved.length
        ? ` No dated page exists for **${unresolved.join(", ")}**, and design skills track ` +
          "guidelines rather than frameworks — those are **unmeasured**, not current."
        : ""),
    "",
  );
  if (currency.behind.length === 0) {
    say(
      `No skill with a declared upstream is behind it. ` +
        `**${currency.declared}** skills declare one; **${currency.undeclared}** do not yet.`,
      "",
    );
  } else {
    say(
      `**${currency.behind.length}** of ${currency.declared} skills with a declared upstream ` +
        `have shipped since their snapshot. This is the refresh queue, worst first.`,
      "",
      "| Skill | Snapshot | Latest upstream | Days behind | Releases since |",
      "|---|---|---|---:|---:|",
      ...currency.behind
        .slice(0, 20)
        .map(
          (b) =>
            `| ${skillLink(b)} | ${b.snapshot} | ${b.latest} | ${b.behindDays} | ${b.releasesSince} |`,
        ),
      "",
    );
  }
}

// ── Staleness ───────────────────────────────────────────────────────────────
if (staleness) {
  say(
    "### Staleness",
    "",
    `| <90d | 90–180d | >180d | unknown |`,
    "|---|---|---|---|",
    `| ${buckets.fresh} | ${buckets.aging} | ${buckets.stale} | ${buckets.unknown} |`,
    "",
  );

  const oldest = staleness.filter((r) => r.ageDays != null).slice(0, top);
  if (oldest.length) {
    say(
      `<details><summary>${top} oldest snapshots</summary>`,
      "",
      "| Skill | Snapshot | Age | Stability |",
      "|---|---|---|---|",
      ...oldest.map(
        (r) => `| ${skillLink(r)} | ${r.snapshot_date} | ${r.ageDays}d | ${r.stability} |`,
      ),
      "",
      "</details>",
      "",
    );
  }
}

// ── Listing footprint ───────────────────────────────────────────────────────
// Descriptions are only worth writing if the agent reads them. Past the
// listing budget it substitutes a bare `- <name>`, so this reports distance
// from the cap rather than a raw token total.
if (footprint) {
  const b200 = footprint.budgets["200000"];
  const b1m = footprint.budgets["1000000"];
  const worst = footprint.plugins[0];
  const overAt200k = footprint.plugins.filter((p) => p.overBudget["200000"] > 1).length;

  say(
    "### Always-on listing footprint",
    "",
    `Every installed skill puts one \`- <name>: <description>\` line in the agent's ` +
      `system prompt. Claude Code caps that listing at ` +
      `\`contextWindow × ${footprint.loader.bytesPerToken} × ${footprint.loader.budgetFraction}\` ` +
      `— **${b200} bytes** at 200k context, **${b1m}** at 1M — and past the cap it drops ` +
      `lower-priority entries to a bare \`- <name>\`, description and all.`,
    "",
    `**${overAt200k} of ${footprint.plugins.length}** plugins exceed the 200k budget on their own. ` +
      `Worst: \`${worst.plugin}\` at **${worst.overBudget["200000"]}×**.`,
    "",
    "| Plugin | Skills | Listing | ~tokens | ×budget @200k | ×budget @1M |",
    "|---|---:|---:|---:|---:|---:|",
    ...footprint.plugins.map(
      (p) =>
        `| \`${p.plugin}\` | ${p.skills} | ${p.listingBytes}B | ${p.approxTokens} | ` +
        `${p.overBudget["200000"] > 1 ? `**${p.overBudget["200000"]}×**` : `${p.overBudget["200000"]}×`} | ` +
        `${p.overBudget["1000000"] > 1 ? `**${p.overBudget["1000000"]}×**` : `${p.overBudget["1000000"]}×`} |`,
    ),
    `| **whole library** | ${footprint.library.skills} | ${footprint.library.listingBytes}B | ` +
      `${footprint.library.approxTokens} | **${footprint.library.overBudget["200000"]}×** | ` +
      `**${footprint.library.overBudget["1000000"]}×** |`,
    "",
  );

  // The budget is per *install*, so "are we too big" is really "is the unit a
  // consumer installs too big" — a packaging question, not a content one.
  const g = footprint.granularity;
  if (g) {
    say(
      "<details><summary>Would smaller install units fit?</summary>",
      "",
      `Against the ${g.budgetBytes}-byte budget at ${g.contextTokens / 1000}k context:`,
      "",
      "| Install unit | Units | Fit the budget | Worst | Median skills |",
      "|---|---:|---:|---:|---:|",
      ...g.units.map(
        (u) =>
          `| ${u.shape} | ${u.units} | **${u.fitting}/${u.units}** | ${u.worstOverBudget}× | ${u.medianSkills} |`,
      ),
      "",
      `Categories still over budget: ${
        g.categories
          .filter((c) => c.overBudget > 1)
          .map((c) => `\`${c.category}\` (${c.overBudget}×)`)
          .join(", ") || "none"
      }`,
      "",
      "</details>",
      "",
    );
  }

  const capped = footprint.truncatedDescriptions.length;
  say(
    `<details><summary>10 longest descriptions</summary>`,
    "",
    capped === 0
      ? `No description hits the per-description cap (\`${footprint.loader.maxDescChars}\` chars) — ` +
          `the aggregate budget above is the binding constraint, not individual length.`
      : `**${capped}** description(s) exceed the per-description cap of \`${footprint.loader.maxDescChars}\` chars and are truncated with an ellipsis.`,
    "",
    "| Skill | Chars |",
    "|---|---:|",
    ...footprint.longestDescriptions.map((r) => `| ${skillLink(r)} | ${r.chars} |`),
    "",
    "</details>",
    "",
  );
}

// ── Coverage ────────────────────────────────────────────────────────────────
if (coverage) {
  say(
    "<details><summary>Coverage by class</summary>",
    "",
    "| Domain / class | Skills |",
    "|---|---|",
    ...Object.entries(coverage.byClass)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `| \`${k}\` | ${v} |`),
    "",
    "</details>",
    "",
  );
}

// ── Upstream fetch health ───────────────────────────────────────────────────
if (upstream) {
  const failed = Object.entries(upstream).filter(([, v]) => v?.error);
  if (failed.length) {
    say(
      `### Upstream endpoints failing (${failed.length})`,
      "",
      ...failed.map(([k, v]) => `- \`${k}\` — ${v.error}`),
      "",
      "A failing endpoint means the coverage snapshot for that area is missing, not that the docs moved.",
      "",
    );
  }
}

say(
  "---",
  "",
  "<sub>Regenerated by the weekly crawl. Raw JSON is attached to the run as an artifact.</sub>",
);

process.stdout.write(`${out.join("\n")}\n`);
