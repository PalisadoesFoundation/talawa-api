import { describe, it, vi, expect } from "vitest";
import { populateDB } from "src/utilities/dbManagement/helpers";

// Mock populateDB before importing the module
vi.mock("src/utilities/dbManagement/helpers", () => ({
  populateDB: vi.fn(),
}));

// Import the module AFTER mocking
import "src/utilities/dbManagement/loadSampleData";

describe("main function", () => {
  it("should call populateDB with 'interactive'", async () => {
    // Wait for the async function to execute
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(populateDB).toHaveBeenCalledTimes(1);
    expect(populateDB).toHaveBeenCalledWith("interactive");
  });
});
