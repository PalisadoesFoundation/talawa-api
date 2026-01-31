import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Create a modified copy of baseConfig's test object
const modifiedBaseTest = { ...(baseConfig.test || {}) };

// Override exclude to remove script exclusions
if (Array.isArray(modifiedBaseTest.exclude)) {
	modifiedBaseTest.exclude = modifiedBaseTest.exclude.filter(
		(p) => p !== "scripts/**" && p !== "**/scripts/**",
	);
}

// Override coverage exclude
const modifiedBaseCoverage = { ...(modifiedBaseTest.coverage || {}) };
if (Array.isArray(modifiedBaseCoverage.exclude)) {
	modifiedBaseCoverage.exclude = modifiedBaseCoverage.exclude.filter(
		(p) => p !== "**/scripts/**",
	);
}
modifiedBaseTest.coverage = modifiedBaseCoverage;

export default mergeConfig(
	{ ...baseConfig, test: modifiedBaseTest },
	defineConfig({
		test: {
			include: ["test/installation_scripts/**/*.test.ts"],
			exclude: [
				"scripts/docs/**",
				"scripts/githooks/**",
				"scripts/install/**",
				"scripts/port-check/**",
				"scripts/*.js",
				"scripts/verify_mock_isolation.ts",
				"scripts/check_*.ts",
				"scripts/run-shard.js",
				"test/installation_scripts/setup-env.ts",
			],
			coverage: {
				provider: "v8",
				include: [
					"scripts/setup/**/*.ts",
					"scripts/dbManagement/**/*.ts",
					"setup.ts",
				],
				exclude: [
					"scripts/docs/**",
					"scripts/githooks/**",
					"scripts/install/**",
					"scripts/port-check/**",
					"scripts/*.js",
					"scripts/verify_mock_isolation.ts",
					"scripts/check_*.ts",
					"scripts/run-shard.js",
				],
				thresholds: {
					lines: 95,
					functions: 95,
					branches: 95,
					statements: 95,
				},
				reportsDirectory: "coverage/install",
				reporter: ["text", "lcov"],
			},
			env: {
				API_GRAPHQL_SCALAR_FIELD_COST: "1",
				API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: "1",
				API_GRAPHQL_OBJECT_FIELD_COST: "1",
				API_GRAPHQL_LIST_FIELD_COST: "1",
				API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: "1",
				API_GRAPHQL_MUTATION_BASE_COST: "1",
				API_GRAPHQL_SUBSCRIPTION_BASE_COST: "1",
			},
			maxWorkers: 1,
			minWorkers: 1,
			fileParallelism: false,
			setupFiles: ["./test/installation_scripts/setup-env.ts"],
			globalSetup: [],
		},
	}),
);
