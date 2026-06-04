/**
 * Report-only crawler. Produces:
 *   - reports/coverage.json   — skill counts per domain/class/category
 *   - reports/staleness.json  — skills ranked by how old their snapshot_date is
 *
 * With `--fetch` it additionally pulls Apple's render-JSON endpoints and writes
 * reports/upstream.json (a structural snapshot of upstream topic titles/URLs)
 * so a human can diff coverage against it. It NEVER writes skill prose.
 *
 *   pnpm exec tsx scripts/crawl/bin.ts            # offline coverage + staleness
 *   pnpm exec tsx scripts/crawl/bin.ts --fetch    # also snapshot upstream topics
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { APPLE_ENDPOINTS } from "./endpoints";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../..");
const REGISTRY = join(REPO_ROOT, "skills", "registry.json");
const REPORTS = join(HERE, "reports");

interface RegistryEntry {
  name: string;
  domain: string;
  class: string;
  category: string;
  path: string;
  version: string;
  stability: string;
}

interface Registry {
  skills: RegistryEntry[];
}

function loadRegistry(): Registry {
  return JSON.parse(readFileSync(REGISTRY, "utf8")) as Registry;
}

/** snapshot_date isn't in registry.json, so read it from each SKILL.md frontmatter. */
function snapshotDateOf(entry: RegistryEntry): string | null {
  try {
    const text = readFileSync(join(REPO_ROOT, "skills", entry.path, "SKILL.md"), "utf8");
    const m = /snapshot_date:\s*"?(\d{4}-\d{2}-\d{2})"?/.exec(text);
    return m ? m[1]! : null;
  } catch {
    return null;
  }
}

function coverage(reg: Registry) {
  const byDomain: Record<string, number> = {};
  const byClass: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const s of reg.skills) {
    byDomain[s.domain] = (byDomain[s.domain] ?? 0) + 1;
    byClass[`${s.domain}/${s.class}`] = (byClass[`${s.domain}/${s.class}`] ?? 0) + 1;
    byCategory[`${s.domain}/${s.class}/${s.category}`] =
      (byCategory[`${s.domain}/${s.class}/${s.category}`] ?? 0) + 1;
  }
  return { total: reg.skills.length, byDomain, byClass, byCategory };
}

function staleness(reg: Registry) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = reg.skills.map((s) => {
    const date = snapshotDateOf(s);
    const ageDays = date
      ? Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000)
      : null;
    return { name: s.name, path: s.path, stability: s.stability, snapshot_date: date, ageDays };
  });
  rows.sort((a, b) => (b.ageDays ?? Infinity) - (a.ageDays ?? Infinity));
  return rows;
}

async function fetchUpstream() {
  const out: Record<string, unknown> = {};
  for (const ep of APPLE_ENDPOINTS) {
    try {
      const res = await fetch(ep.url, { headers: { accept: "application/json" } });
      if (!res.ok) {
        out[ep.key] = { error: `HTTP ${res.status}` };
        continue;
      }
      const data: any = await res.json();
      // Keep only structural fields (titles/identifiers), never prose.
      const refs = data?.references ?? {};
      const topics = Object.values(refs)
        .filter((r: any) => r?.title && r?.url)
        .map((r: any) => ({ title: r.title, url: r.url }))
        .slice(0, 2000);
      out[ep.key] = { count: topics.length, topics };
    } catch (err) {
      out[ep.key] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return out;
}

async function main() {
  const doFetch = process.argv.includes("--fetch");
  mkdirSync(REPORTS, { recursive: true });
  const reg = loadRegistry();

  const cov = coverage(reg);
  writeFileSync(join(REPORTS, "coverage.json"), JSON.stringify(cov, null, 2) + "\n");

  const stale = staleness(reg);
  writeFileSync(join(REPORTS, "staleness.json"), JSON.stringify(stale, null, 2) + "\n");

  console.log(`Coverage: ${cov.total} skills`);
  for (const [k, v] of Object.entries(cov.byClass)) console.log(`  ${k}: ${v}`);
  const oldest = stale[0];
  if (oldest?.ageDays != null) {
    console.log(`Oldest snapshot: ${oldest.name} (${oldest.snapshot_date}, ${oldest.ageDays}d)`);
  }

  if (doFetch) {
    console.log("Fetching Apple render-JSON endpoints…");
    const upstream = await fetchUpstream();
    writeFileSync(join(REPORTS, "upstream.json"), JSON.stringify(upstream, null, 2) + "\n");
    for (const [k, v] of Object.entries(upstream)) {
      const info = v as { count?: number; error?: string };
      console.log(`  ${k}: ${info.error ? `ERROR ${info.error}` : `${info.count} topics`}`);
    }
  }

  console.log(`Reports written to ${REPORTS}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
