import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Snapshot + e2e tests touch the filesystem; keep them serial-safe per file.
    pool: "forks",
  },
});
