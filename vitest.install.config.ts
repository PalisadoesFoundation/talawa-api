/**
 * Vitest configuration for install module tests
 * These tests are standalone unit tests that don't require server setup
 */
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		include: ["test/install/**/*.test.ts"],
		passWithNoTests: false,
		testTimeout: 10000,
	},
});
