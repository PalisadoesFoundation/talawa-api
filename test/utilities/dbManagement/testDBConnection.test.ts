import {
	disconnect,
	getExpectedCounts,
	populateDB,
	runValidation,
} from "src/utilities/dbManagement/helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/utilities/dbManagement/helpers", () => ({
	getExpectedCounts: vi.fn(),
	populateDB: vi.fn(),
	disconnect: vi.fn(),
	runValidation: vi.fn(),
}));

import "src/utilities/dbManagement/testDbConnection";

describe("main function", () => {
	it("should execute database validation steps in the correct order", async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getExpectedCounts).toHaveBeenCalledTimes(1);
		expect(populateDB).toHaveBeenCalledTimes(1);
		expect(populateDB).toHaveBeenCalledWith("test");
		expect(runValidation).toHaveBeenCalledTimes(1);
		expect(disconnect).toHaveBeenCalledTimes(1);
	});
});
