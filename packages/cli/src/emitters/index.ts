import type { Emitter, TargetId } from "../types";
import { claudeEmitter } from "./claude";
import { cursorEmitter } from "./cursor";
import { copilotEmitter } from "./copilot";
import { agentsEmitter } from "./agents";

/**
 * The emitter registry. Adding support for a new tool (Windsurf, Cline, …) is a
 * one-line change here plus a new emitter file — the rest of the pipeline is
 * generic over the `Emitter` interface.
 */
export const EMITTERS: Emitter[] = [
  claudeEmitter,
  cursorEmitter,
  copilotEmitter,
  agentsEmitter,
];

const BY_ID = new Map<string, Emitter>(EMITTERS.map((e) => [e.id, e]));

export function getEmitter(id: string): Emitter | undefined {
  return BY_ID.get(id);
}

/** Detect which targets are present in a project. */
export function detectTargets(projectRoot: string): TargetId[] {
  return EMITTERS.filter((e) => e.detect(projectRoot)).map((e) => e.id as TargetId);
}

export { claudeEmitter, cursorEmitter, copilotEmitter, agentsEmitter };
