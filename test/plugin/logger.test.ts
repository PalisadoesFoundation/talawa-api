import { describe, expect, it } from "vitest";
import { pluginLogger } from "~/src/plugin/logger";

describe("Plugin Logger (placeholder)", () => {
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
});
