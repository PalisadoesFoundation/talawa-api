import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/cypress/**",
			"**/.{idea,git,cache,output,temp}/**",
			"**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
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
			provider: "v8",
			reporter: ["text", "lcov", "html", "json"],
			exclude: [
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
		globalSetup: ["./test/setup.ts"],
		passWithNoTests: true,
		hookTimeout: 30000,
		testTimeout: 60000,
		pool: "threads",
		isolate: true,
		fileParallelism: true,
		sequence: {
			shuffle: false,
			concurrent: false,
		},
	},
});
