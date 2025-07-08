import fs from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { pluginLogger } from "~/src/plugin/logger";

describe("Plugin Logger", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("should have info, error, warn, debug, and lifecycle methods", () => {
		expect(typeof pluginLogger.info).toBe("function");
		expect(typeof pluginLogger.error).toBe("function");
		expect(typeof pluginLogger.warn).toBe("function");
		expect(typeof pluginLogger.debug).toBe("function");
		expect(typeof pluginLogger.lifecycle).toBe("function");
	});

	it("should call logger methods without throwing", async () => {
		expect(() => pluginLogger.info("test")).not.toThrow();
		expect(() => pluginLogger.error("test")).not.toThrow();
		expect(() => pluginLogger.warn("test")).not.toThrow();
		expect(() => pluginLogger.debug("test")).not.toThrow();
		await expect(
			pluginLogger.lifecycle("event", "plugin"),
		).resolves.not.toThrow();
	});

	it("should fallback to console if file writing fails", async () => {
		const appendFileSpy = vi
			.spyOn(fs, "appendFile")
			.mockRejectedValue(new Error("fail"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await pluginLogger.info("test message", { foo: "bar" });
		await pluginLogger.error("test error", { bar: "baz" });
		await pluginLogger.warn("test warn");
		await pluginLogger.debug("test debug");
		await pluginLogger.lifecycle("PHASE", "pluginId", { details: 1 });

		expect(appendFileSpy).toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(consoleLogSpy).toHaveBeenCalled();
	});

	it("should clear the log file", async () => {
		const writeFileSpy = vi.spyOn(fs, "writeFile").mockResolvedValue();
		await pluginLogger.clearLog();
		expect(writeFileSpy).toHaveBeenCalled();
	});

	it("should handle error when clearing log file fails", async () => {
		const writeFileSpy = vi
			.spyOn(fs, "writeFile")
			.mockRejectedValue(new Error("fail"));
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		await pluginLogger.clearLog();
		expect(writeFileSpy).toHaveBeenCalled();
		expect(consoleErrorSpy).toHaveBeenCalled();
	});
});
