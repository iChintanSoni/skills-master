import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts"],
  format: ["esm"],
  target: "node22",
  platform: "node",
  clean: true,
  minify: false,
  sourcemap: false,
  // The CLI is bundled into a single executable file with a Node shebang.
  banner: { js: "#!/usr/bin/env node" },
});
