import inquirer from "inquirer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setNodeEnvironment } from "~/src/setup";

vi.mock("inquirer");

describe("Setup -> setNodeEnvironment", () => {
	const originalNodeEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalNodeEnv;
		vi.resetAllMocks();
	});
	it("should update NODE_ENV when selection is made", async () => {
		const mockedNodeEnv = "development";
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			NODE_ENV: mockedNodeEnv,
		});
		await setNodeEnvironment();

		expect(process.env.NODE_ENV).toBe(mockedNodeEnv);
	});

	it("should prompt the user for NODE_ENV when NODE_ENV is 'test'", async () => {
		const mockedNodeEnv = "production";
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			NODE_ENV: mockedNodeEnv,
		});
		process.env.NODE_ENV = "test";

		await setNodeEnvironment();

		expect(process.env.NODE_ENV).toBe(mockedNodeEnv);
	});

	it("should set NODE_ENV to 'development' by default when NODE_ENV is 'test' and no selection is made", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			NODE_ENV: "development",
		});

		process.env.NODE_ENV = "test";

		await setNodeEnvironment();

		expect(process.env.NODE_ENV).toBe("development");
	});
});
