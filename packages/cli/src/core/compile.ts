import type { EmitContext, EmittedFile, ParsedSkill, TargetId } from "../types";
import { getEmitter } from "../emitters";

export interface CompiledTarget {
  target: TargetId;
  files: EmittedFile[];
}

/** Run the emitters for the requested targets over a single skill. */
export function compileSkill(
  skill: ParsedSkill,
  targets: TargetId[],
  ctx: EmitContext,
): CompiledTarget[] {
  const out: CompiledTarget[] = [];
  for (const target of targets) {
    const emitter = getEmitter(target);
    if (!emitter) throw new Error(`Unknown target: ${target}`);
    out.push({ target, files: emitter.emit(skill, ctx) });
  }
  return out;
}
