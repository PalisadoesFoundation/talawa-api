import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import replaceLinks from "../fix-readme-links";

vi.mock("node:fs");
vi.mock("node:path");

describe("replaceLinks", () => {
    const mockConsole = {
        log: vi.spyOn(console, "log").mockImplementation(() => {}),
        error: vi.spyOn(console, "error").mockImplementation(() => {})
    };

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.DOCS_DIR = "./test-docs";

        // Mock all required fs functions with proper implementations
        vi.mocked(fs.readdirSync).mockReturnValue(["file.md", "subdir"]);
        vi.mocked(fs.lstatSync).mockImplementation((path) => ({
            isDirectory: () => path.endsWith("subdir")
        }));
        vi.mocked(fs.readFileSync).mockReturnValue("[Test](../README.md)");
        vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);

        // Mock path functions
        vi.mocked(path.resolve).mockReturnValue("/test/docs");
        vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
    });

    afterEach(() => {
        process.env.DOCS_DIR = undefined;
    });

    test("processes markdown files and replaces README links", () => {
        replaceLinks("/test/docs");

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            "/test/docs/file.md",
            "[Test](/)",
            "utf8"
        );
        expect(mockConsole.log).toHaveBeenCalledWith(
            "Processing directory: /test/docs"
        );
    });

    test("recursively processes subdirectories", () => {
        replaceLinks("/test/docs");

        expect(fs.readdirSync).toHaveBeenCalledTimes(2);
        expect(fs.readdirSync).toHaveBeenCalledWith("/test/docs");
        expect(fs.readdirSync).toHaveBeenCalledWith("/test/docs/subdir");
    });

    test("handles file system errors", () => {
        vi.mocked(fs.readdirSync).mockImplementation(() => {
            throw new Error("Test error");
        });

        expect(() => replaceLinks("/test/docs")).toThrow("Test error");
        expect(mockConsole.error).toHaveBeenCalled();
    });
});