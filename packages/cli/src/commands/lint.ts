import { resolveContent } from "../content/source";
import { lintSkills } from "../core/lint";
import { log } from "../util/log";

export interface LintCmdOptions {
  content?: string;
  cwd?: string;
}

/** Lint the skill library. Returns true when there are no errors. */
export async function lintCommand(opts: LintCmdOptions): Promise<boolean> {
  const content = await resolveContent({ content: opts.content, cwd: opts.cwd });
  const result = lintSkills(content.root);

  for (const d of result.diagnostics) {
    const line = `${d.level === "error" ? "✗" : "!"} ${d.relPath}: ${d.message}`;
    if (d.level === "error") log.error(line);
    else log.warn(line);
  }

  log.plain(
    `\nLinted ${result.skillCount} skill(s): ${result.errorCount} error(s), ${result.warnCount} warning(s).`,
  );
  return result.errorCount === 0;
}
