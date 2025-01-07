import { defineConfig } from "vitest/config";
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@setup': path.resolve(__dirname, 'src/setup'),
      '@utilities': path.resolve(__dirname, 'src/utilities'),
    },
  },

  test: {
    setupFiles: ["./config/vitestSetup.ts"],

    // Run the setup and teardown scripts before and after all the tests are run
    // The scripts are used to clear the testing database of all the data.
    // The function names `setup` and `teardown` are special because vitest
    // specifically looks for those functions in the `globalSetup.ts` file.
    // More info here https://vitest.dev/config/#globalsetup
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
        "src/services",
        "src/typeDefs",
        "src/types",
        "src/constants.ts",
        "src/db.ts",
        "src/server.ts",
        "src/index.ts",
        "src/app.ts",
        "src/checks.ts",
        "src/**/index.ts",
        "src/utilities/sample_data/*",
        "src/utilities/loadSampleData.ts",
      ],
      

      // This is used to tell vitest which coverage provider to use. c8 is the newer and
      // recommended coverage provider for node.js applications. You can swap it with
      // istanbul as well.
      provider: "v8",

      // This tells vitest in what format the report will be generated. Here lcov
      // is selected because a file named lcov.info is generated by this reporter which
      // is used in codecov/codecov-action github action for talawa-api.
      reporter: ["lcov", "text"],
    },

    // Tells vitest the time limit for an individual test block run.
    testTimeout: 30000,

    // Use a thread pool for parallel execution to improve performance
    pool: 'threads',

    // Disable file-level parallelism to process files sequentially
    fileParallelism: false,
  },
});