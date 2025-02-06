import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: [
      "test/**/*.test.{js,ts,jsx,tsx}",
      "test/**/*.spec.{js,ts,jsx,tsx}",
    ], // ✅ Include deeply nested test files
    exclude: ["node_modules", "dist", "cypress", "**/*.config.*"], // ✅ Prevent non-test files from being run
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
    },
    globalSetup: ["./test/setup.ts"],
    passWithNoTests: true,
  },
});
