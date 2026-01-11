import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");

import inquirer from "inquirer";
import {
	promptConfirm,
	promptInput,
	promptList,
} from "scripts/setup/promptHelpers";

describe("promptHelpers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("promptInput", () => {
		it("should return user input for basic usage", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testName: "user input value",
			});

			const result = await promptInput("testName", "Enter value:");

			expect(result).toBe("user input value");
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "input",
					name: "testName",
					message: "Enter value:",
					default: undefined,
					validate: undefined,
				},
			]);
		});

		it("should use default value when provided", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testName: "default value",
			});

			const result = await promptInput(
				"testName",
				"Enter value:",
				"default value",
			);

			expect(result).toBe("default value");
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "input",
					name: "testName",
					message: "Enter value:",
					default: "default value",
					validate: undefined,
				},
			]);
		});

		it("should pass validation function to inquirer", async () => {
			const validateFn = (input: string): true | string => {
				if (input.length < 3) return "Input must be at least 3 characters";
				return true;
			};

			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testName: "valid input",
			});

			const result = await promptInput(
				"testName",
				"Enter value:",
				undefined,
				validateFn,
			);

			expect(result).toBe("valid input");
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "input",
					name: "testName",
					message: "Enter value:",
					default: undefined,
					validate: validateFn,
				},
			]);
		});

		it("should throw error when response is not a string (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testName: 123,
			});

			await expect(promptInput("testName", "Enter value:")).rejects.toThrow(
				'Expected string response for prompt "testName"',
			);
		});

		it("should throw error when response is undefined (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({});

			await expect(promptInput("testName", "Enter value:")).rejects.toThrow(
				'Expected string response for prompt "testName"',
			);
		});

		it("should propagate inquirer errors (e.g., user cancellation)", async () => {
			vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(
				new Error("User force closed the prompt"),
			);

			await expect(promptInput("testName", "Enter value:")).rejects.toThrow(
				"User force closed the prompt",
			);
		});
	});

	describe("promptList", () => {
		it("should return selected choice for basic usage", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testChoice: "option2",
			});

			const result = await promptList("testChoice", "Select option:", [
				"option1",
				"option2",
				"option3",
			]);

			expect(result).toBe("option2");
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "list",
					name: "testChoice",
					message: "Select option:",
					choices: ["option1", "option2", "option3"],
					default: undefined,
				},
			]);
		});

		it("should use default value when provided", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testChoice: "option1",
			});

			const result = await promptList(
				"testChoice",
				"Select option:",
				["option1", "option2"],
				"option1",
			);

			expect(result).toBe("option1");
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "list",
					name: "testChoice",
					message: "Select option:",
					choices: ["option1", "option2"],
					default: "option1",
				},
			]);
		});

		it("should work with empty choices array", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testChoice: "",
			});

			const result = await promptList("testChoice", "Select option:", []);

			expect(result).toBe("");
		});

		it("should throw error when response is not a string (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				testChoice: null,
			});

			await expect(
				promptList("testChoice", "Select option:", ["a", "b"]),
			).rejects.toThrow('Expected string response for prompt "testChoice"');
		});

		it("should throw error when response key is missing (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				wrongKey: "value",
			});

			await expect(
				promptList("testChoice", "Select option:", ["a", "b"]),
			).rejects.toThrow('Expected string response for prompt "testChoice"');
		});

		it("should propagate inquirer errors", async () => {
			vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(
				new Error("Prompt was interrupted"),
			);

			await expect(
				promptList("testChoice", "Select option:", ["a"]),
			).rejects.toThrow("Prompt was interrupted");
		});
	});

	describe("promptConfirm", () => {
		it("should return true when user confirms", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				confirmed: true,
			});

			const result = await promptConfirm("confirmed", "Are you sure?");

			expect(result).toBe(true);
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "confirm",
					name: "confirmed",
					message: "Are you sure?",
					default: undefined,
				},
			]);
		});

		it("should return false when user denies", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				confirmed: false,
			});

			const result = await promptConfirm("confirmed", "Are you sure?");

			expect(result).toBe(false);
		});

		it("should use default true when provided", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				confirmed: true,
			});

			const result = await promptConfirm("confirmed", "Are you sure?", true);

			expect(result).toBe(true);
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "confirm",
					name: "confirmed",
					message: "Are you sure?",
					default: true,
				},
			]);
		});

		it("should use default false when provided", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				confirmed: false,
			});

			const result = await promptConfirm("confirmed", "Are you sure?", false);

			expect(result).toBe(false);
			expect(inquirer.prompt).toHaveBeenCalledWith([
				{
					type: "confirm",
					name: "confirmed",
					message: "Are you sure?",
					default: false,
				},
			]);
		});

		it("should throw error when response is not a boolean (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				confirmed: "yes",
			});

			await expect(promptConfirm("confirmed", "Are you sure?")).rejects.toThrow(
				'Expected boolean response for prompt "confirmed"',
			);
		});

		it("should throw error when response is null (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
				confirmed: null,
			});

			await expect(promptConfirm("confirmed", "Are you sure?")).rejects.toThrow(
				'Expected boolean response for prompt "confirmed"',
			);
		});

		it("should throw error when response key is missing (runtime type guard)", async () => {
			vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({});

			await expect(promptConfirm("confirmed", "Are you sure?")).rejects.toThrow(
				'Expected boolean response for prompt "confirmed"',
			);
		});

		it("should propagate inquirer errors (user cancellation)", async () => {
			vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(
				new Error("User cancelled"),
			);

			await expect(promptConfirm("confirmed", "Are you sure?")).rejects.toThrow(
				"User cancelled",
			);
		});
	});
});
