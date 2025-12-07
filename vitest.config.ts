import { cpus } from "node:os";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

const isCI = !!process.env.CI;
const cpuCount = cpus().length;

const MAX_CI_THREADS = 12; // Reduced to leave headroom
const MAX_LOCAL_THREADS = 16;

const ciThreads = Math.min(
	MAX_CI_THREADS,
	Math.max(4, Math.floor(cpuCount * 0.85)), // Increased utilization
);

const localThreads = Math.min(MAX_LOCAL_THREADS, Math.max(4, cpuCount));

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		exclude: [
			...configDefaults.exclude,
			"dist/**",
			"coverage/**",
			"docs/**",
			"**/*.d.ts",
			"data/**",
			"docker/**",
			"drizzle_migrations/**",
			"envFiles/**",
			"scripts/**",
			"**/scripts/**",
		],
		coverage: {
			provider: "v8", // or 'istanbul' if you prefer
			reporter: ["text", "lcov", "html"],
			exclude: [
				...(configDefaults.coverage?.exclude ?? []),
				"dist/**",
				"coverage/**",
				"docs/**",
				"**/*.d.ts",
				"data/**",
				"docker/**",
				"drizzle_migrations/**",
				"envFiles/**",
				"scripts/**",
			],
		},

		// https://vitest.dev/config/#globalsetup
		globalSetup: ["./test/setup.ts"],

		// https://vitest.dev/config/#passwithnotests
		passWithNoTests: true,

		hookTimeout: 30000, // 30 seconds for hooks
		testTimeout: 60000, // 60 seconds per test
		pool: "threads", // for faster test execution and to avoid postgres max-limit error
		poolOptions: {
			threads: {
				singleThread: false,
				minThreads: 1,
				maxThreads: isCI ? ciThreads : localThreads,
				isolate: true,
			},
		},
		maxConcurrency: isCI ? ciThreads : localThreads,
		fileParallelism: true,
		sequence: {
			shuffle: false,
			concurrent: false,
		},
	},
});
