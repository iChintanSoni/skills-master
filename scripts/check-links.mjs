// Report-only link checker for the skill library.
// Extracts Apple/Swift/Android/Kotlin documentation links from every SKILL.md
// (frontmatter + body) and HEAD-checks them, throttled. Reports non-2xx/3xx.
//
//   node scripts/check-links.mjs [skillsRoot=skills] [--strict] [--all]
//
// Notes:
//  - developer.apple.com and developer.android.com render docs as SPAs that
//    sometimes return 200 even for wrong deep links, so a 200 is necessary but
//    not sufficient. This catches hard 404s/DNS/typo'd hosts, not every stale
//    anchor.
//  - Default exit code is 0 (report-only). Pass --strict to fail on dead links.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const strict = args.includes("--strict");
const checkAll = args.includes("--all");
const root = args.find((a) => !a.startsWith("--")) ?? "skills";

const HOST_RE = /^https:\/\/(developer\.apple\.com|support\.apple\.com|swift\.org|github\.com\/apple|developer\.android\.com|android-developers\.googleblog\.com|kotlinlang\.org|m3\.material\.io|developer\.chrome\.com|source\.android\.com|github\.com\/android|play\.google\.com|support\.google\.com)\//;
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
    let url = m[0].replace(/[.,;]+$/, "");
    if (!checkAll && !HOST_RE.test(url)) continue;
    (linkToFiles.get(url) ?? linkToFiles.set(url, new Set()).get(url)).add(f);
  }
}

const links = [...linkToFiles.keys()].sort();
console.log(`Checking ${links.length} unique links across ${files.length} skills…\n`);

async function check(url) {
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(10000) });
    if (res.status === 403 || res.status === 405) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10000) });
    }
    return res.status;
  } catch (err) {
    return `ERR ${err instanceof Error ? err.message : err}`;
  }
}

const dead = [];
const CONCURRENCY = 5;
let i = 0;
async function worker() {
  while (i < links.length) {
    const url = links[i++];
    const status = await check(url);
    const ok = typeof status === "number" && status >= 200 && status < 400;
    if (!ok) {
      dead.push({ url, status });
      console.log(`  ✗ ${status}  ${url}`);
      for (const f of linkToFiles.get(url)) console.log(`        ${f}`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\n${dead.length} dead / ${links.length} links.`);
if (strict && dead.length) process.exit(1);
