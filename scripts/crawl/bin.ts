/**
 * Report-only crawler. Produces:
 *   - reports/coverage.json   — skill counts per domain/class/category
 *   - reports/staleness.json  — skills ranked by how old their snapshot_date is
 *   - reports/footprint.json  — per-plugin always-on listing cost vs the agent's budget
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
  description: string;
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
    const ageDays = date ? Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000) : null;
    return { name: s.name, path: s.path, stability: s.stability, snapshot_date: date, ageDays };
  });
  rows.sort((a, b) => (b.ageDays ?? Infinity) - (a.ageDays ?? Infinity));
  return rows;
}

/**
 * Claude Code's skill-listing loader, as measured against 2.1.231.
 *
 * Every installed skill contributes one `- <name>: <description>` line to the
 * always-on listing, and the whole listing is capped at
 * `contextWindow × bytesPerToken × budgetFraction`. Past that cap the agent
 * keeps the highest-priority entries whole and degrades the rest to a bare
 * `- <name>` — the description is dropped, not shortened. So the number that
 * matters is not "how many tokens do our descriptions cost" but "how far past
 * the cap are we", because past it the descriptions stop being read at all.
 */
const LISTING = {
  bytesPerToken: 4,
  /** `skillListingBudgetFraction` default. */
  budgetFraction: 0.01,
  /** `skillListingMaxDescChars` default — per description, not per listing. */
  maxDescChars: 1536,
  /** Context windows worth reporting against: a common model, and a large one. */
  contexts: [200_000, 1_000_000],
} as const;

const budgetBytesFor = (contextTokens: number) =>
  Math.floor(contextTokens * LISTING.bytesPerToken * LISTING.budgetFraction);

/** The plugin a skill ships in — mirrors `CLASS_DIR` (overview → overviews). */
function pluginOf(s: RegistryEntry): string {
  return `skills-master-${s.domain}-${s.class === "overview" ? "overviews" : s.class}`;
}

/** Bytes one skill contributes to the listing, truncation included. */
function listingBytesOf(s: RegistryEntry): number {
  const desc =
    s.description.length > LISTING.maxDescChars
      ? `${s.description.slice(0, LISTING.maxDescChars - 1)}…`
      : s.description;
  return Buffer.byteLength(`- ${s.name}: ${desc}`, "utf8");
}

/** Listing bytes for an arbitrary grouping of skills. */
function groupBy(reg: Registry, keyOf: (s: RegistryEntry) => string) {
  const groups = new Map<string, { skills: number; listingBytes: number }>();
  for (const s of reg.skills) {
    const key = keyOf(s);
    const g = groups.get(key) ?? { skills: 0, listingBytes: 0 };
    g.skills += 1;
    // +1 for the newline joining this entry to the previous one.
    g.listingBytes += listingBytesOf(s) + (g.skills > 1 ? 1 : 0);
    groups.set(key, g);
  }
  return groups;
}

/**
 * How the library would sit against the budget if it were installed in smaller
 * units. The budget is per *install*, not per library, so the question "are we
 * too big?" is really "is the thing a consumer installs too big?" — which is a
 * packaging decision, not a content one.
 */
function granularity(reg: Registry) {
  const budget = budgetBytesFor(LISTING.contexts[0]!);
  const shapes: [string, (s: RegistryEntry) => string][] = [
    ["plugin (domain × class)", pluginOf],
    ["category (domain × class × category)", (s) => `${s.domain}/${s.class}/${s.category}`],
  ];

  const units = shapes.map(([label, keyOf]) => {
    const rows = [...groupBy(reg, keyOf).values()];
    return {
      shape: label,
      units: rows.length,
      fitting: rows.filter((r) => r.listingBytes <= budget).length,
      worstOverBudget: Number((Math.max(...rows.map((r) => r.listingBytes)) / budget).toFixed(2)),
      medianSkills: rows.map((r) => r.skills).sort((a, b) => a - b)[Math.floor(rows.length / 2)],
    };
  });

  const categories = [...groupBy(reg, (s) => `${s.domain}/${s.class}/${s.category}`).entries()]
    .map(([category, g]) => ({
      category,
      skills: g.skills,
      listingBytes: g.listingBytes,
      overBudget: Number((g.listingBytes / budget).toFixed(2)),
    }))
    .sort((a, b) => b.listingBytes - a.listingBytes);

  return { budgetBytes: budget, contextTokens: LISTING.contexts[0], units, categories };
}

function footprint(reg: Registry) {
  const groups = groupBy(reg, pluginOf);

  const budgets = Object.fromEntries(LISTING.contexts.map((c) => [c, budgetBytesFor(c)])) as Record<
    string,
    number
  >;

  const over = (bytes: number) =>
    Object.fromEntries(
      LISTING.contexts.map((c) => [c, Number((bytes / budgetBytesFor(c)).toFixed(2))]),
    ) as Record<string, number>;

  const plugins = [...groups.entries()]
    .map(([plugin, g]) => ({
      plugin,
      skills: g.skills,
      listingBytes: g.listingBytes,
      approxTokens: Math.round(g.listingBytes / LISTING.bytesPerToken),
      overBudget: over(g.listingBytes),
    }))
    .sort((a, b) => b.listingBytes - a.listingBytes);

  const libraryBytes = reg.skills.reduce((n, s) => n + listingBytesOf(s) + 1, -1);
  const truncated = reg.skills.filter((s) => s.description.length > LISTING.maxDescChars);

  return {
    loader: { ...LISTING, measuredAgainst: "Claude Code 2.1.231" },
    budgets,
    plugins,
    library: {
      skills: reg.skills.length,
      listingBytes: libraryBytes,
      approxTokens: Math.round(libraryBytes / LISTING.bytesPerToken),
      overBudget: over(libraryBytes),
    },
    /** Descriptions the per-description cap would itself truncate (none, so far). */
    truncatedDescriptions: truncated.map((s) => ({ name: s.name, chars: s.description.length })),
    granularity: granularity(reg),
    longestDescriptions: [...reg.skills]
      .sort((a, b) => b.description.length - a.description.length)
      .slice(0, 10)
      .map((s) => ({ name: s.name, path: s.path, chars: s.description.length })),
  };
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
  for (let match = entryRegex.exec(xmlText); match !== null; match = entryRegex.exec(xmlText)) {
    const content = match[2];

    // Check if there are nested links inside <content> (specific to AndroidX release notes XML)
    const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let foundInnerLinks = false;
    for (let aMatch = aTagRegex.exec(content); aMatch !== null; aMatch = aTagRegex.exec(content)) {
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
      const title = titleMatch
        ? titleMatch[1]
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/i, "$1")
            .replace(/[<>]/g, "")
            .trim()
        : "";

      let url = "";
      const locMatch = /<loc>([\s\S]*?)<\/loc>/i.exec(content);
      if (locMatch) {
        url = locMatch[1].trim();
      } else {
        const linkMatch =
          /<link\s+[^>]*href=["']([^"']+)["']/i.exec(content) ||
          /<link[^>]*>([\s\S]*?)<\/link>/i.exec(content);
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
    for (let match = urlRegex.exec(xmlText); match !== null; match = urlRegex.exec(xmlText)) {
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
      const data = (await res.json()) as {
        references?: Record<string, { title?: unknown; url?: unknown }>;
      };
      const topics = Object.values(data.references ?? {})
        .filter(
          (r): r is { title: string; url: string } =>
            typeof r?.title === "string" && typeof r?.url === "string",
        )
        .map((r) => ({ title: r.title, url: r.url }))
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

  const foot = footprint(reg);
  writeFileSync(join(REPORTS, "footprint.json"), JSON.stringify(foot, null, 2) + "\n");

  console.log(`Coverage: ${cov.total} skills`);
  for (const [k, v] of Object.entries(cov.byClass)) console.log(`  ${k}: ${v}`);
  const oldest = stale[0];
  if (oldest?.ageDays != null) {
    console.log(`Oldest snapshot: ${oldest.name} (${oldest.snapshot_date}, ${oldest.ageDays}d)`);
  }

  const worst = foot.plugins[0];
  if (worst) {
    const budget200k = foot.budgets["200000"];
    console.log(
      `Listing footprint: worst plugin ${worst.plugin} = ${worst.listingBytes} bytes ` +
        `(${worst.overBudget["200000"]}× the ${budget200k}-byte budget at 200k context)`,
    );
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
