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
