import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()], // Remove the skip parameter
	test: {
		environment: "node",
		include: [
			"src/**/*.test.{ts,tsx,js,jsx}",
			"src/**/*.spec.{ts,tsx,js,jsx}",
			"test/**/*.test.{ts,tsx,js,jsx}",
			"test/**/*.spec.{ts,tsx,js,jsx}",
		],
		exclude: [
			...configDefaults.exclude,
			"dist/**",
			"coverage/**",
			"docs/**",
			"**/*.d.ts",
			"**/node_modules/**",
		],
		hookTimeout: 30000,
		testTimeout: 60000,
		passWithNoTests: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			exclude: [
				...(configDefaults.coverage?.exclude ?? []),
				"dist/**",
				"coverage/**",
				"docs/**",
				"**/*.d.ts",
				"**/node_modules/**",
			],
		},
	},
});
