import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

const isCI = !!process.env.CI;

export default defineConfig({
	plugins: [tsconfigPaths()],
	build: {
		sourcemap: false, // Disable sourcemaps for faster tests
	},
	esbuild: {
		sourcemap: false, // Disable sourcemaps for faster tests
	},
	test: {
		include: ["src/**/*.{spec,test}.{js,ts}", "test/**/*.{spec,test}.{js,ts}"],

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
			reporter: ["lcov", "json"],
			reportsDirectory: "./coverage/vitest",
			cleanOnRerun: false,
			// Don't use 'all: true' with sharding - let merge handle combining partial coverage
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
				".github/**",
			],
		},
		// https://vitest.dev/config/#globalsetup
		globalSetup: ["./test/setup.ts"],
		// Use threads for better performance in CI
		pool: "threads",
		poolOptions: {
			threads: {
				singleThread: false,
				minThreads: 1,
				maxThreads: isCI ? 2 : 4, // Conservative in CI
				isolate: true,
			},
		},

		// Lower concurrency in CI to avoid memory issues
		maxConcurrency: isCI ? 1 : 2,
		// Enable file parallelism for better performance
		fileParallelism: true,
		sequence: {
			shuffle: false,
			concurrent: false, // Disable within-file concurrency for stability
		},

		passWithNoTests: true,
		teardownTimeout: 10000,
		hookTimeout: 30000, // 30 seconds for hooks
		testTimeout: 60000, // 60 seconds per test
	},
});
