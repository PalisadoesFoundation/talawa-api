import { afterEach, describe, expect, it, vi } from "vitest";
import { MetricsCacheService, metricsCacheProxy } from "~/src/services/metrics";

describe("metrics/index exports", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});
	it("should export MetricsCacheService", () => {
		expect(MetricsCacheService).toBeDefined();
		expect(typeof MetricsCacheService).toBe("function");
	});

	it("should export metricsCacheProxy", () => {
		expect(metricsCacheProxy).toBeDefined();
		expect(typeof metricsCacheProxy).toBe("function");
	});

	it("should allow importing MetricsCacheService", async () => {
		const { MetricsCacheService: ImportedService } = await import(
			"~/src/services/metrics"
		);
		expect(ImportedService).toBe(MetricsCacheService);
	});

	it("should allow importing metricsCacheProxy", async () => {
		const { metricsCacheProxy: ImportedProxy } = await import(
			"~/src/services/metrics"
		);
		expect(ImportedProxy).toBe(metricsCacheProxy);
	});

	it("should export all expected items", () => {
		// Verify no circular dependencies by checking imports work
		expect(() => {
			// Verify both exports are accessible (this test verifies imports don't throw)
			expect(MetricsCacheService).toBeDefined();
			expect(metricsCacheProxy).toBeDefined();
		}).not.toThrow();
	});
});
