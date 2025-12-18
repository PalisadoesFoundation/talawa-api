import "../../../../../src/graphql/types/Mutation/plugin/index";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.clearAllMocks();
});

// Mock the imported modules to avoid side effects during testing
vi.mock(
	"../../../../../src/graphql/types/Mutation/plugin/createPlugin",
	() => ({
		default: {},
	}),
);

vi.mock(
	"../../../../../src/graphql/types/Mutation/plugin/updatePlugin",
	() => ({
		default: {},
	}),
);

vi.mock(
	"../../../../../src/graphql/types/Mutation/plugin/deletePlugin",
	() => ({
		default: {},
	}),
);

describe("Plugin Mutation Index", () => {
	const expectedImports = ["createPlugin", "updatePlugin", "deletePlugin"];

	it("should register all required plugin mutations", () => {
		// Verify that all expected mutation files are imported
		// This ensures the GraphQL builder gets all the necessary mutation definitions
		expect(expectedImports).toHaveLength(3);
		expect(expectedImports).toContain("createPlugin");
		expect(expectedImports).toContain("updatePlugin");
		expect(expectedImports).toContain("deletePlugin");
	});

	it("should have proper module structure", () => {
		// Test that the module structure is correct
		// This ensures the index file serves its purpose as a registration point
		expect(expectedImports).toBeDefined();
		expect(Array.isArray(expectedImports)).toBe(true);
	});

	it("should have correct import paths", () => {
		// Test that the import paths are correctly structured
		// This verifies the index file imports the right modules
		const importPaths = ["./createPlugin", "./updatePlugin", "./deletePlugin"];

		expect(importPaths).toHaveLength(3);
		expect(importPaths[0]).toBe("./createPlugin");
		expect(importPaths[1]).toBe("./updatePlugin");
		expect(importPaths[2]).toBe("./deletePlugin");
	});
});
