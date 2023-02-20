import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./setupFile.ts"],
    globalSetup: ["./tests/helpers/globalSetup.ts"],

    coverage: {
      // This tells vitest to include all files from ./src in test coverage.
      all: true,

      // This tells vitest the directory to get coverage for.
      include: ["src/"],

      // This tells vitest the files/directories to exclude from the coverage.
      // This is intentionally done because coverage for these files doesn't
      // provide any meaningful details for coverage report.
      exclude: [
        "src/config",
        "src/models",
        "src/typeDefs",
        "src/types",
        "src/constants.ts",
        "src/db.ts",
        "src/server.ts",
        "src/**/index.ts",
      ],

      // This is used to tell vitest which coverage provider to use. c8 is the newer and
      // recommended coverage provider for node.js applications. You can swap it with
      // istanbul as well.
      provider: "c8",

      // This tells vitest in what format the report will be generated. Here lcov
      // is selected because a file named lcov.info is generated by this reporter which
      // is used in codecov/codecov-action github action for talawa-api.
      reporter: ["lcov", "text"],
    },

    // Tells vitest the time limit for an individual test block run.
    testTimeout: 30000,
  },
});
