import { it, expect, describe, vi } from "vitest";
import { askToKeepValues } from "../../src/setup/askToKeepValues";
import inquirer from "inquirer";

describe("Setup -> askToKeepValues", () => {
  it("Should return true when entered by user", async () => {
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({
        keepValues: true,
      }),
    );
    const result = await askToKeepValues();
    expect(result).toBe(true);
  });

  it("Should return false when entered by user", async () => {
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({
        keepValues: false,
      }),
    );
    const result = await askToKeepValues();
    expect(result).toBe(false);
  });
});
