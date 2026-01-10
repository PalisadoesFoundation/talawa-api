import { cpus } from "node:os";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

const isCI = !!process.env.CI;
const cpuCount = cpus().length;

const MAX_CI_THREADS = 12; // Reduced to leave headroom
const MAX_LOCAL_THREADS = 16;

// Allow override via env var for CI rollout testing
const envCiThreads = process.env.VITEST_CI_THREADS
	? Number.parseInt(process.env.VITEST_CI_THREADS, 10)
	: undefined;

const computedCiThreads = Math.min(
	MAX_CI_THREADS,
	Math.max(4, Math.floor(cpuCount * 0.85)), // Increased utilization
);

const ciThreads =
	envCiThreads && !Number.isNaN(envCiThreads)
		? envCiThreads
		: computedCiThreads;

const localThreads = Math.min(MAX_LOCAL_THREADS, Math.max(4, cpuCount));

// Runtime observability for CI rollout
if (isCI) {
	const shardId = process.env.SHARD_INDEX || "unknown";
	console.log(
		`[Vitest Config] Shard ${shardId}: cpuCount=${cpuCount}, computedCiThreads=${computedCiThreads}, ciThreads=${ciThreads}`,
	);
	if (ciThreads < cpuCount) {
		console.warn(
			`[Vitest Config] Thread count reduced from ${cpuCount} to ${ciThreads} to prevent over-subscription`,
		);
	}
	if (envCiThreads) {
		console.log(
			`[Vitest Config] Using VITEST_CI_THREADS override: ${ciThreads}`,
		);
	}
}

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
		],
		coverage: {
			provider: "v8", // or 'istanbul' if you prefer
			reporter: ["text", "lcov", "html", "json"],
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
			],
		},

		// https://vitest.dev/config/#globalsetup
		globalSetup: ["./test/setup.ts"],

		// https://vitest.dev/config/#passwithnotests
		passWithNoTests: true,

		hookTimeout: 30000, // 30 seconds for hooks
		testTimeout: 60000, // 60 seconds per test
		pool: "threads", // for faster test execution and to avoid postgres max-limit error
		isolate: true,
		maxWorkers: isCI ? ciThreads : localThreads,
		// Set maxConcurrency lower than maxWorkers to prevent single heavy test files
		// from consuming all workers and blocking other test files
		maxConcurrency: isCI
			? Math.max(1, Math.floor(ciThreads / 2))
			: Math.max(1, Math.floor(localThreads / 2)),
		fileParallelism: true,
		sequence: {
			shuffle: false,
			concurrent: false,
		},
	},
});
