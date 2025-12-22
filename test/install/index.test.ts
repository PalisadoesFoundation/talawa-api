/**
 * Tests for Install Index Module
 * @module test/install/index.test
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { install } from "~/src/install/index";

// Mock logger to prevent console output during tests
vi.mock("~/src/install/utils/logger", () => ({
	setVerbose: vi.fn(),
	banner: vi.fn(),
	subHeader: vi.fn(),
	keyValue: vi.fn(),
	blank: vi.fn(),
	info: vi.fn(),
	success: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}));

// Mock osDetection
vi.mock("~/src/install/utils/osDetection", () => ({
	detectOS: vi.fn(() => "linux"),
	isWSL: vi.fn(() => false),
	getPackageManager: vi.fn(() => "apt"),
}));

// Mock packageCheck
vi.mock("~/src/install/utils/packageCheck", () => ({
	checkPrerequisites: vi.fn(() => [
		{ name: "git", required: true, installed: true, version: "2.40.0", requiredVersion: null },
		{ name: "node", required: true, installed: true, version: "22.0.0", requiredVersion: ">=22.0.0" },
	]),
	checkNodeVersion: vi.fn(() => true),
	checkPnpmVersion: vi.fn(() => true),
}));

describe("install", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("install function", () => {
		it("returns success when prerequisites are met", async () => {
			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThanOrEqual(0);
		});

		it("uses default config when called without options", async () => {
			const result = await install();

			expect(result.success).toBe(true);
		});

		it("enables verbose mode when specified", async () => {
			const result = await install({
				os: "linux",
				mode: "local",
				skipPrereqs: false,
				verbose: true,
			});

			expect(result.success).toBe(true);
		});
	});
});
