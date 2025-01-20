import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: "v8", // or 'istanbul' if you prefer
      reporter: ["text", "lcov", "html"],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      }, // Specify 'lcov' to generate lcov.info
    },
    // https://vitest.dev/config/#fileparallelism
    // fileParallelism: true,

    // https://vitest.dev/config/#globalsetup
    globalSetup: ["./test/setup.ts"],

    // https://vitest.dev/config/#passwithnotests
    passWithNoTests: true,

    // // https://vitest.dev/config/#teardowntimeout,
    // teardownTimeout: 10000
  },
});

