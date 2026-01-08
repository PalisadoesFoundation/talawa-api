/**
 * Tests for Install Index Module
 * @module test/install/index.test
 */

import fs from "node:fs";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

import { install } from "~/src/install/index";
import * as logger from "~/src/install/utils/logger";
import * as osDetection from "~/src/install/utils/osDetection";
import * as packageCheck from "~/src/install/utils/packageCheck";

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

// Mock packageCheck with default success
vi.mock("~/src/install/utils/packageCheck", () => ({
	checkPrerequisites: vi.fn(() => [
		{
			name: "git",
			required: true,
			installed: true,
			version: "2.40.0",
			requiredVersion: null,
		},
		{
			name: "node",
			required: true,
			installed: true,
			version: "22.0.0",
			requiredVersion: ">=22.0.0",
		},
	]),
	checkNodeVersion: vi.fn(() => true),
	checkPnpmVersion: vi.fn(() => true),
}));

describe("install", () => {
	let consoleLogSpy: MockInstance;
	let existsSyncSpy: MockInstance;

	beforeEach(() => {
		vi.clearAllMocks();
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);

		// Reset mock implementations to defaults
		vi.mocked(osDetection.detectOS).mockReturnValue("linux");
		vi.mocked(osDetection.isWSL).mockReturnValue(false);
		vi.mocked(osDetection.getPackageManager).mockReturnValue("apt");
		vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
			{
				name: "git",
				required: true,
				installed: true,
				version: "2.40.0",
				requiredVersion: null,
			},
			{
				name: "node",
				required: true,
				installed: true,
				version: "22.0.0",
				requiredVersion: ">=22.0.0",
			},
		]);
		vi.mocked(packageCheck.checkNodeVersion).mockReturnValue(true);
		vi.mocked(packageCheck.checkPnpmVersion).mockReturnValue(true);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		consoleLogSpy.mockRestore();
		existsSyncSpy.mockRestore();
	});

	describe("install function - success paths", () => {
		it("returns success when prerequisites are met with docker mode", async () => {
			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(result.duration).toBeGreaterThanOrEqual(0);
			expect(result.packagesInstalled).toEqual([]);
		});

		it("returns success when prerequisites are met with local mode", async () => {
			const result = await install({
				os: "linux",
				mode: "local",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
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
			expect(logger.setVerbose).toHaveBeenCalledWith(true);
		});

		it("works with windows os", async () => {
			vi.mocked(osDetection.detectOS).mockReturnValue("windows");
			const result = await install({
				os: "windows",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
		});

		it("works with macos os", async () => {
			vi.mocked(osDetection.detectOS).mockReturnValue("macos");
			const result = await install({
				os: "macos",
				mode: "local",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("install function - error paths", () => {
		it("returns error when package.json is not found", async () => {
			existsSyncSpy.mockReturnValue(false);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("package.json not found");
			expect(logger.error).toHaveBeenCalled();
		});

		it("returns error when required prerequisites are missing", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "git",
					required: true,
					installed: false,
					version: null,
					requiredVersion: null,
				},
			]);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Missing prerequisites");
		});

		it("continues when prerequisites missing but skipPrereqs is true", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "git",
					required: true,
					installed: false,
					version: null,
					requiredVersion: null,
				},
			]);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: true,
				verbose: false,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("install function - version warnings", () => {
		it("shows warning when node version does not match", async () => {
			vi.mocked(packageCheck.checkNodeVersion).mockReturnValue(false);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(logger.warn).toHaveBeenCalledWith(
				"Node.js version does not match requirement in package.json",
			);
		});

		it("shows warning when pnpm version does not match", async () => {
			vi.mocked(packageCheck.checkPnpmVersion).mockReturnValue(false);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(logger.warn).toHaveBeenCalledWith(
				"pnpm version does not match requirement in package.json",
			);
		});

		it("shows both warnings when both versions do not match", async () => {
			vi.mocked(packageCheck.checkNodeVersion).mockReturnValue(false);
			vi.mocked(packageCheck.checkPnpmVersion).mockReturnValue(false);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(logger.warn).toHaveBeenCalledTimes(2);
		});
	});

	describe("install function - display functions called correctly", () => {
		it("calls banner and display functions", async () => {
			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.banner).toHaveBeenCalled();
			expect(logger.subHeader).toHaveBeenCalledWith("System Information");
			expect(logger.subHeader).toHaveBeenCalledWith("Checking Prerequisites");
		});

		it("displays system information with correct values", async () => {
			vi.mocked(osDetection.getPackageManager).mockReturnValue("brew");
			vi.mocked(osDetection.isWSL).mockReturnValue(true);

			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.keyValue).toHaveBeenCalledWith("Operating System", "linux");
			expect(logger.keyValue).toHaveBeenCalledWith("Package Manager", "brew");
			expect(logger.keyValue).toHaveBeenCalledWith("WSL Detected", "Yes");
			expect(logger.keyValue).toHaveBeenCalledWith(
				"Installation Mode",
				"docker",
			);
		});

		it("displays installation success message", async () => {
			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.success).toHaveBeenCalledWith(
				"Installation check complete!",
			);
			expect(logger.info).toHaveBeenCalledWith("Next steps:");
		});

		it("shows Docker installation message for docker mode", async () => {
			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(logger.subHeader).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});

		it("shows Local installation message for local mode", async () => {
			const result = await install({
				os: "linux",
				mode: "local",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(logger.subHeader).toHaveBeenCalled();
			expect(logger.info).toHaveBeenCalled();
		});
	});

	describe("displayPrerequisites - output formatting", () => {
		it("displays success for installed prerequisites", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "git",
					required: true,
					installed: true,
					version: "2.40.0",
					requiredVersion: null,
				},
			]);

			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			// success should be called for installed prerequisites
			expect(logger.success).toHaveBeenCalled();
		});

		it("displays error for missing prerequisites", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "docker",
					required: false,
					installed: false,
					version: null,
					requiredVersion: null,
				},
			]);

			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.error).toHaveBeenCalled();
		});

		it("handles prerequisite with version info", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "node",
					required: true,
					installed: true,
					version: "22.0.0",
					requiredVersion: ">=20.0.0",
				},
			]);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
			expect(logger.success).toHaveBeenCalled();
		});

		it("handles prerequisite without version", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "pnpm",
					required: true,
					installed: true,
					version: null,
					requiredVersion: null,
				},
			]);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
		});
	});

	describe("install function - edge cases", () => {
		it("handles empty config object", async () => {
			const result = await install({});

			expect(result.success).toBe(true);
		});

		it("handles undefined config", async () => {
			const result = await install(undefined);

			expect(result.success).toBe(true);
		});

		it("handles mixed optional and required prerequisites", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "git",
					required: true,
					installed: true,
					version: "2.40.0",
					requiredVersion: null,
				},
				{
					name: "docker",
					required: false,
					installed: false,
					version: null,
					requiredVersion: null,
				},
				{
					name: "node",
					required: true,
					installed: true,
					version: "22.0.0",
					requiredVersion: ">=20.0.0",
				},
			]);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(true);
		});

		it("fails when any required prerequisite is missing", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "git",
					required: true,
					installed: true,
					version: "2.40.0",
					requiredVersion: null,
				},
				{
					name: "node",
					required: true,
					installed: false,
					version: null,
					requiredVersion: ">=20.0.0",
				},
			]);

			const result = await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Missing prerequisites");
		});
	});

	describe("install function - error output paths", () => {
		it("shows run script message when prerequisites fail", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "git",
					required: true,
					installed: false,
					version: null,
					requiredVersion: null,
				},
			]);

			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.info).toHaveBeenCalledWith(
				"Run the appropriate install script for your OS:",
			);
			expect(logger.info).toHaveBeenCalledWith(
				"  Linux/macOS: ./scripts/install/install.sh",
			);
			expect(logger.info).toHaveBeenCalledWith(
				"  Windows: .\\scripts\\install\\install.ps1",
			);
		});

		it("shows pnpm run setup message on success", async () => {
			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.info).toHaveBeenCalledWith("Please run: pnpm run setup");
			expect(logger.info).toHaveBeenCalledWith(
				"  1. Run 'pnpm run setup' to configure the application",
			);
			expect(logger.info).toHaveBeenCalledWith(
				"  2. Follow the prompts to set up your environment",
			);
		});

		it("displays Docker mode label correctly", async () => {
			await install({
				os: "linux",
				mode: "docker",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.subHeader).toHaveBeenCalledWith(
				"Starting Docker Installation",
			);
			expect(logger.info).toHaveBeenCalledWith(
				"Docker installation mode selected",
			);
		});

		it("displays Local mode label correctly", async () => {
			await install({
				os: "linux",
				mode: "local",
				skipPrereqs: false,
				verbose: false,
			});

			expect(logger.subHeader).toHaveBeenCalledWith(
				"Starting Local Installation",
			);
			expect(logger.info).toHaveBeenCalledWith(
				"Local installation mode selected",
			);
		});
	});

	describe("displayPrerequisites output", () => {
		it("formats prerequisite message with version and requirement", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "node",
					required: true,
					installed: true,
					version: "22.0.0",
					requiredVersion: ">=20.0.0",
				},
			]);

			await install();

			expect(logger.success).toHaveBeenCalledWith(
				"node (v22.0.0) [required: >=20.0.0]",
			);
		});

		it("formats prerequisite message without version", async () => {
			vi.mocked(packageCheck.checkPrerequisites).mockReturnValue([
				{
					name: "curl",
					required: false,
					installed: true,
					version: null,
					requiredVersion: null,
				},
			]);

			await install();

			expect(logger.success).toHaveBeenCalledWith("curl");
		});
	});
});
