import { resolveContent } from "../content/source";
import type { Registry, RegistryEntry } from "../schema/registry";
import { log } from "../util/log";

export interface CatalogQuery {
  content?: string;
  ref?: string;
  cwd?: string;
}

async function registryOf(q: CatalogQuery): Promise<Registry> {
  const content = await resolveContent({ content: q.content, ref: q.ref, cwd: q.cwd });
  return content.registry();
}

export interface ListOptions extends CatalogQuery {
  domain?: string;
  class?: string;
  category?: string;
  platform?: string;
  json?: boolean;
}

export async function listCommand(opts: ListOptions): Promise<RegistryEntry[]> {
  const reg = await registryOf(opts);
  let skills = reg.skills;
  if (opts.domain) skills = skills.filter((s) => s.domain === opts.domain);
  if (opts.class) skills = skills.filter((s) => s.class === opts.class);
  if (opts.category) skills = skills.filter((s) => s.category === opts.category);
  if (opts.platform) {
    const platform = opts.platform;
    skills = skills.filter((s) => s.platforms.includes(platform));
  }

  if (opts.json) {
    log.plain(JSON.stringify(skills, null, 2));
    return skills;
  }

  if (skills.length === 0) {
    log.info("No skills match.");
    return skills;
  }

  const groups = new Map<string, RegistryEntry[]>();
  for (const s of skills) {
    const key = `${s.domain}/${s.class}/${s.category}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(s);
  }
  for (const [group, entries] of [...groups].sort()) {
    log.plain(`\n${group}`);
    for (const s of entries) {
      const flag = s.stability === "stable" ? "" : ` (${s.stability})`;
      log.plain(`  ${s.name}  v${s.version}${flag}`);
      log.plain(`      ${truncate(s.description, 96)}`);
    }
  }
  log.plain(`\n${skills.length} skill(s).`);
  return skills;
}

export interface SearchOptions extends CatalogQuery {
  query: string;
}

export async function searchCommand(opts: SearchOptions): Promise<RegistryEntry[]> {
  const reg = await registryOf(opts);
  const q = opts.query.toLowerCase();
  const hits = reg.skills.filter((s) =>
    [s.name, s.description, s.domain, s.category, s.class, ...s.tags]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
  if (hits.length === 0) {
    log.info(`No matches for "${opts.query}".`);
    return hits;
  }
  for (const s of hits) {
    log.plain(`${s.name}  (${s.class}/${s.category})  v${s.version}`);
    log.plain(`    ${truncate(s.description, 96)}`);
  }
  log.plain(`\n${hits.length} match(es).`);
  return hits;
}

export interface ViewOptions extends CatalogQuery {
  name: string;
  raw?: boolean;
}

export async function viewCommand(opts: ViewOptions): Promise<void> {
  const content = await resolveContent({ content: opts.content, ref: opts.ref, cwd: opts.cwd });
  const skill = content.loadSkill(opts.name);
  const xm = skill.frontmatter["x-skills-master"];
  if (opts.raw) {
    log.plain(skill.body);
    return;
  }
  log.plain(`${skill.name}  v${xm.version}  [${xm.domain}/${xm.class}/${xm.category}]  ${xm.stability}`);
  log.plain(`platforms: ${xm.platforms.join(", ")}`);
  if (xm.requires) {
    log.plain(`requires: ${Object.entries(xm.requires).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  }
  if (xm.pairs_with.length) log.plain(`pairs with: ${xm.pairs_with.join(", ")}`);
  log.plain(`\n${skill.frontmatter.description}\n`);
  log.plain(`sources:`);
  for (const url of xm.sources) log.plain(`  ${url}`);
  const res = Object.entries(skill.resources).filter(([, v]) => v).map(([k]) => k);
  if (res.length) log.plain(`\nresource files: ${res.join(", ")}`);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}
