import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { resolveContent, type ContentSource } from "../content/source";
import { claudeEmitter } from "../emitters";
import { applyFiles } from "../core/writer";
import type { EmitContext, EmittedFile, TargetId } from "../types";
import type { SkillClass } from "../schema/frontmatter";
import { log } from "../util/log";

const CLASS_LABEL: Record<SkillClass, string> = {
  code: "code skills (frameworks & APIs)",
  design: "design-review skills",
  "lang-tooling": "language, build, test & ship skills",
  overview: "decision-guidance routers",
};

const CLASS_CATEGORY: Record<SkillClass, string> = {
  code: "development",
  design: "design",
  "lang-tooling": "development",
  overview: "development",
};

/** Directory holding the generated per-class plugins, relative to the output root. */
const PLUGINS_DIR = "plugins";
/** The generated marketplace manifest, relative to the output root. */
const MARKETPLACE_JSON = ".claude-plugin/marketplace.json";

function pluginName(domain: string, cls: SkillClass): string {
  const clsSeg = cls === "overview" ? "overviews" : cls;
  return `skills-master-${domain}-${clsSeg}`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

/** Every file under `dir`, as output-root-relative POSIX paths. */
function listFiles(root: string, dir: string, acc: string[] = []): string[] {
  const abs = join(root, dir);
  if (!existsSync(abs)) return acc;
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) listFiles(root, rel, acc);
    else acc.push(rel);
  }
  return acc;
}

export interface MarketplaceBuildOptions {
  content?: string;
  cwd?: string;
  /** output root for .claude-plugin/ and plugins/ (defaults to the repo root above skills/). */
  out?: string;
  /** when true, verify the committed marketplace output is up to date (CI mode). */
  check?: boolean;
  version?: string;
}

interface MarketplaceOutput {
  /** every generated file, keyed by output-root-relative POSIX path. */
  files: Map<string, string>;
  /** per-plugin skill counts, for logging. */
  counts: { name: string; count: number }[];
  pluginCount: number;
}

/**
 * Compute the complete marketplace projection in memory. Both the write and the
 * `--check` paths run through this, so CI verifies exactly what `build` writes.
 */
function buildOutputs(content: ContentSource, out: string, version: string): MarketplaceOutput {
  // Group emitted files by (domain, class).
  const groups = new Map<string, { domain: string; cls: SkillClass; files: EmittedFile[]; count: number }>();

  for (const dir of content.skillDirs()) {
    const skill = content.loadSkill(dir.split(/[\\/]/).pop()!);
    const xm = skill.frontmatter["x-skills-master"];
    const key = `${xm.domain}:${xm.class}`;
    const name = pluginName(xm.domain, xm.class);
    const ctx: EmitContext = {
      projectRoot: out,
      paths: {
        claude: `${PLUGINS_DIR}/${name}/skills`,
        cursor: "",
        copilot: "",
        agents: "",
      } as Record<TargetId, string>,
    };
    const files = claudeEmitter.emit(skill, ctx);
    const g = groups.get(key) ?? { domain: xm.domain, cls: xm.class, files: [], count: 0 };
    g.files.push(...files);
    g.count += 1;
    groups.set(key, g);
  }

  const outFiles = new Map<string, string>();
  const counts: { name: string; count: number }[] = [];
  const plugins: {
    name: string;
    source: string;
    description: string;
    version: string;
    category: string;
  }[] = [];

  for (const { domain, cls, files, count } of groups.values()) {
    const name = pluginName(domain, cls);
    for (const f of files) outFiles.set(toPosix(f.path), f.contents);

    const description = `${titleCase(domain)} ${CLASS_LABEL[cls]}.`;
    const manifest = {
      name,
      version,
      description,
      author: { name: "skills-master contributors" },
    };
    outFiles.set(
      `${PLUGINS_DIR}/${name}/.claude-plugin/plugin.json`,
      JSON.stringify(manifest, null, 2) + "\n",
    );

    plugins.push({ name, source: `./${PLUGINS_DIR}/${name}`, description, version, category: CLASS_CATEGORY[cls] });
    counts.push({ name, count });
  }

  plugins.sort((a, b) => a.name.localeCompare(b.name));
  counts.sort((a, b) => a.name.localeCompare(b.name));
  const marketplace = {
    $schema: "https://www.schemastore.org/claude-code-marketplace.json",
    name: "skills-master",
    owner: { name: "skills-master contributors" },
    plugins,
  };
  outFiles.set(MARKETPLACE_JSON, JSON.stringify(marketplace, null, 2) + "\n");

  return { files: outFiles, counts, pluginCount: plugins.length };
}

/** Build (or verify) the plugin marketplace from the skill tree. Returns true on success. */
export async function marketplaceBuildCommand(opts: MarketplaceBuildOptions): Promise<boolean> {
  const content = await resolveContent({ content: opts.content, cwd: opts.cwd });
  const out = resolve(opts.out ?? dirname(content.root));
  const version = opts.version ?? "0.1.0";

  const { files, counts, pluginCount } = buildOutputs(content, out, version);

  // Everything under plugins/ plus the marketplace manifest is generated, so any
  // on-disk file outside the expected set is stale and must not survive a build.
  const onDisk = new Set(listFiles(out, PLUGINS_DIR));
  if (existsSync(join(out, MARKETPLACE_JSON))) onDisk.add(MARKETPLACE_JSON);

  if (opts.check) {
    const missing: string[] = [];
    const differing: string[] = [];
    for (const [rel, contents] of files) {
      if (!onDisk.has(rel)) {
        missing.push(rel);
        continue;
      }
      if (readFileSync(join(out, rel), "utf8") !== contents) differing.push(rel);
    }
    const stale = [...onDisk].filter((rel) => !files.has(rel)).sort();

    if (missing.length || differing.length || stale.length) {
      log.error(
        `Marketplace output is out of date (${missing.length} missing, ${differing.length} changed, ${stale.length} stale) — run \`pnpm skills:marketplace\` and commit the result.`,
      );
      for (const rel of missing.sort().slice(0, 10)) log.error(`  missing: ${rel}`);
      for (const rel of differing.sort().slice(0, 10)) log.error(`  changed: ${rel}`);
      for (const rel of stale.slice(0, 10)) log.error(`  stale:   ${rel}`);
      return false;
    }
    log.success(`Marketplace output is up to date (${pluginCount} plugins, ${files.size} files).`);
    return true;
  }

  // Delete stale output first: a skill that moved to another class, or was
  // renamed or removed, would otherwise keep shipping from its old plugin.
  const stale = [...onDisk].filter((rel) => !files.has(rel)).sort();
  for (const rel of stale) rmSync(join(out, rel), { force: true });
  pruneEmptyDirsUnder(join(out, PLUGINS_DIR));

  const emitted: EmittedFile[] = [...files].map(([path, contents]) => ({ path, contents, mode: "whole" }));
  applyFiles(out, emitted, { overwrite: true });

  for (const { name, count } of counts) log.info(`Built ${name} (${count} skills).`);
  if (stale.length) log.info(`Removed ${stale.length} stale file(s).`);
  log.success(`Wrote ${MARKETPLACE_JSON} (${pluginCount} plugins, ${files.size} files).`);
  return true;
}

/** Recursively drop directories left empty after stale files were removed. */
function pruneEmptyDirsUnder(root: string): void {
  if (!existsSync(root)) return;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirsUnder(join(root, entry.name));
  }
  if (readdirSync(root).length === 0) rmSync(root, { recursive: true, force: true });
}
