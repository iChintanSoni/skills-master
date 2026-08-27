import { Command } from "commander";
// Single source of truth for the version. release.yml rewrites this
// package.json before running the build, so the bundle carries the
// released version; a literal here would silently report a stale one.
import { version } from "../package.json";
import { initCommand } from "./commands/init";
import { addCommand } from "./commands/add";
import { updateCommand } from "./commands/update";
import { removeCommand } from "./commands/remove";
import { doctorCommand } from "./commands/doctor";
import { statusCommand } from "./commands/status";
import { syncCommand } from "./commands/sync";
import { listCommand, searchCommand, viewCommand } from "./commands/catalog";
import { lintCommand } from "./commands/lint";
import { registryBuildCommand } from "./commands/registry";
import { marketplaceBuildCommand } from "./commands/marketplace";
import { newSkillCommand } from "./commands/new";
import { log } from "./util/log";
import { parseTargets } from "./util/targets";

async function run(fn: () => Promise<unknown> | unknown, exitOnFalse = false): Promise<void> {
  try {
    const result = await fn();
    if (exitOnFalse && result === false) process.exitCode = 1;
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

const program = new Command();
program
  .name("skills-master")
  .description("Install tool-agnostic Apple & Android development skills into any AI coding tool.")
  .version(version);

program
  .command("init")
  .description("Detect tools and write skills-master.json")
  .option("--target <list>", "comma list or 'all'")
  .option("--ref <ref>", "content git ref")
  .option("--no-commit", "gitignore generated files instead of committing them")
  .option("--force", "overwrite an existing config")
  .action((opts) =>
    run(() =>
      initCommand({
        cwd: process.cwd(),
        targets: parseTargets(opts.target),
        commit: opts.commit,
        contentRef: opts.ref,
        force: opts.force,
      }),
    ),
  );

program
  .command("list")
  .description("List available skills")
  .option("--domain <domain>", "e.g. apple, android")
  .option("--class <class>", "e.g. code, design, lang-tooling, overview")
  .option("--category <category>", "e.g. app-frameworks, compose-ui")
  .option("--platform <platform>", "e.g. ios, watchos, android")
  .option("--json", "machine-readable JSON output")
  .option("--content <dir>", "local skills directory")
  .option("--ref <ref>", "content git ref (tag/branch/sha)")
  .action((opts) =>
    run(() =>
      listCommand({
        cwd: process.cwd(),
        domain: opts.domain,
        class: opts.class,
        category: opts.category,
        platform: opts.platform,
        json: opts.json,
        content: opts.content,
        ref: opts.ref,
      }),
    ),
  );

program
  .command("search <query>")
  .description("Search skills by name, description, tags")
  .option("--content <dir>", "local skills directory")
  .option("--ref <ref>", "content git ref (tag/branch/sha)")
  .option("--json", "machine-readable output")
  .action((query, opts) =>
    run(() =>
      searchCommand({
        cwd: process.cwd(),
        query,
        content: opts.content,
        ref: opts.ref,
        json: opts.json,
      }),
    ),
  );

program
  .command("view <name>")
  .description("Show a skill's metadata and body")
  .option("--raw", "print the raw SKILL.md body")
  .option("--content <dir>", "local skills directory")
  .option("--ref <ref>", "content git ref (tag/branch/sha)")
  .option("--json", "machine-readable output (metadata plus body)")
  .action((name, opts) =>
    run(() =>
      viewCommand({
        cwd: process.cwd(),
        name,
        raw: opts.raw,
        json: opts.json,
        content: opts.content,
        ref: opts.ref,
      }),
    ),
  );

program
  .command("add <names...>")
  .description("Install skills (by name, category, or class) into your tools")
  .option("--target <list>", "comma list or 'all'")
  .option("--with-pairs", "also install paired (code<->design) skills")
  .option("--dry-run", "preview without writing")
  .option("--overwrite", "overwrite changed files without asking")
  .option("--content <dir>", "local skills directory")
  .option("--ref <ref>", "content git ref (tag/branch/sha)")
  .action((names, opts) =>
    run(() =>
      addCommand({
        cwd: process.cwd(),
        names,
        targets: parseTargets(opts.target),
        withPairs: opts.withPairs,
        dryRun: opts.dryRun,
        overwrite: opts.overwrite,
        content: opts.content,
        ref: opts.ref,
      }),
    ),
  );

program
  .command("update [names...]")
  .description("Re-install skills whose content changed")
  .option("--check", "report which installed skills are behind; exit 1 if any are")
  .option("--dry-run", "preview without writing")
  .option("--overwrite", "force re-install, replacing local edits")
  .option("--content <dir>", "local skills directory")
  .option("--ref <ref>", "content git ref (tag/branch/sha)")
  .action((names, opts) =>
    run(async () => {
      const res = await updateCommand({
        cwd: process.cwd(),
        names,
        check: opts.check,
        dryRun: opts.dryRun,
        overwrite: opts.overwrite,
        content: opts.content,
        ref: opts.ref,
      });
      // Only --check gates the exit code; a plain update that changes nothing
      // is a success, not a failure.
      return opts.check ? (res.behind?.length ?? 0) === 0 : undefined;
    }, true),
  );

program
  .command("remove <names...>")
  .description("Remove installed skills")
  .option("--target <list>", "comma list or 'all'")
  .option("--dry-run", "preview without writing")
  .action((names, opts) =>
    run(() =>
      removeCommand({
        cwd: process.cwd(),
        names,
        targets: parseTargets(opts.target),
        dryRun: opts.dryRun,
      }),
    ),
  );

program
  .command("sync")
  .description("Re-emit installed skills to match the current config (new targets, moved paths)")
  .argument("[names...]", "limit the sync to these installed skills")
  .option("--content <dir>", "local skills directory")
  .option("--ref <git-ref>", "content ref to read from")
  .option("--overwrite", "replace locally edited outputs")
  .option("--prune", "delete outputs for targets the config no longer lists")
  .option("--dry-run", "show what would change without writing")
  .action((names: string[], opts) =>
    run(() =>
      syncCommand({
        cwd: process.cwd(),
        names,
        content: opts.content,
        ref: opts.ref,
        overwrite: opts.overwrite,
        prune: opts.prune,
        dryRun: opts.dryRun,
      }),
    ),
  );

program
  .command("status")
  .description("Show installed skills: versions, targets, and local-edit state")
  .argument("[names...]", "limit the report to these skills")
  .option("--problems", "show only skills that are edited or missing files")
  .option("--json", "machine-readable output")
  .action((names: string[], opts) =>
    run(() =>
      statusCommand({
        cwd: process.cwd(),
        names,
        problemsOnly: opts.problems,
        json: opts.json,
      }),
    ),
  );

program
  .command("doctor")
  .description("Check installed skills for drift and missing files")
  .option("--json", "machine-readable output")
  .action((opts) => run(() => doctorCommand({ cwd: process.cwd(), json: opts.json }).ok, true));

program
  .command("lint")
  .description("Validate the skill library (maintainer command)")
  .option("--content <dir>", "local skills directory")
  .action((opts) => run(() => lintCommand({ cwd: process.cwd(), content: opts.content }), true));

program
  .command("new <spec>")
  .description("Scaffold a new skill: domain/class/category/name (maintainer command)")
  .option("--content <dir>", "local skills directory")
  .option("--force", "overwrite an existing skill directory")
  .action((spec, opts) =>
    run(() =>
      newSkillCommand({ cwd: process.cwd(), spec, content: opts.content, force: opts.force }),
    ),
  );

const registry = program.command("registry").description("Registry maintenance");
registry
  .command("build")
  .description("Generate registry.json from the skill tree")
  .option("--content <dir>", "local skills directory")
  .option("--check", "verify the committed registry.json is current (CI)")
  .option("--set-version <v>", "schema version to stamp into registry.json")
  .action((opts) =>
    run(
      () =>
        registryBuildCommand({
          cwd: process.cwd(),
          content: opts.content,
          check: opts.check,
          version: opts.setVersion,
        }),
      true,
    ),
  );

const marketplace = program.command("marketplace").description("Claude marketplace maintenance");
marketplace
  .command("build")
  .description("Generate .claude-plugin/marketplace.json and per-class plugins")
  .option("--content <dir>", "local skills directory")
  .option("--out <dir>", "output root")
  .option("--check", "verify the committed marketplace output is current (CI)")
  .option("--set-version <v>", "version to stamp into plugin manifests")
  .action((opts) =>
    run(
      () =>
        marketplaceBuildCommand({
          cwd: process.cwd(),
          content: opts.content,
          out: opts.out,
          check: opts.check,
          version: opts.setVersion,
        }),
      true,
    ),
  );

program.parseAsync(process.argv).catch((err: unknown) => {
  log.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
