import { getExpectedCounts, populateDB, disconnect,runValidation } from "src/utilities/dbManagement/helpers";
import { describe, expect, it, vi } from "vitest";

// Mock populateDB before importing the module
vi.mock("src/utilities/dbManagement/helpers", () => ({
    getExpectedCounts: vi.fn(),
	populateDB: vi.fn(),
	disconnect: vi.fn(),
    runValidation: vi.fn(),
}));

// Import the module AFTER mocking
import "src/utilities/dbManagement/testDbConnection";

describe("main function", () => {
	it("should call populateDB with 'interactive'", async () => {
		// Wait for the async function to execute
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getExpectedCounts).toHaveBeenCalledTimes(1);
        expect(populateDB).toHaveBeenCalledTimes(1);
		expect(populateDB).toHaveBeenCalledWith("test");
        expect(runValidation).toHaveBeenCalledTimes(1);
		expect(disconnect).toHaveBeenCalledTimes(1);
	});
});
