import { disconnect, populateDB } from "src/utilities/dbManagement/helpers";
import { describe, expect, it, vi } from "vitest";

vi.mock("src/utilities/dbManagement/helpers", () => ({
	populateDB: vi.fn(),
	disconnect: vi.fn(),
}));

import "src/utilities/dbManagement/loadSampleData";

describe("main function", () => {
	it("should call populateDB with 'interactive' and disconnect", async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(populateDB).toHaveBeenCalledTimes(1);
		expect(populateDB).toHaveBeenCalledWith("interactive");
		expect(disconnect).toHaveBeenCalledTimes(1);
	});
});
