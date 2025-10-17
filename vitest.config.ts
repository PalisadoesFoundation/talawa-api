import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
	plugins: [
		tsconfigPaths({
			ignoreConfigErrors: true,
		}),
	],
	test: {
		environment: 'node',
		include: [
			"src/**/*.test.{ts,tsx,js,jsx}",
			"src/**/*.spec.{ts,tsx,js,jsx}",
			"test/**/*.test.{ts,tsx,js,jsx}",
			"test/**/*.spec.{ts,tsx,js,jsx}",
		],

		root: "./",


		exclude: [
			...configDefaults.exclude,
			"dist/**",
			"coverage/**",
			"docs/**",
			"**/*.d.ts",
			"**/index.{js,ts}",
		],

		hookTimeout: 30000,
		testTimeout: 60000,
		passWithNoTests: false,
		pool: "threads",

		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			exclude: ["node_modules/**", "dist/**", "docs/**", "coverage/**", "**/*.d.ts"],
		},
	},
});

