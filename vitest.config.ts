import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		coverage: {
			provider: "v8", // or 'istanbul' if you prefer
			reporter: ["text", "lcov", "html"],
		},
		// https://vitest.dev/config/#fileparallelism
		// fileParallelism: true,

		// https://vitest.dev/config/#globalsetup
		globalSetup: ["./test/setup.ts"],

		// https://vitest.dev/config/#passwithnotests
		passWithNoTests: true,

		// // https://vitest.dev/config/#teardowntimeout,
		// teardownTimeout: 10000

		hookTimeout: 30000, // 30 seconds for hooks
		pool: "threads", // for faster test execution and to avoid postgres max-limit error
	},
});
