import { configDefaults, defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ skip: ["dist", "coverage", "docs"] })],
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: ["node_modules", "dist", "coverage", "docs"],
    hookTimeout: 10000,
    testTimeout: 5000,
    passWithNoTests: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        ...(configDefaults.coverage?.exclude ?? []),
        "docs/**",
        "**/*.d.ts",
      ],
    },
  },
});