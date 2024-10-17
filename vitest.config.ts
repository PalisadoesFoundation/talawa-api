// More information at this link: https://vitest.dev/config/
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		// // https://vitest.dev/config/#fileparallelism
		// fileParallelism: true,

		// https://vitest.dev/config/#globalsetup
		globalSetup: ["./test/setup.ts"],

		// https://vitest.dev/config/#passwithnotests
		passWithNoTests: true,

		// // https://vitest.dev/config/#teardowntimeout,
		// teardownTimeout: 10000
	},
});
