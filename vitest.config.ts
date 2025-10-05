import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["test/**/*.test.ts"],
		setupFiles: ["./test/minioMockSetup.ts"],
		coverage: {
			provider: "v8", // or 'istanbul' if you prefer
			reporter: ["text", "lcov", "html"],
		},
		// https://vitest.dev/config/#fileparallelism
		// fileParallelism: true,

		// https://vitest.dev/config/#globalsetup

		// https://vitest.dev/config/#passwithnotests
		passWithNoTests: true,

		// // https://vitest.dev/config/#teardowntimeout,
		// teardownTimeout: 10000

		hookTimeout: 30000, // 30 seconds for hooks
		testTimeout: 60000, // 60 seconds per test
		pool: "threads", // for faster test execution and to avoid postgres max-limit error
	},
});
