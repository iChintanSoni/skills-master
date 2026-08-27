import type { Emitter, EmittedFile } from "../types";
import { specSkillFiles } from "./spec-skill";
import { existsRel } from "./util";

/**
 * `.agents/skills/` — the cross-agent skills root.
 *
 * Same projection as the Claude target at the path the rest of the ecosystem
 * reads. Verified against each tool's own documentation:
 *
 *  - **Codex CLI** scans `.agents/skills` (project → parent → repo root → user)
 *    and does not read `.claude/skills`.
 *  - **Gemini CLI** scans `.agents/skills`, where it takes precedence over
 *    `.gemini/skills`; it does not read `.claude/skills` either.
 *  - **VS Code Copilot** reads `.github/skills`, `.claude/skills` *and*
 *    `.agents/skills` — so it is the one consumer that sees a skill twice when
 *    a project emits both roots. That is the cost of covering Codex and Gemini,
 *    who otherwise see nothing but the AGENTS.md digest.
 *
 * Detection is deliberately narrow (see `detect`): emitting a second full copy
 * of every skill is not something to do on a guess.
 */
export const agentsSkillsEmitter: Emitter = {
  id: "agents-skills",
  label: "Agent Skills (.agents/skills)",
  /**
   * `.agents/` is the standard root itself; `.gemini/` means Gemini CLI is in
   * use, and it reads `.agents/skills` in preference to its own directory.
   *
   * `AGENTS.md` is deliberately *not* evidence here, even though it is the
   * clearest sign of a Codex project: it is what the `agents` target already
   * claims, and a project detected by both would hand Codex the same content
   * twice — once as a digest block, once as a full skill.
   */
  detect: (root) => existsRel(root, ".agents") || existsRel(root, ".gemini"),
  emit(skill, ctx): EmittedFile[] {
    return specSkillFiles(skill, `${ctx.paths["agents-skills"]}/${skill.name}`);
  },
};
