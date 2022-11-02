import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      all: true,
      include: ["src/lib"],
      exclude: [
        "src/lib/config",
        "src/lib/directives/index.ts",
        "src/lib/libraries/**/*index.ts",
        "src/lib/middleware/index.ts",
        "src/lib/models",
        "src/lib/resolvers/**/*index.ts",
        "src/lib/typeDefs",
        "src/lib/utilities/index.ts",
      ],
      provider: "c8",
      reporter: ["lcov"],
    },
    testTimeout: 30000,
  },
});
