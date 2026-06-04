import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveContent } from "../content/source";
import { buildRegistry } from "../core/registry-build";
import { REGISTRY_FILENAME } from "../schema/registry";
import { log } from "../util/log";

export interface RegistryBuildOptions {
  content?: string;
  cwd?: string;
  /** when true, verify the committed registry.json is up to date (CI mode). */
  check?: boolean;
  version?: string;
}

/** Build (or verify) registry.json from the skill tree. Returns true on success. */
export async function registryBuildCommand(opts: RegistryBuildOptions): Promise<boolean> {
  const content = await resolveContent({ content: opts.content, cwd: opts.cwd });
  const registry = buildRegistry(content.root, opts.version ?? "0.1.0");
  const json = JSON.stringify(registry, null, 2) + "\n";
  const outPath = join(content.root, REGISTRY_FILENAME);

  if (opts.check) {
    const current = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
    if (current !== json) {
      log.error(`registry.json is out of date — run \`registry build\` and commit the result.`);
      return false;
    }
    log.success(`registry.json is up to date (${registry.skills.length} skills).`);
    return true;
  }

  writeFileSync(outPath, json, "utf8");
  log.success(`Wrote ${REGISTRY_FILENAME} (${registry.skills.length} skills).`);
  return true;
}
