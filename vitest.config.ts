import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

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
		// https://vitest.dev/config/#fileparallelism
		// fileParallelism: true,

		// https://vitest.dev/config/#globalsetup
		globalSetup: ["./test/setup.ts"],

		// https://vitest.dev/config/#passwithnotests
		passWithNoTests: true,

		// https://vitest.dev/config/#teardowntimeout
		// teardownTimeout: 10000

		hookTimeout: 30000, // 30 seconds for hooks
		testTimeout: 60000, // 60 seconds per test
		pool: "threads", // for faster test execution and to avoid postgres max-limit error
	},
});
