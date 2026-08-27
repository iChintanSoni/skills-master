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

/** `upstream` isn't in registry.json either — read it from the frontmatter block. */
function upstreamOf(entry: RegistryEntry): string[] {
  try {
    const text = readFileSync(join(REPO_ROOT, "skills", entry.path, "SKILL.md"), "utf8");
    const block = /^\s+upstream:\s*\n((?:\s+- .*\n)+)/m.exec(text);
    if (block)
      return block[1]!
        .split("\n")
        .map((l) => l.replace(/^\s*-\s*/, "").trim())
        .filter(Boolean);
    const inline = /^\s+upstream:\s*\[(.+)\]\s*$/m.exec(text);
    if (inline)
      return inline[1]!
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    return [];
  } catch {
    return [];
  }
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

/**
 * Which skills document something that has shipped since they were last checked.
 *
 * `snapshot_date` on its own only says when a batch ran. This joins it to the
 * vendor's own release feed through the `upstream` names a skill declares, so
 * "89 days old" becomes "89 days old, and Media3 has shipped four times since".
 * That difference is the whole point: the first is a date, the second is a
 * reason to open the file.
 */
function currency(reg: Registry, upstream: Record<string, unknown>) {
  const dated: { title: string; date: string }[] = [];
  for (const value of Object.values(upstream)) {
    const topics = (value as { topics?: Topic[] }).topics;
    for (const t of topics ?? []) if (t.date) dated.push({ title: t.title, date: t.date });
  }

  /** "Media3 Version 1.11.0-beta01" → 1.11.0-beta01. */
  const versionIn = (title: string) => /\bVersion (\S+)/.exec(title)?.[1];
  const isPrerelease = (v: string) => /-(alpha|beta|rc|dev)/i.test(v);
  const majorMinor = (v: string): [number, number] => {
    const m = /^(\d+)\.(\d+)/.exec(v);
    return m ? [Number(m[1]), Number(m[2])] : [0, 0];
  };
  /** Newest non-prerelease version seen for a library. */
  const latestStableOf = (name: string): string | undefined =>
    dated
      .filter((d) => d.title.toLowerCase().startsWith(name.toLowerCase()))
      .map((d) => versionIn(d.title))
      .filter((v): v is string => Boolean(v) && !isPrerelease(v as string))
      .sort((a, b) => {
        const [am, an] = majorMinor(a);
        const [bm, bn] = majorMinor(b);
        return bm - am || bn - an;
      })[0];

  const declared: {
    name: string;
    path: string;
    snapshot: string | null;
    upstream: string[];
    latest: string | null;
    behindDays: number | null;
    releasesSince: number;
    /** stable releases only — an alpha stream should not outrank one considered release. */
    stableSince: number;
    /** stable releases that were a new minor or major, not a patch roll-up. */
    minorOrMajorSince: number;
    /** set when the skill pins a version and upstream's stable has moved past it. */
    versionLag: { library: string; documented: string; stable: string } | null;
    reason: string;
  }[] = [];
  let undeclared = 0;

  for (const s of reg.skills) {
    const declarations = upstreamOf(s);
    if (declarations.length === 0) {
      undeclared += 1;
      continue;
    }
    // `Glance@1.2` pins the version the skill documents; a bare name does not.
    const parsed = declarations.map((d) => {
      const [library, documented] = d.split("@");
      return { library: library!.trim(), documented: documented?.trim() };
    });
    const names = parsed.map((p) => p.library);

    const snapshot = snapshotDateOf(s);
    // A feed title reads "Media3 Version 1.11.0-beta01"; match on the library
    // half so a declaration does not have to name every version.
    const matches = dated.filter((d) =>
      names.some((n) => d.title.toLowerCase().startsWith(n.toLowerCase())),
    );
    const latest =
      matches
        .map((m) => m.date)
        .sort()
        .at(-1) ?? null;
    const since = snapshot ? matches.filter((m) => m.date > snapshot) : [];
    const stableReleases = since.filter((m) => {
      const v = versionIn(m.title);
      return v != null && !isPrerelease(v);
    });
    const stableSince = stableReleases.length;
    // A patch is a bug-fix roll-up; the 1.1 pilot found none of them worth a
    // refresh, while a new minor or major was material both times.
    const minorOrMajorSince = stableReleases.filter((m) => {
      const v = versionIn(m.title)!;
      return /^\d+\.\d+\.0(\b|$)/.test(v);
    }).length;

    // The signal the 1.1 pilot actually validated: the skill names a version
    // older than the current stable. Independent of dates, which is why it
    // catches staleness a bulk `snapshot_date` would otherwise hide.
    let versionLag: { library: string; documented: string; stable: string } | null = null;
    for (const p of parsed) {
      if (!p.documented) continue;
      const stable = latestStableOf(p.library);
      if (!stable) continue;
      const [dm, dn] = majorMinor(p.documented);
      const [sm, sn] = majorMinor(stable);
      if (sm > dm || (sm === dm && sn > dn)) {
        versionLag = { library: p.library, documented: p.documented, stable };
        break;
      }
    }

    declared.push({
      name: s.name,
      path: s.path,
      snapshot,
      upstream: declarations,
      latest,
      // Why this row is in the queue, so a reader can tell signal from noise
      // without opening the release notes. `pre-release` rows are the ones the
      // 1.1 pilot found were never worth a refresh.
      reason: versionLag
        ? "version-lag"
        : minorOrMajorSince > 0
          ? "new minor/major"
          : stableSince > 0
            ? "patch only"
            : since.length > 0
              ? "pre-release only"
              : "current",
      behindDays:
        snapshot && latest && latest > snapshot
          ? Math.round((Date.parse(latest) - Date.parse(snapshot)) / 86_400_000)
          : null,
      releasesSince: since.length,
      stableSince,
      minorOrMajorSince,
      versionLag,
    });
  }

  // Rank by what the 1.1 pilot showed actually predicts a real refresh:
  // a documented version behind current stable beats any number of releases,
  // and a stable release beats a stream of alphas. Pre-releases still appear —
  // ranked last rather than filtered out, because dropping them silently is how
  // a queue starts lying.
  const score = (d: (typeof declared)[number]) =>
    (d.versionLag ? 1000 : 0) +
    d.minorOrMajorSince * 10 +
    d.stableSince * 2 +
    (d.behindDays ?? 0) / 1000;
  declared.sort((a, b) => score(b) - score(a));

  const isBehind = (d: (typeof declared)[number]) => d.versionLag !== null || d.behindDays !== null;
  return {
    declared: declared.length,
    undeclared,
    behind: declared.filter(isBehind),
    current: declared.filter((d) => !isBehind(d)),
  };
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

interface Topic {
  title: string;
  url: string;
  /** ISO date the feed published this entry, when it says. */
  date?: string;
}

/** The entry's own timestamp — Atom `updated`/`published`, or RSS `pubDate`. */
function entryDate(content: string): string | undefined {
  const m =
    /<updated>([\s\S]*?)<\/updated>/i.exec(content) ??
    /<published>([\s\S]*?)<\/published>/i.exec(content) ??
    /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(content);
  if (!m) return undefined;
  const parsed = Date.parse(m[1].trim());
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString().slice(0, 10);
}

/**
 * A release page that groups links under dated headings:
 *
 *   <h2 id="august_26_2026" data-text="August 26, 2026">August 26, 2026</h2>
 *   <ul><li><a href="…">Camera Version 1.6.2</a></li>…</ul>
 *
 * Same shape as the Atom feed's inner links, so the titles parse identically —
 * the difference is that this page is actually current.
 */
function parseDatedHtml(html: string, baseUrl: string): Topic[] {
  const topics: Topic[] = [];
  const headingRegex = /<h2[^>]*data-text="([^"]+)"[^>]*>/gi;
  const headings: { date: string; index: number }[] = [];
  for (let m = headingRegex.exec(html); m !== null; m = headingRegex.exec(html)) {
    const parsed = Date.parse(m[1]!);
    if (!Number.isNaN(parsed)) {
      headings.push({ date: new Date(parsed).toISOString().slice(0, 10), index: m.index });
    }
  }

  for (const [i, h] of headings.entries()) {
    const section = html.slice(h.index, headings[i + 1]?.index ?? html.length);
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    for (let m = linkRegex.exec(section); m !== null; m = linkRegex.exec(section)) {
      const title = stripHtmlTags(m[2]!).trim();
      if (!title) continue;
      const href = m[1]!;
      topics.push({
        title,
        url: href.startsWith("http") ? href : new URL(href, baseUrl).toString(),
        date: h.date,
      });
    }
  }
  return topics;
}

function parseXmlFeed(xmlText: string): Topic[] {
  const topics: Topic[] = [];

  // Extract <entry>...</entry> or <item>...</item>
  const entryRegex = /<(entry|item)>([\s\S]*?)<\/\1>/gi;
  for (let match = entryRegex.exec(xmlText); match !== null; match = entryRegex.exec(xmlText)) {
    const content = match[2];
    // AndroidX groups a day's releases under one dated entry, so the date lives
    // on the wrapper and has to be carried down to each library link inside it.
    // Without this the feed can say what shipped but never when.
    const date = entryDate(content);

    // Check if there are nested links inside <content> (specific to AndroidX release notes XML)
    const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let foundInnerLinks = false;
    for (let aMatch = aTagRegex.exec(content); aMatch !== null; aMatch = aTagRegex.exec(content)) {
      const url = aMatch[1].trim();
      const title = stripHtmlTags(aMatch[2]).trim();
      if (url && title) {
        topics.push({ title, url, ...(date ? { date } : {}) });
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
        topics.push({ title, url, ...(date ? { date } : {}) });
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

/**
 * Apple's dated source, such as it is.
 *
 * Apple publishes one "<Framework> updates" page per framework, and those pages
 * are the only Apple content found carrying dates — `## June 2026` headings,
 * month granularity rather than the day granularity androidx gives. Month is
 * enough to answer "has this moved since my snapshot" and not enough to answer
 * "by how much", so the report reads a month as its first day and says so.
 *
 * Fetched per declared framework rather than for all 208 pages: a crawl that
 * makes 208 requests to answer a question about 20 skills is a crawl someone
 * will eventually turn off.
 */
async function fetchAppleUpdates(declared: string[]): Promise<Topic[]> {
  if (declared.length === 0) return [];
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

  const indexUrl = "https://developer.apple.com/tutorials/data/documentation/updates.json";
  const index = (await (
    await fetch(indexUrl, { headers: { accept: "application/json" } })
  ).json()) as {
    references?: Record<string, { title?: string; url?: string; type?: string }>;
  };
  const pages = new Map<string, { title: string; url: string }>();
  for (const ref of Object.values(index.references ?? {})) {
    if (ref.type !== "topic" || !ref.url?.startsWith("/documentation/updates/")) continue;
    pages.set(slug(ref.url.split("/").pop() ?? ""), {
      title: ref.title ?? "",
      url: `https://developer.apple.com${ref.url}`,
    });
  }

  const topics: Topic[] = [];
  for (const name of [...new Set(declared)]) {
    const page = pages.get(slug(name));
    if (!page) continue;
    try {
      const json = (await (
        await fetch(
          `https://developer.apple.com/tutorials/data${page.url.replace("https://developer.apple.com", "")}.json`,
          { headers: { accept: "application/json" } },
        )
      ).json()) as unknown;

      // Headings are nested arbitrarily deep in the render JSON; a walk is more
      // robust than guessing the shape, which Apple changes.
      const headings: string[] = [];
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return void node.forEach(walk);
        if (node && typeof node === "object") {
          const o = node as { type?: string; text?: string };
          if (o.type === "heading" && typeof o.text === "string") headings.push(o.text);
          Object.values(node).forEach(walk);
        }
      };
      walk((json as { primaryContentSections?: unknown }).primaryContentSections);

      // Build the date in UTC. `Date.parse("June 2026 01")` yields local
      // midnight, which `toISOString` then renders as the 31st of May in any
      // timezone east of UTC — a silent off-by-one on every Apple entry.
      const MONTHS =
        "january february march april may june july august september october november december".split(
          " ",
        );
      const dates = headings
        .map((h) => /^([A-Za-z]+) (\d{4})$/.exec(h))
        .flatMap((m) => {
          if (!m) return [];
          const month = MONTHS.indexOf(m[1]!.toLowerCase());
          return month === -1 ? [] : [Date.UTC(Number(m[2]), month, 1)];
        })
        .sort((a, b) => b - a);
      if (dates.length === 0) continue;
      topics.push({
        title: `${name} updates`,
        url: page.url,
        date: new Date(dates[0]!).toISOString().slice(0, 10),
      });
    } catch {
      // A framework whose page moved is unmeasured, not an error worth failing on.
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

  // Android endpoints: Atom/RSS feeds, or a page grouped by dated headings.
  for (const ep of ANDROID_ENDPOINTS) {
    try {
      // Ask for English explicitly: these hosts content-negotiate, and a
      // localized page yields date headings no parser here can read.
      const res = await fetch(ep.url, { headers: { "accept-language": "en-US,en;q=0.9" } });
      if (!res.ok) {
        out[ep.key] = { error: `HTTP ${res.status}` };
        continue;
      }
      const body = await res.text();
      // Newest first, so the cap keeps the recent window and drops history we
      // have no use for — "has anything shipped since my snapshot" only ever
      // looks forward. At 2000 that window is currently ~3 months of androidx.
      const topics = (
        ep.format === "html" ? parseDatedHtml(body, ep.url) : parseXmlFeed(body)
      ).slice(0, 2000);
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

    // Apple's per-framework update pages, fetched only for what skills declare.
    // Added before the file is written — an earlier version mutated `upstream`
    // afterwards, so the report used it but the artifact on disk never had it.
    const declaredApple = reg.skills.filter((s) => s.domain === "apple").flatMap(upstreamOf);
    const appleTopics = await fetchAppleUpdates(declaredApple);
    const unresolved = [...new Set(declaredApple)].filter(
      (n) => !appleTopics.some((t) => t.title === `${n} updates`),
    );
    upstream["apple-updates"] = { count: appleTopics.length, topics: appleTopics, unresolved };

    writeFileSync(join(REPORTS, "upstream.json"), JSON.stringify(upstream, null, 2) + "\n");
    for (const [k, v] of Object.entries(upstream)) {
      const info = v as { count?: number; error?: string };
      console.log(`  ${k}: ${info.error ? `ERROR ${info.error}` : `${info.count} topics`}`);
    }
    // A declaration that matches no page is unmeasured, and silence about it is
    // how the Arabic bug in 0.2 stayed hidden. Name them.
    if (unresolved.length) {
      console.log(`  apple-updates: no dated page for ${unresolved.join(", ")}`);
    }

    // Only meaningful with a fresh fetch: a stale upstream.json would report
    // skills as current because the feed itself had not been re-read.
    const cur = currency(reg, upstream);
    writeFileSync(join(REPORTS, "currency.json"), JSON.stringify(cur, null, 2) + "\n");
    console.log(
      `Currency: ${cur.behind.length} of ${cur.declared} skill(s) with a declared upstream ` +
        `have shipped since their snapshot (${cur.undeclared} declare none yet)`,
    );
    for (const b of cur.behind.slice(0, 5)) {
      console.log(
        `  ${b.name.padEnd(30)} ${b.snapshot} → ${b.latest} (${b.releasesSince} release(s))`,
      );
    }
  }

  console.log(`Reports written to ${REPORTS}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
