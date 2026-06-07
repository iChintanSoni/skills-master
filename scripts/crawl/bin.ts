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
import { APPLE_ENDPOINTS, ANDROID_ENDPOINTS } from "./endpoints";

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

function stripHtmlTags(input: string): string {
  let previous: string;
  let current = input;
  do {
    previous = current;
    current = current.replace(/<[^>]+>/g, "");
  } while (current !== previous);
  return current;
}

function parseXmlFeed(xmlText: string): { title: string; url: string }[] {
  const topics: { title: string; url: string }[] = [];
  
  // Extract <entry>...</entry> or <item>...</item>
  const entryRegex = /<(entry|item)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const content = match[2];
    
    // Check if there are nested links inside <content> (specific to AndroidX release notes XML)
    const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let aMatch;
    let foundInnerLinks = false;
    while ((aMatch = aTagRegex.exec(content)) !== null) {
      const url = aMatch[1].trim();
      const title = stripHtmlTags(aMatch[2]).trim();
      if (url && title) {
        topics.push({ title, url });
        foundInnerLinks = true;
      }
    }

    if (!foundInnerLinks) {
      // Fallback: extract the main title and link of the entry/item itself
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(content);
      const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, "$1").replace(/[<>]/g, "").trim() : "";
      
      let url = "";
      const locMatch = /<loc>([\s\S]*?)<\/loc>/i.exec(content);
      if (locMatch) {
        url = locMatch[1].trim();
      } else {
        const linkMatch = /<link\s+[^>]*href=["']([^"']+)["']/i.exec(content) || /<link[^>]*>([\s\S]*?)<\/link>/i.exec(content);
        if (linkMatch) {
          url = linkMatch[1].trim();
        }
      }

      if (url && title) {
        topics.push({ title, url });
      }
    }
  }

  // Standard sitemap support
  if (topics.length === 0) {
    const urlRegex = /<url>([\s\S]*?)<\/url>/gi;
    while ((match = urlRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const locMatch = /<loc>([\s\S]*?)<\/loc>/i.exec(content);
      if (locMatch) {
        const url = locMatch[1].trim();
        const title = url.split("/").pop() || url;
        topics.push({ title, url });
      }
    }
  }

  return topics;
}

async function fetchUpstream() {
  const out: Record<string, unknown> = {};
  
  // Apple endpoints
  for (const ep of APPLE_ENDPOINTS) {
    try {
      const res = await fetch(ep.url, { headers: { accept: "application/json" } });
      if (!res.ok) {
        out[ep.key] = { error: `HTTP ${res.status}` };
        continue;
      }
      const data: any = await res.json();
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

  // Android endpoints (XML parsing)
  for (const ep of ANDROID_ENDPOINTS) {
    try {
      const res = await fetch(ep.url);
      if (!res.ok) {
        out[ep.key] = { error: `HTTP ${res.status}` };
        continue;
      }
      const xmlText = await res.text();
      const topics = parseXmlFeed(xmlText).slice(0, 2000);
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
    console.log("Fetching upstream endpoints…");
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
