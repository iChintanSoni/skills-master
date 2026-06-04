import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { resolveContent } from "../content/source";
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

function pluginName(domain: string, cls: SkillClass): string {
  const clsSeg = cls === "overview" ? "overviews" : cls;
  return `skills-master-${domain}-${clsSeg}`;
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface MarketplaceBuildOptions {
  content?: string;
  cwd?: string;
  /** output root for .claude-plugin/ and plugins/ (defaults to the repo root above skills/). */
  out?: string;
  version?: string;
}

export async function marketplaceBuildCommand(opts: MarketplaceBuildOptions): Promise<void> {
  const content = await resolveContent({ content: opts.content, cwd: opts.cwd });
  const out = resolve(opts.out ?? dirname(content.root));
  const version = opts.version ?? "0.1.0";

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
        claude: `plugins/${name}/skills`,
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

  const plugins: {
    name: string;
    source: string;
    description: string;
    version: string;
    category: string;
  }[] = [];

  for (const { domain, cls, files, count } of groups.values()) {
    const name = pluginName(domain, cls);
    applyFiles(out, files, { overwrite: true });

    const description = `${titleCase(domain)} ${CLASS_LABEL[cls]}.`;
    const pluginDir = join(out, "plugins", name, ".claude-plugin");
    mkdirSync(pluginDir, { recursive: true });
    const manifest = {
      name,
      version,
      description,
      author: { name: "skills-master contributors" },
    };
    writeFileSync(join(pluginDir, "plugin.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

    plugins.push({ name, source: `./plugins/${name}`, description, version, category: CLASS_CATEGORY[cls] });
    log.info(`Built ${name} (${count} skills).`);
  }

  plugins.sort((a, b) => a.name.localeCompare(b.name));
  const marketplace = {
    $schema: "https://www.schemastore.org/claude-code-marketplace.json",
    name: "skills-master",
    owner: { name: "skills-master contributors" },
    plugins,
  };
  const mpDir = join(out, ".claude-plugin");
  mkdirSync(mpDir, { recursive: true });
  writeFileSync(join(mpDir, "marketplace.json"), JSON.stringify(marketplace, null, 2) + "\n", "utf8");
  log.success(`Wrote .claude-plugin/marketplace.json (${plugins.length} plugins).`);
}
