// Report-only link checker for the skill library.
// Extracts Apple/Swift/Android/Kotlin documentation links from every SKILL.md
// (frontmatter + body) and checks them, throttled. Reports non-2xx/3xx.
//
//   node scripts/check-links.mjs [skillsRoot=skills] [--strict] [--all] [--json=<path>]
//
// Notes:
//  - developer.apple.com and developer.android.com render docs as SPAs that
//    sometimes return 200 even for wrong deep links, so a 200 is necessary but
//    not sufficient. This catches hard 404s/DNS/typo'd hosts, not every stale
//    anchor.
//  - Results split three ways: ok, dead (a 4xx that survived a GET retry) and
//    unverified (5xx/429/timeout that outlived every retry). Conflating the last
//    two is what made every link this ever reported a false positive.
//  - Default exit code is 0 (report-only). --strict fails on dead only; a vendor
//    host we merely could not reach must never redden a build.
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const checkAll = args.includes("--all");
const root = args.find((a) => !a.startsWith("--")) ?? "skills";
// Machine-readable output, so the weekly crawl can fold results into its report.
const jsonPath = args.find((a) => a.startsWith("--json="))?.slice("--json=".length);

const HOST_RE =
  /^https:\/\/(developer\.apple\.com|support\.apple\.com|swift\.org|github\.com\/apple|developer\.android\.com|android-developers\.googleblog\.com|kotlinlang\.org|m3\.material\.io|developer\.chrome\.com|source\.android\.com|github\.com\/android|play\.google\.com|support\.google\.com|developers\.google\.com|ai\.google\.dev)\//;
// Allow one level of balanced parens so Apple method URLs survive intact,
// e.g. .../view/sheet(isPresented:onDismiss:content:) and .../tint(_:).
const URL_RE = /https?:\/\/[^\s<>"'\]()]+(?:\([^\s()]*\))?[^\s<>"'\])]*/g;

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e[0] === ".") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e === "SKILL.md") acc.push(p);
  }
  return acc;
}

const files = walk(root);
const linkToFiles = new Map();
for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(URL_RE)) {
    const url = m[0].replace(/[.,;]+$/, "");
    if (!checkAll && !HOST_RE.test(url)) continue;
    (linkToFiles.get(url) ?? linkToFiles.set(url, new Set()).get(url)).add(f);
  }
}

const links = [...linkToFiles.keys()].sort();
console.log(`Checking ${links.length} unique links across ${files.length} skills…\n`);

// Two deliberate non-choices, both measured against the live hosts:
//  - No custom User-Agent. Spoofing a browser UA *breaks* developer.android.com,
//    which answers it with an OAuth-consent redirect loop that never resolves.
//    The default undici UA gets a clean 200 there.
//  - redirect stays "follow". developer.android.com answers unknown paths with a
//    302, not a 404, so treating 3xx as alive without following would wave real
//    dead links straight through.
const TIMEOUT_MS = 10_000;
const ATTEMPTS = 3;

const req = (url, method) =>
  fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });

// HEAD is widely under-supported: support.google.com answers it with 404 on a
// page that GET serves 200. Anything short of a clean 2xx/3xx therefore earns a
// GET before we believe it.
async function attempt(url) {
  const res = await req(url, "HEAD");
  if (res.status >= 200 && res.status < 400) return res.status;
  return (await req(url, "GET")).status;
}

// Returns { kind: "ok" | "dead" | "unverified", status }.
//  dead       a 4xx that survived the GET escalation — settled, actionable.
//  unverified 5xx / 429 / timeout / network error that outlived every retry.
//             "could not reach", which is not the same claim as "broken".
// Only transient classes are retried; re-asking a settled 404 just costs time.
async function check(url) {
  let last = "ERR unknown";
  for (let i = 0; i < ATTEMPTS; i++) {
    try {
      const status = await attempt(url);
      if (status >= 200 && status < 400) return { kind: "ok", status };
      if (status >= 400 && status < 500 && status !== 429) return { kind: "dead", status };
      last = status;
    } catch (err) {
      last = `ERR ${err instanceof Error ? err.message : err}`;
    }
    // 0.5s, 1.5s, plus jitter so parallel workers don't retry in lockstep.
    if (i < ATTEMPTS - 1) {
      const backoff = 500 * 3 ** i + Math.random() * 250;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  return { kind: "unverified", status: last };
}

const dead = [];
const unverified = [];
const CONCURRENCY = 5;
let i = 0;
async function worker() {
  while (i < links.length) {
    const url = links[i++];
    const { kind, status } = await check(url);
    if (kind === "ok") continue;
    (kind === "dead" ? dead : unverified).push({ url, status });
    console.log(`  ${kind === "dead" ? "✗" : "?"} ${status}  ${url}`);
    for (const f of linkToFiles.get(url)) console.log(`        ${f}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n${dead.length} dead / ${unverified.length} unverified / ${links.length} links.`);

if (jsonPath) {
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(
    jsonPath,
    `${JSON.stringify(
      {
        checked: links.length,
        dead: dead.map((d) => ({ ...d, files: [...(linkToFiles.get(d.url) ?? [])] })),
        unverified: unverified.map((d) => ({
          ...d,
          files: [...(linkToFiles.get(d.url) ?? [])],
        })),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Wrote ${jsonPath}`);
}

if (strict && dead.length) process.exit(1);
