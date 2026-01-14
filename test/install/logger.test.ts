/**
 * Tests for Logger Utilities
 * @module test/install/logger.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	banner,
	blank,
	command,
	debug,
	error,
	header,
	info,
	keyValue,
	setVerbose,
	step,
	subHeader,
	success,
	warn,
} from "~/src/install/utils/logger";

describe("logger", () => {
	let consoleSpy: ReturnType<typeof vi.spyOn>;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		setVerbose(false);
	});

	afterEach(() => {
		consoleSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	describe("setVerbose", () => {
		it("enables verbose mode", () => {
			setVerbose(true);
			debug("test message");
			expect(consoleSpy).toHaveBeenCalled();
		});

		it("disables verbose mode", () => {
			setVerbose(false);
			debug("test message");
			expect(consoleSpy).not.toHaveBeenCalled();
		});
	});

	describe("info", () => {
		it("logs info message to console", () => {
			info("test info");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0]?.[0] ?? "")).toContain(
				"test info",
			);
		});
	});

	describe("success", () => {
		it("logs success message to console", () => {
			success("test success");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0]?.[0] ?? "")).toContain(
				"test success",
			);
		});
	});

	describe("warn", () => {
		it("logs warning message to console", () => {
			warn("test warning");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0]?.[0] ?? "")).toContain(
				"test warning",
			);
		});
	});

	describe("error", () => {
		it("logs error message to console.error", () => {
			error("test error");
			expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleErrorSpy.mock.calls[0]?.[0] ?? "")).toContain(
				"test error",
			);
		});
	});

	describe("debug", () => {
		it("does not log when verbose is disabled", () => {
			setVerbose(false);
			debug("debug message");
			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it("logs when verbose is enabled", () => {
			setVerbose(true);
			debug("debug message");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0]?.[0] ?? "")).toContain(
				"debug message",
			);
		});
	});

	describe("step", () => {
		it("logs step message with progress", () => {
			step(1, 5, "Step description");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			const loggedString = String(consoleSpy.mock.calls[0]?.[0] ?? "");
			expect(loggedString).toContain("[1/5]");
			expect(loggedString).toContain("Step description");
		});
	});

	describe("header", () => {
		it("logs header with decorations", () => {
			header("Test Header");
			expect(consoleSpy).toHaveBeenCalled();
			// Check that at least one call contains the header text
			const calls = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0]));
			expect(calls.some((c: string) => c.includes("Test Header"))).toBe(true);
		});
	});

	describe("subHeader", () => {
		it("logs sub-header message", () => {
			subHeader("Test Sub Header");
			expect(consoleSpy).toHaveBeenCalled();
			const calls = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0]));
			expect(calls.some((c: string) => c.includes("Test Sub Header"))).toBe(
				true,
			);
		});
	});

	describe("command", () => {
		it("logs command with prefix", () => {
			command("npm install");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0]?.[0] ?? "")).toContain(
				"npm install",
			);
		});
	});

	describe("keyValue", () => {
		it("logs key-value pair", () => {
			keyValue("Version", "1.0.0");
			expect(consoleSpy).toHaveBeenCalledTimes(1);
			const output = String(consoleSpy.mock.calls[0]?.[0] ?? "");
			expect(output).toContain("Version:");
			expect(output).toContain("1.0.0");
		});
	});

	describe("blank", () => {
		it("logs empty line", () => {
			blank();
			expect(consoleSpy).toHaveBeenCalledWith("");
		});
	});

	describe("banner", () => {
		it("logs banner text", () => {
			banner();
			expect(consoleSpy).toHaveBeenCalled();
			// Banner contains TALAWA text
			const calls = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0]));
			expect(calls.some((c: string) => c.includes("One-Click"))).toBe(true);
		});
	});
});
