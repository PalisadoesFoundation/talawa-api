import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setNodeEnvironment } from "~/src/setup/setup";

vi.mock("inquirer");

describe("Setup -> setNodeEnvironment", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});
	it("should update NODE_ENV when selection is made", async () => {
		const mockedNodeEnv = "development";
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			NODE_ENV: mockedNodeEnv,
		});
		const answers = await setNodeEnvironment();

		expect(answers.NODE_ENV).toBe(mockedNodeEnv);
	});
});
