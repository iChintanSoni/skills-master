// Regenerates docs/taxonomy.md from skills/registry.json.
//
//   node scripts/gen-taxonomy.mjs [--check]
//
// --check exits non-zero if the committed doc is stale (mirrors the
// `registry build --check` drift gate) without writing anything.
//
// Run this after `pnpm skills:registry` whenever skills are added, removed,
// or re-classified — the doc is generated, never hand-edited.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = join(REPO_ROOT, "skills", "registry.json");
const OUT = join(REPO_ROOT, "docs", "taxonomy.md");

// Classes in schema order; domains in README order, then any newcomers.
const CLASSES = ["code", "design", "lang-tooling", "overview"];
const DOMAIN_ORDER = ["apple", "android"];
const RESOURCE_KEYS = ["reference", "examples", "checklist"];

const byName = (a, b) => a.localeCompare(b);

function domains(skills) {
  const seen = [...new Set(skills.map((s) => s.domain))];
  return [
    ...DOMAIN_ORDER.filter((d) => seen.includes(d)),
    ...seen.filter((d) => !DOMAIN_ORDER.includes(d)).sort(byName),
  ];
}

/** Trailing annotations: resources, then stability (if notable), then pairs. */
function annotations(skill) {
  const parts = RESOURCE_KEYS.filter((k) => skill.resources?.[k]);
  if (skill.stability !== "stable") parts.push(skill.stability);
  for (const partner of [...(skill.pairs_with ?? [])].sort(byName)) {
    parts.push(`↔ ${partner}`);
  }
  return parts.length ? `  — ${parts.join(", ")}` : "";
}

function countsTable(skills, doms) {
  const cell = (d, c) => skills.filter((s) => s.domain === d && s.class === c).length;
  const rows = doms.map((d) => {
    const per = CLASSES.map((c) => cell(d, c));
    const sum = per.reduce((a, b) => a + b, 0);
    return `| \`${d}\` | ${per.join(" | ")} | ${sum} |`;
  });
  const totals = CLASSES.map((c) => skills.filter((s) => s.class === c).length);
  return [
    `| Domain | ${CLASSES.map((c) => `\`${c}\``).join(" | ")} | Total |`,
    `|---|${CLASSES.map(() => "---:").join("|")}|---:|`,
    ...rows,
    `| **All** | ${totals.map((n) => `**${n}**`).join(" | ")} | **${skills.length}** |`,
  ].join("\n");
}

function render(skills) {
  const doms = domains(skills);
  const withL3 = skills.filter((s) => RESOURCE_KEYS.some((k) => s.resources?.[k])).length;

  const out = [
    "# Skill coverage",
    "",
    `Generated from \`skills/registry.json\`. **${skills.length} skills** across ${doms.length} domains ` +
      `(${doms.map((d) => `\`${d}\``).join(", ")}). Regenerate after each change with ` +
      "`node scripts/gen-taxonomy.mjs`.",
    "",
    countsTable(skills, doms),
    "",
    `Skills with Level-3 resources (examples/checklist/reference): **${withL3}**.`,
  ];

  for (const domain of doms) {
    for (const cls of CLASSES) {
      const inClass = skills.filter((s) => s.domain === domain && s.class === cls);
      for (const category of [...new Set(inClass.map((s) => s.category))].sort(byName)) {
        const entries = inClass
          .filter((s) => s.category === category)
          .sort((a, b) => byName(a.name, b.name));
        out.push("", `## ${domain}  ›  ${cls}  ›  ${category}  (${entries.length})`, "");
        for (const s of entries) out.push(`- \`${s.name}\`${annotations(s)}`);
      }
    }
  }
  return out.join("\n") + "\n";
}

const skills = JSON.parse(readFileSync(REGISTRY, "utf8")).skills;
const doc = render(skills);

if (process.argv.includes("--check")) {
  const current = readFileSync(OUT, "utf8");
  if (current !== doc) {
    console.error("docs/taxonomy.md is stale — run: node scripts/gen-taxonomy.mjs");
    process.exit(1);
  }
  console.log(`docs/taxonomy.md is current (${skills.length} skills).`);
} else {
  writeFileSync(OUT, doc);
  console.log(`Wrote docs/taxonomy.md (${skills.length} skills).`);
}
