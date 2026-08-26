import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Snapshot + e2e tests touch the filesystem; keep them serial-safe per file.
    pool: "forks",
    coverage: {
      provider: "v8",
      // text for local runs, json-summary for the CI job summary, lcov for tooling.
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      // bin.ts is the commander wiring; its behavior is covered through the
      // command modules it delegates to, and exercising it here would mean
      // driving process.argv rather than testing anything of our own.
      exclude: ["src/bin.ts"],
    },
  },
});
