import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        // include: ["test/scripts/setup/**/*.test.ts"],
        include: ["test/scripts/setup/setup.test.ts"],
        exclude: ["node_modules", "dist"],
        pool: "threads",
        isolate: true,
    },
});
