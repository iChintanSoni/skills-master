import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  minify: false,
  sourcemap: true,
  // The CLI is bundled into a single executable file with a Node shebang.
  banner: { js: "#!/usr/bin/env node" },
});
