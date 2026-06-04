import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { EmittedFile, WriteAction, WriteResult } from "../types";
import { hasBlock, removeBlock, upsertBlock } from "./markers";

export type ConflictChoice = "overwrite" | "skip";

export interface ApplyOptions {
  dryRun?: boolean;
  /** force-overwrite changed whole-files without asking. */
  overwrite?: boolean;
  /** called for a changed whole-file when neither overwrite nor dryRun is set. */
  onConflict?: (path: string) => ConflictChoice;
}

export interface DetailedWriteResult extends WriteResult {
  /** previous file contents (whole-file) when it changed — for diff previews. */
  before?: string;
  /** new file contents (whole-file) when it changed. */
  after?: string;
}

function ensureDir(absPath: string): void {
  mkdirSync(dirname(absPath), { recursive: true });
}

function applyWhole(
  projectRoot: string,
  file: EmittedFile,
  opts: ApplyOptions,
): DetailedWriteResult {
  const abs = join(projectRoot, file.path);
  const exists = existsSync(abs);
  const next = file.contents;

  if (!exists) {
    if (!opts.dryRun) {
      ensureDir(abs);
      writeFileSync(abs, next, "utf8");
    }
    return { path: file.path, mode: "whole", action: "created", after: next };
  }

  const current = readFileSync(abs, "utf8");
  if (current === next) {
    return { path: file.path, mode: "whole", action: "unchanged" };
  }

  // changed
  let choice: ConflictChoice = "overwrite";
  if (!opts.overwrite) {
    choice = opts.onConflict ? opts.onConflict(file.path) : opts.dryRun ? "overwrite" : "skip";
  }
  if (choice === "skip") {
    return { path: file.path, mode: "whole", action: "skipped", before: current, after: next };
  }
  if (!opts.dryRun) writeFileSync(abs, next, "utf8");
  return { path: file.path, mode: "whole", action: "updated", before: current, after: next };
}

function applyBlock(
  projectRoot: string,
  file: EmittedFile,
  opts: ApplyOptions,
): DetailedWriteResult {
  const abs = join(projectRoot, file.path);
  const exists = existsSync(abs);
  const current = exists ? readFileSync(abs, "utf8") : "";
  const blockId = file.blockId!;
  const next = upsertBlock(current, blockId, file.contents, file.blockVersion);

  let action: WriteAction;
  if (current === next) action = "unchanged";
  else if (!exists || !hasBlock(current, blockId)) action = "created";
  else action = "updated";

  if (action !== "unchanged" && !opts.dryRun) {
    ensureDir(abs);
    writeFileSync(abs, next, "utf8");
  }
  return { path: file.path, mode: "block", blockId, action };
}

/** Apply a batch of emitted files to a project. */
export function applyFiles(
  projectRoot: string,
  files: EmittedFile[],
  opts: ApplyOptions = {},
): DetailedWriteResult[] {
  return files.map((f) =>
    f.mode === "block" ? applyBlock(projectRoot, f, opts) : applyWhole(projectRoot, f, opts),
  );
}

/** Remove now-empty ancestor directories of the given files, up to (not incl.) the project root. */
export function pruneEmptyDirs(projectRoot: string, relFilePaths: string[], dryRun = false): void {
  if (dryRun) return;
  const seen = new Set<string>();
  for (const rel of relFilePaths) {
    let dir = dirname(join(projectRoot, rel));
    while (dir.startsWith(projectRoot) && dir !== projectRoot && !seen.has(dir)) {
      seen.add(dir);
      try {
        if (existsSync(dir) && readdirSync(dir).length === 0) {
          rmdirSync(dir);
          dir = dirname(dir);
        } else break;
      } catch {
        break;
      }
    }
  }
}

/** Remove a whole-file output. */
export function removeWholeFile(projectRoot: string, relPath: string, dryRun = false): boolean {
  const abs = join(projectRoot, relPath);
  if (!existsSync(abs)) return false;
  if (!dryRun) rmSync(abs);
  return true;
}

/**
 * Remove a managed block from a shared file. Deletes the file if it becomes
 * empty. Returns true if anything changed.
 */
export function removeBlockFromFile(
  projectRoot: string,
  relPath: string,
  blockId: string,
  dryRun = false,
): boolean {
  const abs = join(projectRoot, relPath);
  if (!existsSync(abs)) return false;
  const current = readFileSync(abs, "utf8");
  if (!hasBlock(current, blockId)) return false;
  const next = removeBlock(current, blockId);
  if (!dryRun) {
    if (next.trim().length === 0) rmSync(abs);
    else writeFileSync(abs, next, "utf8");
  }
  return true;
}
