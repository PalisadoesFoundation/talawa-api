import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		coverage: {
			provider: "v8", // or 'istanbul' if you prefer
			reporter: ["text", "lcov", "html"],
		},

		env: {
			API_MINIO_TEST_END_POINT: process.env.API_MINIO_TEST_END_POINT,
			API_POSTGRES_TEST_HOST: process.env.API_POSTGRES_TEST_HOST,
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
