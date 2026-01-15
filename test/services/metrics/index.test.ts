import { describe, expect, it } from "vitest";
import { MetricsCacheService, metricsCacheProxy } from "~/src/services/metrics";

describe("metrics/index exports", () => {
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

	it("should have no circular dependency issues with dynamic import", async () => {
		// Verify module can be dynamically imported without circular dependency errors
		const metricsModule = await import("~/src/services/metrics");
		expect(metricsModule).toBeDefined();
		expect(metricsModule.MetricsCacheService).toBeDefined();
		expect(metricsModule.metricsCacheProxy).toBeDefined();
	});
});
