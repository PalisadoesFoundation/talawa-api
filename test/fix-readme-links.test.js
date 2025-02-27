import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import replaceLinks from "./fix-readme-links";

vi.mock("node:fs");
vi.mock("node:path");

describe("replaceLinks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
		vi.mocked(path.resolve).mockImplementation((path) => path);
		// Mock console.error to track its calls
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	test("handles non-array return from readdirSync with warning message", () => {
		vi.mocked(fs.readdirSync).mockReturnValue({});

		replaceLinks("./invalid-dir");

		expect(console.error).toHaveBeenCalledWith(
			"Please enter a valid directory path",
		);
		expect(fs.readFileSync).not.toHaveBeenCalled();
		expect(fs.writeFileSync).not.toHaveBeenCalled();
	});

	test("processes markdown files when valid directory provided", () => {
		const mockFiles = ["test.md"];
		vi.mocked(fs.readdirSync).mockReturnValue(mockFiles);
		vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false });

		const mockContent = "Some text [Link](../README.md)";
		const expectedContent = "Some text [Admin Docs](/)";

		vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

		replaceLinks("./test-dir");

		expect(console.error).not.toHaveBeenCalled();
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"./test-dir/test.md",
			expectedContent,
			"utf8",
		);
	});

	test("handles empty array of files", () => {
		vi.mocked(fs.readdirSync).mockReturnValue([]);

		replaceLinks("./empty-dir");

		expect(fs.readdirSync).toHaveBeenCalledWith("./empty-dir");
		expect(fs.readFileSync).not.toHaveBeenCalled();
		expect(fs.writeFileSync).not.toHaveBeenCalled();
		expect(console.error).not.toHaveBeenCalled();
	});

	test("handles file system errors", () => {
		vi.mocked(fs.readdirSync).mockImplementation(() => {
			throw new Error("Permission denied");
		});

		expect(() => {
			replaceLinks("./error-dir");
		}).toThrow("Permission denied");

		expect(console.error).toHaveBeenCalled();
	});
});
